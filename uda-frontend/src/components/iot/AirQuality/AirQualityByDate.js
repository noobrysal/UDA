import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
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

const getAirQualityByDate = (date) => {
    return axios.get(`http://127.0.0.1:8000/air-quality/?date=${date}`)
        .then(response => response.data)
        .catch(error => {
            console.error('Error fetching air quality:', error);
            if (error.response && error.response.status === 404) {
                toast.error('Data not found.');
            } else {
                toast.error('Error fetching air quality: ${error.message}');
            }
            throw error;
        });
};

const AirQualityByDate = () => {
    const { date } = useParams();  // Get the date from the URL
    const [airData, setAirData] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        let mounted = true;
        getAirQualityByDate(date)
            .then(data => {
                if (mounted) {
                    setAirData(data);
                }
            })
            .catch(error => {
                console.error('Error fetching air quality:', error);
                toast.error('Error fetching air quality: ${ error.message }');
            });

        return () => mounted = false;
    }, [date]);

    const thresholds = {
        pm2_5: { safe: 12, warning: 35.4, danger: 55.4 },
        pm10: { safe: 54, warning: 154, danger: 254 },
        co2: { safe: 1000, warning: 2000, danger: 5000 },
        humidity: { safe: 40, warning: 60, danger: 80 },
        temperature: { safe: 20, warning: 30, danger: 40 }
    };

    const getColor = (value, metric) => {
        const { safe, warning, danger } = thresholds[metric];
        if (value <= safe) return 'rgba(75, 192, 192, 1)';
        if (value <= warning) return 'rgba(255, 206, 86, 1)';
        return 'rgba(255, 99, 132, 1)';
    };

    const createChartConfig = (label, data, metric) => ({
        labels: airData.map(item => item.timestamp.split('T')[1]),
        datasets: [
            {
                label: label + ' Average Level',
                data: data.map(item => item.value),
                borderColor: 'rgba(0, 0, 0, 1)',
                borderWidth: 1,
                backgroundColor: data.map(item => getColor(item.value, metric)),
                fill: false,
                pointBackgroundColor: data.map(item => getColor(item.value, metric)),
                pointBorderColor: 'rgba(0, 0, 0, 1)',
                pointRadius: 8,
            },
        ],
    });

    const handlePointClick = (event, elements, chart) => {
        if (elements[0]) {
            const elementIndex = elements[0].index;  // Get index of clicked point
            const itemId = airData[elementIndex].id;  // Find the ID of the data point
            navigate(`/air-quality/${itemId}`);  // Navigate to the instance page
        }
    };

    const chartOptions = (title) => ({
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: title,
            },
        },
        onClick: (event, elements, chart) => {
            if (elements[0]) {
                handlePointClick(event, elements, chart);  // Call the click handler
            }
        },
    });

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

    return (
        <div className="container-fluid">
            <h2>Air Quality Data for {date}</h2>
            {airData.length > 0 ? (
                <>
                    <div className="chart-container">
                        <Line
                            data={createChartConfig('PM2.5', airData.map(item => ({ value: item.pm2_5, id: item.id })), 'pm2_5')}
                            options={chartOptions('PM2.5 Levels')}
                        />
                        <Legend thresholds={thresholds.pm2_5} />
                    </div>
                    <div className="chart-container">
                        <Line
                            data={createChartConfig('PM10', airData.map(item => ({ value: item.pm10, id: item.id })), 'pm10')}
                            options={chartOptions('PM10 Levels')}
                        />
                        <Legend thresholds={thresholds.pm10} />
                    </div>
                    <div className="chart-container">
                        <Line
                            data={createChartConfig('CO2', airData.map(item => ({ value: item.co2, id: item.id })), 'co2')}
                            options={chartOptions('CO2 Levels')}
                        />
                        <Legend thresholds={thresholds.co2} />
                    </div>
                    <div className="chart-container">
                        <Line
                            data={createChartConfig('Humidity', airData.map(item => ({ value: item.humidity, id: item.id })), 'humidity')}
                            options={chartOptions('Humidity Levels')}
                        />
                        <Legend thresholds={thresholds.humidity} />
                    </div>
                    <div className="chart-container">
                        <Line
                            data={createChartConfig('Temperature', airData.map(item => ({ value: item.temperature, id: item.id })), 'temperature')}
                            options={chartOptions('Temperature Levels')}
                        />
                        <Legend thresholds={thresholds.temperature} />
                    </div>
                </>
            ) : (
                <p>No data found for this date.</p>
            )}
            <ToastContainer />
        </div>
    );
};

export default AirQualityByDate;