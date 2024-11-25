import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { supabase } from './supabaseClient';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import Sidebar from '../../Sidebar';

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

const locations = [
    { id: 1, name: 'Lapasan' },
    { id: 2, name: 'Agusan' },
    { id: 3, name: 'USTP-CDO' },
    { id: 4, name: 'El Salvador' },
    { id: 5, name: 'Sports Complex' },
];

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

// Function to get location name from locationId
const getLocationName = (locationId) => {
    const location = locations.find(loc => loc.id === locationId);
    return location ? location.name : 'Unknown Location';
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
            <div
                className="progress-container"
                style={{
                    width: '150px',
                    margin: '20px',
                    textAlign: 'center',
                    padding: '15px',
                    borderRadius: '10px',
                    backgroundColor: '#f0f0f0', // Light gray background
                    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', // Subtle shadow for depth    
                }}
            >
                <CircularProgressbar
                    value={percentage}
                    text={`${value}`}
                    styles={buildStyles({
                        pathColor: color,
                        textColor: color,
                        trailColor: '#ababab',
                        backgroundColor: '#3e98c7',
                    })}
                />
                <p style={{ marginTop: '10px', fontSize: '14px', fontWeight: 'bold' }}>{label}</p>

                {/* Legend for each metric */}
                <div
                    style={{
                        marginTop: '10px',
                        fontSize: '12px',
                        textAlign: 'left',
                        lineHeight: '1.5',
                    }}
                >
                    <div>
                        <span style={{ color: 'green', fontWeight: 'bold' }}>●</span> Safe: &le; {thresholds[metric].safe}
                    </div>
                    <div>
                        <span style={{ color: 'orange', fontWeight: 'bold' }}>●</span> Warning: &le; {thresholds[metric].warning}
                    </div>
                    <div>
                        <span style={{ color: 'red', fontWeight: 'bold' }}>●</span> Danger: &gt; {thresholds[metric].warning}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <Sidebar>
            <div className="container-fluid">
                <h2>Air Quality Data (ID: {id})</h2>
                {airData ? (
                    <div>
                        <p>
                            <strong>Recorded at:</strong>{' '}
                            {new Date(airData.date).toISOString().slice(0, 19).replace('T', ' ')} on{' '}
                            {getLocationName(airData.locationId)}
                        </p>

                        {/* Progress Bars */}
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'center',
                                flexWrap: 'wrap',
                                gap: '20px',
                            }}
                        >
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
        </Sidebar>
    );
};

export default AirQualityInstance;
