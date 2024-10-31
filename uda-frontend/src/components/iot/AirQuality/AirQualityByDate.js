import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Line } from 'react-chartjs-2';

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);


const AirQualityByDate = () => {
    const { date } = useParams();
    const [airData, setAirData] = useState([]);
    const [selectedHour, setSelectedHour] = useState('00');
    const navigate = useNavigate();

    const thresholds = {
        pm25: { safe: 25, warning: 35, danger: 45 },
        pm10: { safe: 50, warning: 100, danger: 150 },
        humidity: { safe: 60, warning: 70, danger: 80 },
        temperature: { safe: 33, warning: 41, danger: 54 },
        oxygen: { safe: 25, warning: 50, danger: 100 },
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data, error } = await supabase
                    .from('sensors')
                    .select('*')
                    .gte('date', `${date}T00:00:00+00`)
                    .lt('date', `${date}T23:59:59.999+00`);

                if (error) throw error;
                setAirData(data);
            } catch (error) {
                console.error('Error fetching air quality:', error);
                toast.error(`Error fetching air quality: ${error.message}`);
            }
        };

        fetchData();
    }, [date]);

    const getFilteredData = (data) => {
        return data.filter(item => {
            const itemHour = new Date(item.date).getUTCHours().toString().padStart(2, '0');
            return itemHour === selectedHour;
        });
    };

    const filteredData = getFilteredData(airData);

    const getColor = (value, metric) => {
        const { safe, warning } = thresholds[metric];
        if (value <= safe) return 'rgba(75, 192, 192, 1)';
        if (value <= warning) return 'rgba(255, 206, 86, 1)';
        return 'rgba(255, 99, 132, 1)';
    };

    const createChartConfig = (label, data, metric) => {
        return {
            labels: filteredData.map(item => new Date(item.date).toISOString().split('T')[1].substring(0, 8)),
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

    const Legend = ({ thresholds }) => (
        <div className="legend-container">
            <div>
                <span style={{ backgroundColor: 'rgba(75, 192, 192, 1)', padding: '5px', borderRadius: '5px' }}>Safe</span>: ≤ {thresholds.safe}
            </div>
            <div>
                <span style={{ backgroundColor: 'rgba(255, 206, 86, 1)', padding: '5px', borderRadius: '5px' }}>Warning</span>: {thresholds.safe + 1} to {thresholds.warning}
            </div>
            <div>
                <span style={{ backgroundColor: 'rgba(255, 99, 132, 1)', padding: '5px', borderRadius: '5px' }}>Danger</span>: ≥ {thresholds.warning}
            </div>
        </div>
    );

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
        <div className="container-fluid">
            <h2>Air Quality Data for {date}</h2>
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

            {filteredData.length > 0 ? (
                <>
                    {['pm25', 'pm10', 'humidity', 'temperature', 'oxygen'].map((metric, index) => (
                        <div key={index} className="chart-container">
                            <Line
                                data={createChartConfig(metric.toUpperCase(), filteredData.map(item => ({ value: item[metric], id: item.id })), metric)}
                                options={{
                                    responsive: true,
                                    plugins: {
                                        legend: { position: 'top' },
                                        tooltip: {
                                            callbacks: {
                                                label: function (tooltipItem) {
                                                    const value = tooltipItem.raw;
                                                    const thresholdRemark = Object.keys(thresholds[metric]).find(
                                                        (key) => value <= thresholds[metric][key]
                                                    ) || 'Emergency';
                                                    return [`Value: ${value}`, `Status: ${thresholdRemark}`];
                                                },
                                            },
                                        },
                                        title: { display: true, text: `${metric.toUpperCase()} Levels` },
                                    },
                                    onClick: handlePointClick,
                                }}
                            />
                            <Legend thresholds={thresholds[metric]} />
                        </div>
                    ))}
                </>
            ) : (
                <p>No data found for this date.</p>
            )}
            <ToastContainer />
        </div>
    );
};

export default AirQualityByDate;
