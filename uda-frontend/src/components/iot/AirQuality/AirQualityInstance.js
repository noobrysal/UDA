import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { supabase } from './supabaseClient';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

// Initialize Supabase client


// Function to fetch air quality data by ID
const getAirQualityById = async (id) => {
    const { data, error } = await supabase
        .from('sensors')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching air quality:', error);
        toast.error(`Error fetching air quality: ${error.message}`);
        throw error;
    }
    return data;
};

// Thresholds for air quality metrics
const thresholds = {
    pm25: { safe: 25, warning: 35, danger: 45 },
    pm10: { safe: 50, warning: 100, danger: 150 },
    humidity: { safe: 60, warning: 70, danger: 80 },
    temperature: { safe: 33, warning: 41, danger: 54 },
    oxygen: { safe: 25, warning: 20, danger: 15 },
};

// Function to get color based on metric thresholds
const getColor = (value, metric) => {
    const { safe, warning, danger } = thresholds[metric];
    if (value <= safe) return 'green';
    if (value <= warning) return 'orange';
    return 'red';
};

// Main component to display air quality instance with circular progress bars and legend
const AirQualityInstance = () => {
    const { id } = useParams();
    const [airData, setAirData] = useState(null);

    useEffect(() => {
        let mounted = true;
        getAirQualityById(id)
            .then(data => {
                if (mounted) {
                    setAirData(data);
                }
            })
            .catch(error => {
                console.error('Error fetching air quality:', error);
                toast.error(`Error fetching air quality: ${error.message}`);
            });

        return () => mounted = false;
    }, [id]);

    const renderProgressBar = (value, metric, label) => {
        const percentage = Math.min((value / thresholds[metric].danger) * 100, 100); // Cap at 100%
        const color = getColor(value, metric);

        return (
            <div className="progress-container" style={{ width: '120px', margin: '20px', textAlign: 'center' }}>
                <CircularProgressbar
                    value={percentage}
                    text={`${value}`}
                    styles={buildStyles({
                        pathColor: color,
                        textColor: color,
                        trailColor: '#d6d6d6',
                        backgroundColor: '#3e98c7',
                    })}
                />
                <p>{label}</p>
            </div>
        );
    };

    return (
        <div className="container-fluid">
            <h2>Air Quality Data (ID: {id})</h2>
            {airData ? (
                <div>
                    <p><strong>Recorded at:</strong> {new Date(airData.date).toISOString().slice(0, 19).replace("T", " ")}</p>

                    {/* Legend Section */}
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                        <div style={{ marginRight: '10px' }}><span style={{ color: 'green' }}>●</span> Safe</div>
                        <div style={{ marginRight: '10px' }}><span style={{ color: 'orange' }}>●</span> Warning</div>
                        <div><span style={{ color: 'red' }}>●</span> Danger</div>
                    </div>

                    {/* Progress Bars */}
                    <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap' }}>
                        {renderProgressBar(airData.pm25, 'pm25', 'PM2.5')}
                        {renderProgressBar(airData.pm10, 'pm10', 'PM10')}
                        {renderProgressBar(airData.humidity, 'humidity', 'Humidity')}
                        {renderProgressBar(airData.temperature, 'temperature', 'Temperature')}
                        {renderProgressBar(airData.oxygen, 'oxygen', 'Oxygen')}
                    </div>
                </div>
            ) : (
                <p>Loading...</p>
            )}
            <ToastContainer />
        </div>
    );
};

export default AirQualityInstance;
