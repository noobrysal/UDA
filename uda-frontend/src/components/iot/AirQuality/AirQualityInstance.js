import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { supabase } from './supabaseClient';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import backgroundImage from '../../../assets/airdash.png';
import { useNavigate } from 'react-router-dom';
// import Sidebar from '../../Sidebar';

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
        { min: 0, max: 25.99, label: "Good", color: "rgba(92, 225, 230)" },
        { min: 26, max: 35.99, label: "Fair", color: "rgba(126, 205, 160)" },
        { min: 36, max: 45.99, label: "Unhealthy", color: "rgba(255, 222, 89)" },
        { min: 46, max: 55.99, label: "Very Unhealthy", color: "rgba(235, 123, 59)" },
        { min: 56, max: 90.99, label: "Acutely Unhealthy", color: "rgba(111, 41, 133)" },
        { min: 91, max: Infinity, label: "Emergency", color: "rgba(214, 54, 49)" },
    ],
    pm10: [
        { min: 0, max: 50.99, label: "Good", color: "rgba(92, 225, 230)" },
        { min: 51, max: 100.99, label: "Fair", color: "rgba(126, 205, 160)" },
        { min: 101, max: 150.99, label: "Unhealthy", color: "rgba(255, 222, 89)" },
        { min: 151, max: 200.99, label: "Very Unhealthy", color: "rgba(235, 123, 59)" },
        { min: 201, max: 300.99, label: "Acutely Unhealthy", color: "rgba(111, 41, 133)" },
        { min: 301, max: Infinity, label: "Emergency", color: "rgba(214, 54, 49)" },
    ],
    humidity: [
        { min: 0, max: 25.99, label: "Poor", color: "rgba(255, 222, 89)" },
        { min: 26, max: 30.99, label: "Fair", color: "rgba(126, 205, 160)" },
        { min: 31, max: 60.99, label: "Good", color: "rgba(92, 225, 230)" },
        { min: 61, max: 70.99, label: "Fair", color: "rgba(126, 205, 160)" },
        { min: 71, max: Infinity, label: "Poor", color: "rgba(235, 123, 59)" },
    ],
    temperature: [
        { min: 0, max: 33.99, label: "Good", color: "rgba(92, 225, 230)" },
        { min: 34, max: 41.99, label: "Caution", color: "rgba(126, 205, 160)" },
        { min: 42, max: 54.99, label: "Danger", color: "rgba(255, 222, 89)" },
        { min: 55, max: Infinity, label: "Extreme", color: "rgba(235, 123, 59)" },
    ],
    oxygen: [
        { min: 0, max: 19.49, label: "Poor", color: "rgba(235, 123, 59)" },
        { min: 19.5, max: Infinity, label: "Safe", color: "rgba(92, 225, 230)" },
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

    const navigate = useNavigate();

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

    const handleButtonClick = () => {
        // Navigate to the desired route when the button is clicked
        navigate('/air-quality'); // Change '/detailed-data' to the route you want
    };

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
                    strokeWidth={20}
                    styles={buildStyles({
                        pathColor: color,
                        textColor: color,
                        trailColor: '#fff',
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
            {/* <Sidebar /> */}
            <div>
                <h2 style={styles.h2}>Air Quality Data (ID: {id})</h2>
                <h2 style={styles.h2}>Recorded at:{' '}{getLocationName(airData.locationId)}</h2>
                <h2 style={styles.h2}>Recorded on:{' '}
                    
                    {new Date(airData.date).toLocaleString("en-US", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                        hour12: true,
                    })}
                </h2>
                <div style={styles.metrics}>
                    {renderProgressBar(airData.pm25, 'pm25', 'PM2.5')}
                    {renderProgressBar(airData.pm10, 'pm10', 'PM10')}
                    {renderProgressBar(airData.humidity, 'humidity', 'Humidity')}
                    {renderProgressBar(airData.temperature, 'temperature', 'Temperature')}
                    {renderProgressBar(airData.oxygen, 'oxygen', 'Oxygen')}
                </div>
                {renderHoverMiniWindow()}
            </div>
            <button style={styles.button}
                    onClick={handleButtonClick}
                    >
                        Detailed Data
                    </button>
            <ToastContainer />
        </div>
    );
};

const styles = {
    airQualityInstance: {
        backgroundColor: '#000000',
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        // minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        alignItems: 'center', // Align items horizontally in the center
        // justifyContent: 'center', // Align items vertically in the center
    },
    // mainContent: {
    //     padding: '20px',
    //     flex: 1,
    //     display: 'flex',
    //     flexDirection: 'column',
    //     alignItems: 'center',
    //     justifyContent: 'center',
    // },
    // h1: {
    //     fontSize: '24px',
    //     fontWeight: 600,
    //     color: '#333',
    //     marginBottom: '20px',
    // },
    h2: {
        fontSize: '2rem',
        fontWeight: 200,
        color: '#fff',
        marginBottom: '20px',
        justifyContent: 'center', 
        marginTop: '20px',
        textAlign: 'center',
        lineHeight: '20px',
    },
    metrics: {
        display: 'flex',
        flexWrap: 'nowwrap',
        justifyContent: 'center',
        width: '1300px', // Adjust width as needed
        height: 'auto', // Automatically adjust based on content
        paddingLeft: '10px', // Add some padding for better spacing
        backgroundColor: 'rgba(255, 255, 255, 0.1)', // Transparent white background
        borderRadius: '8px', // Optional: add rounded corners
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', // Optional: subtle shadow for better visuals
        margin: '30px',
        // marginLeft: '160px', //NARA TAN MARGIN
        padding: '35px',
        paddingTop: '10px',
        paddingBottom: '10px',
        marginTop: '-5px'
    },
    progressContainer: {
        width: '200px',
        height: '430px',
        textAlign: 'center',
        transition: 'transform 0.3s ease',
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        margin: '13px',
        paddingTop: '50px',
        padding: '20px',
        borderRadius: '10px',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', // Subtle shadow for depth   
        color: 'white',
    },
    button: {
        display: 'flex', 
        flexDirection: 'row',
        padding: '10px 10px',
        background: 'linear-gradient(50deg, #00CCDD, #006E77)', // Gradient background
        color: '#fff',
        border: 'none',
        borderRadius: '15px',
        cursor: 'pointer',
        fontSize: '1rem',
        width: '300px',
        justifyContent: 'center', // Center the content horizontally
        alignItems: 'center',     // Center the content vertically
        textAlign: 'center',      // Make sure the text is centered
        margin: '0px 500px 0px 500px'
    },
    progressContainerHover: {
        transform: 'scale(1.05)',
    },
    p: {
        marginTop: '10px',
        fontSize: '20px',
        fontWeight: 'bold',
    },
    legend: {
        marginTop: '10px',
        fontSize: '15px',
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
        // margin: '0 auto',
        marginTop: '20px'
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