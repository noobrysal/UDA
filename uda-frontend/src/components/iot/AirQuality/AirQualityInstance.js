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

// Updated thresholds for air quality metrics
const thresholds1 = {
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

// Function to get color based on metric thresholds
const getColor = (value, metric) => {
    const thresholds = thresholds1[metric];
    for (let threshold of thresholds) {
        if (value <= threshold.max) {
            return threshold.color;
        }
    }
    return thresholds[thresholds.length - 1].color; // Default to last color if no match
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
    const [hoveredMetric, setHoveredMetric] = useState(null);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

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

    const handleMouseMove = (e) => {
        setMousePosition({ x: e.clientX, y: e.clientY });
    };

    const renderProgressBar = (value, metric, label) => {
        const color = getColor(value, metric);

        return (
            <div
                className="progress-container"
                style={styles.progressContainer}
                onMouseEnter={() => setHoveredMetric({ value, label, metric })}
                onMouseLeave={() => setHoveredMetric(null)}
                onMouseMove={handleMouseMove} // Track mouse movement over the progress bar
            >
                <CircularProgressbar
                    value={value}
                    text={`${value}`}
                    styles={buildStyles({
                        pathColor: color,
                        textColor: color,
                        trailColor: '#ababab',
                        backgroundColor: '#3e98c7',
                    })}
                />
                <p style={styles.p}>{label}</p>

                {/* Render Legend inside progressContainer */}
                <div style={styles.legend}>
                    {thresholds1[metric].map((threshold, index) => (
                        <div key={index} style={styles.legendDiv}>
                            <span style={{ ...styles.legendSpan, backgroundColor: threshold.color }}></span>
                            <span>{threshold.label}: &le; {threshold.max}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    };


    const renderHoverMiniWindow = () => {
        if (!hoveredMetric) return null;
        const { value, label, metric } = hoveredMetric;

        // Logic to find the threshold for the current value
        const matchedThreshold = thresholds1[metric].find(threshold => value <= threshold.max);
        const thresholdRemark = matchedThreshold ? matchedThreshold.label : 'Emergency';

        return (
            <div
                style={{
                    position: 'absolute',
                    top: `${mousePosition.y + 10}px`, // Position it based on mouse Y
                    left: `${mousePosition.x + 10}px`, // Position it based on mouse X
                    transform: 'translate(-50%, -50%)',
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    color: '#fff',
                    padding: '10px',
                    borderRadius: '5px',
                    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
                    zIndex: 1000,
                    pointerEvents: 'none',
                }}
            >
                <strong>{label}:</strong> {value} <br />
                <strong>Status:</strong> {thresholdRemark}
            </div>
        );
    };

    if (!airData) return null;

    return (
        <div style={styles.airQualityInstance}>
            <Sidebar />
            <div style={styles.mainContent}>
                <h1>Air Quality Data (ID: {id})</h1>
                <h2><strong>Recorded at:</strong>{' '}{getLocationName(airData.locationId)}</h2>
                <h2><strong>Recorded on:</strong>{' '}{new Date(airData.date).toISOString().slice(0, 19).replace('T', ' ')}</h2>
                <div style={styles.metrics}>
                    {renderProgressBar(airData.pm25, 'pm25', 'PM2.5')}
                    {renderProgressBar(airData.pm10, 'pm10', 'PM10')}
                    {renderProgressBar(airData.humidity, 'humidity', 'Humidity')}
                    {renderProgressBar(airData.temperature, 'temperature', 'Temperature')}
                    {renderProgressBar(airData.oxygen, 'oxygen', 'Oxygen')}
                </div>
                {renderHoverMiniWindow()}
            </div>
            <ToastContainer />
        </div>
    );
};

const styles = {
    airQualityInstance: {
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        fontFamily: "'Arial', sans-serif",
        backgroundColor: '#f5f5f5',
    },
    mainContent: {
        padding: '20px',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
    },
    h1: {
        fontSize: '24px',
        fontWeight: 600,
        color: '#333',
        marginBottom: '20px',
    },
    metrics: {
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '20px',
    },
    progressContainer: {
        width: '150px',
        height: 'auto',
        textAlign: 'center',
        transition: 'transform 0.3s ease',
        margin: '20px',
        padding: '15px',
        borderRadius: '10px',
        backgroundColor: '#f0f0f0', // Light gray background
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', // Subtle shadow for depth    

    },
    progressContainerHover: {
        transform: 'scale(1.05)',
    },
    p: {
        marginTop: '10px',
        fontSize: '14px',
        fontWeight: 'bold',
    },
    legend: {
        marginTop: '10px',
        fontSize: '12px',
        textAlign: 'left',
        lineHeight: '1.5',
    },
    legendDiv: {
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
    },
    legendSpan: {
        width: '10px',
        height: '10px',
        borderRadius: '50%',
    },
    circularBar: {
        margin: '0 auto',
    },
    tooltip: {
        position: 'absolute',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        color: '#fff',
        padding: '10px',
        borderRadius: '5px',
        fontSize: '14px',
        transform: 'translate(-50%, -50%)',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
    },
    '@media (max-width: 768px)': {
        mainContent: {
            padding: '15px',
        },
        h1: {
            fontSize: '20px',
            textAlign: 'center',
        },
        metrics: {
            flexDirection: 'column',
            alignItems: 'center',
            gap: '15px',
        },
        progressContainer: {
            width: '120px',
            height: '150px',
        },
        tooltip: {
            fontSize: '12px',
            padding: '8px',
        },
    },
    '@media (max-width: 480px)': {
        progressContainer: {
            width: '100px',
            height: '130px',
        },
        metrics: {
            gap: '10px',
        },
    },
};

export default AirQualityInstance;
