import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axiosClient from './axiosClient';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import backgroundImage from '../../../assets/soildash.png';
import { useNavigate } from 'react-router-dom';
// import Sidebar from '../../Sidebar';

// Function to fetch soil quality data by ID
const getSoilQualityById = async (id) => {
    try {
        const response = await axiosClient.get(`?id=${id}`);
        console.log('API Response:', response.data);
        // Return first item from array since we're querying by ID
        return response.data[0];
    } catch (error) {
        console.error("Error fetching soil quality:", error);
        throw error;
    }
};

// Updated thresholds for soil quality metrics
const thresholds1 = {
    soil_moisture: [
        { min: 0, max: 19.99, label: "Dry", color: "rgba(232, 44, 4, 1)" }, // Poor
        { min: 20, max: 39.99, label: "Low Moisture", color: "rgba(250, 196, 62, 1)" }, // Warning
        { min: 40, max: 70.99, label: "Optimal", color: "rgba(154, 205, 50, 1)" }, // Good
        { min: 71, max: 100, label: "Saturated", color: "rgba(230, 126, 14, 1)" }, // Caution
        { min: 101, max: Infinity, label: "Waterlogged", color: "rgba(140, 1, 4, 1)" }, // Emergency
    ],
    temperature: [
        { min: -Infinity, max: 4.99, label: "Cold", color: "rgba(140, 1, 4, 1)" }, // Poor
        { min: 5, max: 14.99, label: "Cool", color: "rgba(250, 196, 62, 1)" }, // Warning
        { min: 15, max: 29.99, label: "Optimal", color: "rgba(154, 205, 50, 1)" }, // Good
        { min: 30, max: 34.99, label: "Warm", color: "rgba(250, 196, 62, 1)" }, // Caution
        { min: 35, max: Infinity, label: "Hot", color: "rgba(232, 44, 4, 1)" }, // Danger
    ],
    humidity: [
        { min: 0, max: 29.99, label: "Dry", color: "rgba(232, 44, 4, 1)" }, // Poor
        { min: 30, max: 49.99, label: "Low Humidity", color: "rgba(250, 196, 62, 1)" }, // Warning
        { min: 50, max: 70.99, label: "Optimal", color: "rgba(154, 205, 50, 1)" }, // Good
        { min: 71, max: 85.99, label: "High Humidity", color: "rgba(230, 126, 14, 1)" }, // Caution
        { min: 86, max: Infinity, label: "Waterlogged", color: "rgba(140, 1, 4, 1)" }, // Emergency
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

const getMetricMaxValue = (metric) => {
    switch (metric) {
        case 'soil_moisture':
            return 120; // Maximum threshold for waterlogged
        case 'temperature':
            return 40;  // Maximum threshold for extreme heat
        case 'humidity':
            return 100; // Maximum threshold for waterlogged
        default:
            return 100;
    }
};

const getMetricUnit = (metric) => {
    switch (metric) {
        case 'temperature':
            return '°C';
        case 'humidity':
        case 'soil_moisture':
            return '%';
        default:
            return '';
    }
};

// Main component to display soil quality instance with circular progress bars and legend
const SoilQualityInstance = () => {
    const { id } = useParams();
    const [soilData, setSoilData] = useState(null);
    const [hoveredMetric, setHoveredMetric] = useState(null);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    const navigate = useNavigate();

    useEffect(() => {
        let mounted = true;
        getSoilQualityById(id)
            .then(data => {
                if (mounted) {
                    console.log('Received soil data:', data); // Debug log
                    setSoilData(data);
                }
            })
            .catch(error => {
                console.error('Error fetching soil quality:', error);
                toast.error(`Error fetching soil quality: ${error.message}`);
            });

        return () => mounted = false;
    }, [id]);

    // const handleButtonClick = () => {
    //     navigate('/soil-quality'); // Make sure this matches your route path exactly
    // };

    const handleMouseMove = (e) => {
        setMousePosition({ x: e.clientX, y: e.clientY });
    };

    // Add this helper function to normalize values for CircularProgressbar

    const formatValue = (value) => {
        const parsed = parseFloat(value);
        return isNaN(parsed) ? 0 : parsed.toFixed(2);
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return 'No date available';

        try {
            const date = new Date(timestamp);
            return date.toLocaleString("en-US", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: true,
                timeZone: 'Asia/Manila' // Add timezone for Philippines
            });
        } catch (error) {
            return 'Invalid date';
        }
    };

    const renderProgressBar = (value, metric, label) => {
        const formattedValue = formatValue(value);
        const color = getColor(formattedValue, metric);
        const maxValue = getMetricMaxValue(metric);
        const unit = getMetricUnit(metric);

        return (
            <div
                className="progress-container"
                style={styles.progressContainer}
                onMouseEnter={() => setHoveredMetric({ value: formattedValue, label, metric })}
                onMouseLeave={() => setHoveredMetric(null)}
                onMouseMove={handleMouseMove}
            >
                <CircularProgressbar
                    value={formattedValue}
                    text={`${formattedValue}${unit}`}
                    maxValue={maxValue}
                    strokeWidth={20}
                    styles={buildStyles({
                        pathColor: color,
                        textColor: color,
                        trailColor: '#fff',
                        backgroundColor: '#3e98c7',
                        textSize: '16px', // Reduced from default size
                        pathTransitionDuration: 0.5,
                    })}
                />
                <p style={styles.p}>{label}</p>
                <div style={styles.legend}>
                    {thresholds1[metric].map((threshold, index) => (
                        <div key={index} style={styles.legendDiv}>
                            <span style={{ ...styles.legendSpan, backgroundColor: threshold.color }}></span>
                            <span>{threshold.label}: &le; {threshold.max}{unit}</span>
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

    if (!soilData) return <div style={{ color: '#fff' }}>Loading...</div>;

    return (
        <div style={styles.soilQualityInstance}>
            {/* <Sidebar /> */}
            <div>
                <h2 style={styles.h2}>Soil Quality Data (ID: {soilData.id})</h2>
                <h2 style={styles.h2}>Recorded on: {formatDate(soilData.timestamp)}</h2>
                <div style={styles.metrics}>
                    {renderProgressBar(
                        parseFloat(soilData.soil_moisture),
                        'soil_moisture',
                        'Soil Moisture'
                    )}
                    {renderProgressBar(
                        parseFloat(soilData.humidity),
                        'humidity',
                        'Humidity'
                    )}
                    {renderProgressBar(
                        parseFloat(soilData.temperature),
                        'temperature',
                        'Temperature'
                    )}
                </div>
                {renderHoverMiniWindow()}
            </div>
            {/* <button style={styles.button}
                onClick={handleButtonClick}
            >
                Detailed Data
            </button> */}
            <ToastContainer />
        </div>
    );
};

const styles = {
    soilQualityInstance: {
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
        marginTop: '-5px',
        gap: '20px', // Add gap between progress bars
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
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
        color: 'white',
    },
    progressBarWrapper: {
        width: '200px',
        height: '200px',
        margin: '0 auto',
        marginTop: '20px',
    },
    // button: {
    //     display: 'flex',
    //     flexDirection: 'row',
    //     padding: '10px 10px',
    //     background: 'linear-gradient(50deg, #d3c740, #524d18)', // Gradient background
    //     color: '#fff',
    //     border: 'none',
    //     borderRadius: '15px',
    //     cursor: 'pointer',
    //     fontSize: '1rem',
    //     width: '300px',
    //     justifyContent: 'center', // Center the content horizontally
    //     alignItems: 'center',     // Center the content vertically
    //     textAlign: 'center',      // Make sure the text is centered
    //     margin: '0px 500px 0px 500px'
    // },
    progressContainerHover: {
        transform: 'scale(1.05)',
    },
    p: {
        marginTop: '10px',
        fontSize: '18px', // Reduced font size
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

export default SoilQualityInstance;