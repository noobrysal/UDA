import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Line } from 'react-chartjs-2';
import Sidebar from '../../Sidebar';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Colors,
} from 'chart.js';

const plugin = {
    id: "increase-legend-spacing",
    beforeInit(chart) {
        const originalFit = chart.legend.fit;
        chart.legend.fit = function () {
            originalFit.call(chart.legend);
            this.height += 35;
        };
    }
};

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    plugin
);

const AirQualityByDate = () => {
    const { date, locationId } = useParams(); // Retrieve locationId from the URL
    const [airData, setAirData] = useState([]);
    const [selectedHour, setSelectedHour] = useState('00');
    const [selectedLocation, setSelectedLocation] = useState(locationId || '1');  // Default to locationId from URL or 1
    const navigate = useNavigate();

    const locations = [
        { id: 1, name: 'Lapasan' },
        { id: 2, name: 'Agusan' },
        { id: 3, name: 'USTP-CDO' },
        { id: 4, name: 'El Salvador' },
        { id: 5, name: 'Sports Complex' },
    ];

    const location = locations.find(loc => loc.id === parseInt(selectedLocation));
    const locationName = location ? location.name : 'Unknown Location';

    const thresholds = {
        pm25: [
            { max: 25, label: "Good", color: "rgba(75, 192, 192, 1)" },
            { max: 35, label: "Fair", color: "rgba(154, 205, 50, 1)" },
            { max: 45, label: "Unhealthy", color: "rgba(255, 206, 86, 1)" },
            { max: 55, label: "Very Unhealthy", color: "rgba(255, 140, 0, 1)" },
            { max: 90, label: "Severely Unhealthy", color: "rgba(255, 99, 132, 1)" },
            { max: Infinity, label: "Emergency", color: "rgba(139, 0, 0, 1)" },
        ],
        pm10: [
            { max: 50, label: "Good", color: "rgba(75, 192, 192, 1)" },
            { max: 100, label: "Fair", color: "rgba(154, 205, 50, 1)" },
            { max: 150, label: "Unhealthy", color: "rgba(255, 206, 86, 1)" },
            { max: 200, label: "Very Unhealthy", color: "rgba(255, 140, 0, 1)" },
            { max: 300, label: "Severely Unhealthy", color: "rgba(255, 99, 132, 1)" },
            { max: Infinity, label: "Emergency", color: "rgba(139, 0, 0, 1)" },
        ],
        humidity: [
            { max: 24, label: "Poor", color: "rgba(139, 0, 0, 1)" },
            { max: 30, label: "Fair", color: "rgba(255, 206, 86, 1)" },
            { max: 60, label: "Good", color: "rgba(75, 192, 192, 1)" },
            { max: 70, label: "Fair", color: "rgba(154, 205, 50, 1)" },
            { max: Infinity, label: "Poor", color: "rgba(255, 99, 132, 1)" },
        ],
        temperature: [
            { max: 33, label: "Good", color: "rgba(75, 192, 192, 1)" },
            { max: 41, label: "Caution", color: "rgba(255, 206, 86, 1)" },
            { max: 54, label: "Danger", color: "rgba(255, 140, 0, 1)" },
            { max: Infinity, label: "Extreme Danger", color: "rgba(139, 0, 0, 1)" },
        ],
        oxygen: [
            { max: Infinity, label: "Safe", color: "rgba(75, 192, 192, 1)" },
            { max: 19.5, label: "Poor", color: "rgba(255, 206, 86, 1)" },
        ],
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data, error } = await supabase
                    .from('sensors')
                    .select('*')
                    .gte('date', `${date}T00:00:00+00`)
                    .lt('date', `${date}T23:59:59.999+00`)
                    .eq('locationId', selectedLocation); // Filter by selectedLocation

                if (error) throw error;
                setAirData(data);
            } catch (error) {
                console.error('Error fetching air quality:', error);
                toast.error(`Error fetching air quality: ${error.message}`);
            }
        };

        fetchData();
    }, [date, selectedLocation]); // Include selectedLocation in dependency array

    const getFilteredData = (data) => {
        return data.filter(item => {
            const itemHour = new Date(item.date).getUTCHours().toString().padStart(2, '0');
            return itemHour === selectedHour;
        });
    };

    const filteredData = getFilteredData(airData);

    const getColor = (value, metric) => {
        const level = thresholds[metric].find((threshold) => value <= threshold.max);
        return level ? level.color : "rgba(0, 0, 0, 1)";
    };


    const createChartConfig = (label, data, metric) => {
        return {
            labels: filteredData.map(item => {
                const time = new Date(item.date).toLocaleString('en-US', {
                    timeZone: 'UTC',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: true,
                });
                return time; // Will return time like "5:45:04 AM"
            }),
            datasets: [{
                label: label + ' Average Level',
                data: data.map(item => item.value),
                borderColor: 'rgba(0, 0, 0, 1)',
                borderWidth: 1,
                backgroundColor: data.map(item => getColor(item.value, metric)),
                pointBackgroundColor: data.map(item => getColor(item.value, metric)),
                pointBorderColor: 'rgba(0, 0, 0, 1)',
                fill: false,
                pointRadius: 8,
                pointHoverRadius: 10,
            }],
        };
    };


    const Legend = ({ thresholds, filteredData, metric }) => {
        // Ensure filteredData is defined and has length
        if (!filteredData || filteredData.length === 0) {
            return (
                <div style={{ textAlign: 'right', padding: '10px', borderRadius: '5px' }}>
                    <h2>No data available for {metric.toUpperCase()}</h2>
                </div>
            );
        }

        // Get the latest value for the metric
        const latestData = filteredData[filteredData.length - 1];
        const value = latestData ? latestData[metric] : null;

        // Determine the status based on thresholds
        const getStatus = (value, metric) => {

            // Find the level based on the value
            const level = thresholds.find((threshold) => value <= threshold.max);

            // Return the label if level is found, otherwise "Unknown"
            return level ? level.label : "Unknown";
        };


        const status = (value && metric) ? getStatus(value, metric) : 'No data';
        const backgroundColor = value !== null ? getColor(value, metric) : 'transparent';

        return (
            <div style={{ display: 'inline-flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                {/* Legend Container */}
                <div className="legend-container" style={{ marginRight: '20px', width: '50%' }}>
                    {thresholds.map((threshold, index) => (
                        <div key={index} style={{ backgroundColor: threshold.color, padding: '5px', borderRadius: '5px', display: 'block', marginBottom: '3px', color: '#f5f5f5' }}>
                            <span style={{ fontWeight: 'bold' }}>{threshold.label}</span>: ≤ {threshold.max}
                        </div>
                    ))}
                </div>



                {/* Narrative Report Container */}
                <div style={{ textAlign: 'right', padding: '10px', borderRadius: '5px', width: '50%' }}>
                    <h4>
                        {'Average ' + metric.toUpperCase()} level for this hour is{' '}
                        {value ? (
                            <>
                                {value}<br></br>
                                <span
                                    style={{
                                        backgroundColor: backgroundColor,
                                        padding: '2px 5px',
                                        borderRadius: '7px',
                                        color: 'colors.Black',

                                    }}
                                >
                                    ({status})
                                </span>

                            </>
                        ) : (
                            'No data'
                        )}
                    </h4>
                </div>
            </div>
        );
    };

    const handlePointClick = (event, chartElement) => {
        if (chartElement && chartElement.length > 0) {
            const index = chartElement[0].index;
            const selectedInstance = filteredData[index];
            if (selectedInstance) {
                navigate(`/air-quality/id/${selectedInstance.id}`);
            }
        }
    };

    return (
        <Sidebar>
            <div className="container-fluid">
                <h2>Air Quality Data for {date} at {locationName}</h2>

                <div className="dropdowns-container">
                    {/* Location Dropdown */}
                    <div className="form-group">
                        <label htmlFor="locationSelect">Select Location:</label>
                        <select
                            id="locationSelect"
                            className="form-control"
                            value={selectedLocation}
                            onChange={(e) => setSelectedLocation(e.target.value)}
                        >
                            {locations.map((location) => (
                                <option key={location.id} value={location.id}>
                                    {location.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Hour Dropdown */}
                    <div className="form-group">
                        <label htmlFor="hourSelect">Select Hour:</label>
                        <select
                            id="hourSelect"
                            className="form-control"
                            value={selectedHour}
                            onChange={(e) => setSelectedHour(e.target.value)}
                        >
                            {Array.from({ length: 24 }, (_, i) => (
                                <option key={i} value={i.toString().padStart(2, '0')}>
                                    {i.toString().padStart(2, '0')}:00
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {filteredData.length > 0 ? (
                    <div className="charts-flex-container">
                        {['pm25', 'pm10', 'humidity', 'temperature', 'oxygen'].map((metric, index) => (
                            <div key={index} className="chart-item">
                                <div className="chart-container">
                                    <Line
                                        data={createChartConfig(metric.toUpperCase(), filteredData.map(item => ({ value: item[metric], id: item.id })), metric)}
                                        options={{
                                            responsive: true,
                                            spanGaps: true,
                                            plugins: {
                                                legend: { position: 'top' },
                                                tooltip: {
                                                    callbacks: {
                                                        label: function (tooltipItem) {
                                                            const value = tooltipItem.raw;
                                                            const metricThresholds = thresholds[metric];

                                                            // Find the appropriate threshold for the current value
                                                            const matchedThreshold = metricThresholds.find((threshold) => value <= threshold.max);

                                                            // Get the label or fallback to "Emergency" if no match is found
                                                            const thresholdRemark = matchedThreshold ? matchedThreshold.label : 'Emergency';

                                                            return [`Value: ${value}`, `Status: ${thresholdRemark}`];
                                                        },
                                                    },
                                                },
                                                title: {
                                                    display: true,
                                                    text: `${metric.toUpperCase()} Levels`,
                                                    padding: { bottom: 10 },
                                                },
                                            },
                                            onClick: handlePointClick,
                                        }}

                                    />
                                    <Legend thresholds={thresholds[metric]} filteredData={filteredData} metric={metric} />
                                </div>
                            </div>
                        ))}

                    </div>
                ) : (
                    <p>No data found for this hour and date.</p>
                )}

                <ToastContainer />
                <style jsx>{`
                .h2 {
                    width: 50%;
                }
                .dropdowns-container {
                    display: flex;
                    gap: 20px;
                    align-items: flex-end;
                    margin-bottom: 20px;
                    flex-wrap: wrap;
                }
                    
                .charts-flex-container {
                    display: flex;
                    flex-wrap: wrap;
                    justify-content: space-around;
                    gap: 20px;
                }

                .chart-item {
                    width: 100%;
                    max-width: 500px;
                    margin: 20px 0;
                    border-radius: 10px;
                    
                }

                .chart-container {
                    padding: 20px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.5);
                    border-radius: 10px;
                    background-color: #fff;
                }

                .legend-container {
                    display: 'flex'
                    margin-top: 10px;
                    font-size: 14px;
                    color: #333;
                }
                .container-fluid {
                background-color:#808080;
                }
            `}</style>
            </div>
        </Sidebar>
    );
};

export default AirQualityByDate;