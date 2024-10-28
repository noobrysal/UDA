import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
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

const supabaseUrl = 'https://kohjcrdirmvamsjcefew.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvaGpjcmRpcm12YW1zamNlZmV3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyNzMzMDYxMywiZXhwIjoyMDQyOTA2NjEzfQ.dcjFj_XWSg_Zq8BJQSnI_SfqzjtuG98cu3nZSIzgfBo';
const supabase = createClient(supabaseUrl, supabaseKey);

const DateTest = () => {
    const { date } = useParams();  // URL date in YYYY-MM-DD format
    const [airData, setAirData] = useState([]);
    const [selectedHour, setSelectedHour] = useState('00'); // Default to the first hour
    const navigate = useNavigate(); // Initialize useNavigate

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
        if (value <= safe) return 'rgba(75, 192, 192, 1)'; // Safe
        if (value <= warning) return 'rgba(255, 206, 86, 1)'; // Warning
        return 'rgba(255, 99, 132, 1)'; // Danger
    };

    const createChartConfig = (label, data, metric) => {
        return {
            labels: filteredData.map(item => new Date(item.date).toISOString().split('T')[1].substring(0, 8)), // Format to HH:MM:SS
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
            const index = chartElement[0].index; // Get the index of the clicked data point
            const selectedInstance = filteredData[index]; // Get the corresponding instance
            if (selectedInstance) {
                navigate(`/air-quality/datetest/id/${selectedInstance.id}`); // Navigate to the instance detail page
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
                    <div className="chart-container">
                        <Line
                            data={createChartConfig('PM2.5', filteredData.map(item => ({ value: item.pm25, id: item.id })), 'pm25')}
                            options={{
                                responsive: true,
                                plugins: {
                                    legend: { position: 'top' },
                                    tooltip: {
                                        callbacks: {
                                            label: function (tooltipItem) {
                                                return `Value: ${tooltipItem.raw}`; // Customize tooltip as needed
                                            },
                                        },
                                    },
                                },
                                onClick: handlePointClick, // Add onClick handler here
                            }}
                        />
                        <Legend thresholds={thresholds.pm25} />
                    </div>
                    {/* Add other charts for PM10, humidity, temperature, etc. as needed */}
                </>
            ) : (
                <p>No data found for this date.</p>
            )}
            <ToastContainer />
        </div>
    );
};

export default DateTest;
