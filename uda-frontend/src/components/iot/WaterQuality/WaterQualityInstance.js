import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { supabaseWater } from './supabaseClient';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import backgroundImage from '../../../assets/waterdash.png';
import { useNavigate } from 'react-router-dom';
// import Sidebar from '../../Sidebar';

// Function to fetch water quality data by ID
const getWaterQualityById = async (id) => {
    const { data, error } = await supabaseWater
        .from('sensor_data')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching water quality:', error);
        toast.error(`Error fetching water quality: ${error.message}`);
        throw error;
    }
    return data;
};

// Updated thresholds for water quality metrics
const thresholds1 = {
    pH: [
        { min: 0, max: 6.49, label: "Too Acidic", color: "rgba(199, 46, 46, 1)" },
        { min: 6.5, max: 8.5, label: "Acceptable", color: "rgba(154, 205, 50, 1)" },
        { min: 8.51, max: Infinity, label: "Too Alkaline", color: "rgba(230, 126, 14, 1)" },
    ],
    temperature: [
        { min: 0, max: 25.99, label: "Too Cold", color: "rgba(230, 126, 14, 1)" },
        { min: 26, max: 30, label: "Acceptable", color: "rgba(154, 205, 50, 1)" },
        { min: 30.01, max: Infinity, label: "Too Hot", color: "rgba(199, 46, 46, 1)" },
    ],
    tss: [
        { min: 0, max: 50, label: "Acceptable", color: "rgba(154, 205, 50,1)" },
        { min: 50.01, max: Infinity, label: "Too Cloudy", color: "rgba(199, 46, 46, 1)" },
    ],
    tds_ppm: [
        { min: 0, max: 500, label: "Acceptable", color: "rgba(154, 205, 50,1)" },
        { min: 500.01, max: Infinity, label: "High Dissolved Substances", color: "rgba(199, 46, 46, 1)" },
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

// Add this function before the WaterQualityInstance component
const formatTimestamp = (timestamp) => {
    return timestamp
        .split('.')[0]  // Remove everything after the decimal point
        .replace('T', ' ')  // Remove T
        .replace(/(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})/,
            function (match, year, month, day, hour, minute, second) {
                const ampm = hour >= 12 ? 'PM' : 'AM';
                hour = hour % 12;
                hour = hour ? hour : 12; // Convert hour 0 to 12
                return `${month}/${day}/${year} ${hour}:${minute}:${second} ${ampm}`;
            });
};

// Main component to display water quality instance with circular progress bars and legend
const WaterQualityInstance = () => {
    const { id } = useParams();
    const [waterData, setWaterData] = useState(null);
    const [hoveredMetric, setHoveredMetric] = useState(null);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    const navigate = useNavigate();

    useEffect(() => {
        let mounted = true;
        getWaterQualityById(id)
            .then(data => {
                if (mounted) {
                    setWaterData(data);
                }
            })
            .catch(error => {
                console.error('Error fetching water quality:', error);
                toast.error(`Error fetching water quality: ${error.message}`);
            });

        return () => mounted = false;
    }, [id]);

    const handleButtonClick = () => {
        // Navigate to the desired route when the button is clicked
        navigate('/water-quality');
    };

    const handleMouseMove = (e) => {
        setMousePosition({ x: e.clientX, y: e.clientY });
    };

    const renderProgressBar = (value, metric, label) => {
        const color = getColor(value, metric);

        // Calculate display value for TSS and TDS
        let displayValue = value;
        if (metric === 'tss') {
            // Invert the percentage for TSS (using 100 as max reference)
            displayValue = Math.max(0, 100 - (value / 50) * 100);
        } else if (metric === 'tds_ppm') {
            // Invert the percentage for TDS (using 1000 as max reference)
            displayValue = Math.max(0, 100 - (value / 500) * 100);
        }

        return (
            <div
                className="progress-container"
                style={styles.progressContainer}
                onMouseEnter={() => setHoveredMetric({ value, label, metric })}
                onMouseLeave={() => setHoveredMetric(null)}
                onMouseMove={handleMouseMove}
            >
                <CircularProgressbar
                    value={metric === 'tss' || metric === 'tds_ppm' ? displayValue : value}
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

    if (!waterData) return null;

    return (
        <div style={styles.waterQualityInstance}>
            {/* <Sidebar /> */}
            <div>
                <h2 style={styles.h2}>water Quality Data (ID: {id})</h2>
                <h2 style={{
                    ...styles.h2,
                    display: waterData.location ? 'block' : 'none'
                }}>Recorded at:{' '}{waterData.location}</h2>
                <h2 style={styles.h2}>Recorded on:{' '}
                    {formatTimestamp(waterData.timestamp)}
                </h2>
                <div style={styles.metrics}>
                    {renderProgressBar(waterData.pH, 'pH', 'pH')}
                    {renderProgressBar(waterData.temperature, 'temperature', 'Temperature')}
                    {renderProgressBar(waterData.tss ?? 0, 'tss', 'TSS')}
                    {renderProgressBar(waterData.tds_ppm ?? 0, 'tds_ppm', 'TDS_ppm')}
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
    waterQualityInstance: {
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
        background: 'linear-gradient(50deg, #007a74, #04403d)', // Gradient background
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

export default WaterQualityInstance;