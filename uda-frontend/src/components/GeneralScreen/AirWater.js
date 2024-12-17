import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import backgroundImage from '../../assets/udabackg4.png';
import { supabaseAir } from '../iot/AirQuality/supabaseClient';
import { supabaseWater } from '../iot/WaterQuality/supabaseClient';
import axiosClient from '../iot/SoilQuality/axiosClient';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const GeneralScreen = () => {
    const [latestAirData, setLatestAirData] = useState(null);
    const [latestWaterData, setLatestWaterData] = useState(null);


    const locations = [
        { id: 1, name: 'LAPASAN' },
        { id: 2, name: 'AGUSAN' },
        { id: 3, name: 'USTP-CDO' },
        { id: 4, name: 'EL SALVADOR' },
        { id: 5, name: 'SPORTS COMPLEX' },
    ];

    const thresholdsAir = {
        pm25: [
            { min: 0, max: 25.99, label: "Good", color: "rgba(154, 205, 50)" },
            { min: 26, max: 35.99, label: "Fair", color: "rgba(250, 196, 62)" },
            { min: 36, max: 45.99, label: "Unhealthy", color: "rgba(230, 126, 14)" },
            { min: 46, max: 55.99, label: "Very Unhealthy", color: "rgba(232, 44, 48)" },
            { min: 56, max: 90.99, label: "Acutely Unhealthy", color: "rgba(159, 109, 199)" },
            { min: 91, max: Infinity, label: "Emergency", color: "rgba(140, 1, 4)" },
        ],
        pm10: [
            { min: 0, max: 50.99, label: "Good", color: "rgba(154, 205, 50)" },
            { min: 51, max: 100.99, label: "Fair", color: "rgba(250, 196, 62)" },
            { min: 101, max: 150.99, label: "Unhealthy", color: "rgba(230, 126, 14)" },
            { min: 151, max: 200.99, label: "Very Unhealthy", color: "rgba(232, 44, 48)" },
            { min: 201, max: 300.99, label: "Acutely Unhealthy", color: "rgba(159, 109, 199)" },
            { min: 301, max: Infinity, label: "Emergency", color: "rgba(140, 1, 4)" },
        ],
        humidity: [
            { min: 0, max: 25.99, label: "Poor", color: "rgba(230, 126, 14)" },
            { min: 26, max: 30.99, label: "Fair", color: "rgba(250, 196, 62)" },
            { min: 31, max: 60.99, label: "Good", color: "rgba(154, 205, 50)" },
            { min: 61, max: 70.99, label: "Fair", color: "rgba(250, 196, 62)" },
            { min: 71, max: Infinity, label: "Poor", color: "rgba(232, 44, 48)" },
        ],
        temperature: [
            { min: 0, max: 33.99, label: "Good", color: "rgba(154, 205, 50)" },
            { min: 34, max: 41.99, label: "Caution", color: "rgba(250, 196, 62)" },
            { min: 42, max: 54.99, label: "Danger", color: "rgba(230, 126, 14)" },
            { min: 55, max: Infinity, label: "Extreme", color: "rgba(232, 44, 48)" },
        ],
        oxygen: [
            { min: 0, max: 19.49, label: "Poor", color: "rgba(232, 44, 48)" },
            { min: 19.5, max: Infinity, label: "Safe", color: "rgba(154, 205, 50)" },
        ],
    };

    const thresholdsWater = {
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


    // Add recommendation data from Solo components
    const airRecommendations = {
        "Good": [
            "Ideal for outdoor activities",
            "Safe for all groups",
            "Perfect time for exercise"
        ],
        "Fair": [
            "Generally safe for outdoor activities",
            "Sensitive individuals should monitor conditions",
            "Good for moderate exercise"
        ],
        "Unhealthy": [
            "Reduce prolonged outdoor activities",
            "Sensitive groups should limit exposure",
            "Consider indoor exercises"
        ],
        "Very Unhealthy": [
            "Avoid outdoor activities",
            "Keep windows closed",
            "Use air purifiers indoors"
        ],
        "Acutely Unhealthy": [
            "Stay indoors",
            "Seal windows and doors",
            "Use air filtration systems"
        ],
        "Emergency": [
            "Avoid all outdoor activities",
            "Seek medical attention if experiencing symptoms",
            "Follow emergency guidelines"
        ]
    };

    const waterRecommendations = {
        "Acceptable": [
            "Continue regular monitoring",
            "Maintain current filtration system",
            "Document conditions for reference"
        ],
        "Too Cloudy": [
            "Check filtration systems",
            "Increase settling time",
            "Investigate source of turbidity"
        ],
        "High Dissolved Substances": [
            "Review treatment processes",
            "Check for mineral buildup",
            "Consider additional filtration"
        ]
    };


    // Add helper function to get recommendations
    const getRecommendations = (status, type) => {
        if (!status) return [];
        const recommendationMap = {
            'air': airRecommendations,
            'water': waterRecommendations,
        };
        return recommendationMap[type][status.text] || [];
    };

    // Add helper function to format timestamp without timezone conversion
    const formatTimestampWithoutOffset = (timestamp) => {
        if (!timestamp) return 'No time available';
        const date = new Date(timestamp);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
            timeZone: 'UTC'  // Use UTC to prevent timezone offset
        });
    };

    // Function to get latest air quality data
    const fetchLatestAirData = async () => {
        try {
            const { data, error } = await supabaseAir
                .from('sensors')
                .select('*')
                .order('id', { ascending: false })
                .limit(1)
                .single();

            if (error) throw error;
            setLatestAirData(data);
        } catch (error) {
            console.error('Error fetching air data:', error);
        }
    };


    const formatDate = (date) => {
        return date.toISOString().split('T')[0];
    };
    // Function to get latest water quality data
    const fetchLatestWaterData = async () => {
        try {
            // Get current date in UTC
            const today = new Date();
            today.setDate(today.getDate() + 1);
            const tomorrow = new Date(today);
            tomorrow.setDate(today.getDate() + 1);

            // Format dates as YYYY-MM-DDT00:00:00Z
            const todayStr = `${formatDate(today)}T00:00:00Z`;
            const tomorrowStr = `${formatDate(tomorrow)}T00:00:00Z`;

            const { data, error } = await supabaseWater
                .from('sensor_data')
                .select('*')
                .gte('timestamp', todayStr)
                .lt('timestamp', tomorrowStr)
                .order('id', { ascending: false })
                .limit(1)
                .single();

            if (error) throw error;
            setLatestWaterData(data);
        } catch (error) {
            console.error('Error fetching water data:', error);
        }
    };

    // Function to get latest soil quality data

    useEffect(() => {
        fetchLatestAirData();
        fetchLatestWaterData();

        const interval = setInterval(() => {
            fetchLatestAirData();
            fetchLatestWaterData();

        }, 30000); // Refresh every 30 seconds

        return () => clearInterval(interval);
    }, []);

    // Air Quality Charts Configuration
    const airQualityData = {
        labels: ['PM2.5', 'PM10'],
        datasets: [{
            data: [latestAirData?.pm25 || 0, latestAirData?.pm10 || 0],
            backgroundColor: [
                getColorForMetric(latestAirData?.pm25, 'pm25', thresholdsAir),
                getColorForMetric(latestAirData?.pm10, 'pm10', thresholdsAir)
            ],
            circumference: 180,
            rotation: -90,
        }]
    };

    // Update the calculateSafetyPercentage function
    const calculateSafetyPercentage = (value, metric) => {
        if (value === null || value === undefined || value === 0) {
            return 100; // Full safety when no contaminants
        }

        const thresholds = {
            'tss': { acceptable: 50 },
            'tds_ppm': { acceptable: 500 }
        };

        const threshold = thresholds[metric].acceptable;

        if (value <= threshold) {
            // Scale from 100% to 50% within acceptable range
            return 100 - ((value / threshold) * 50);
        } else {
            // Scale from 50% to 0% after exceeding threshold
            const excess = value - threshold;
            const maxExcess = threshold; // Same range for scaling down
            return Math.max(0, 50 - ((excess / maxExcess) * 50));
        }
    };

    // Modified Water Quality Chart Configuration
    const waterQualityData = {
        labels: ['TSS Safety', 'TDS Safety'],
        datasets: [{
            data: [
                calculateSafetyPercentage(latestWaterData?.tss ?? 0, 'tss'),
                calculateSafetyPercentage(latestWaterData?.tds_ppm ?? 0, 'tds_ppm')
            ],
            backgroundColor: [
                getColorForMetric(latestWaterData?.tss ?? 0, 'tss', thresholdsWater),
                getColorForMetric(latestWaterData?.tds_ppm ?? 0, 'tds_ppm', thresholdsWater)
            ],
        }]
    };

    const waterChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                beginAtZero: true,
                max: 100,
                ticks: {
                    color: '#fff',
                    callback: value => `${value}%`
                },
                grid: {
                    color: 'rgba(255, 255, 255, 0.1)'
                }
            },
            x: {
                ticks: {
                    color: '#fff'
                },
                grid: {
                    display: false
                }
            }
        },
        elements: {
            bar: {
                borderRadius: 20,
                borderSkipped: false,
            },
        },
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                callbacks: {
                    label: function (context) {
                        const metric = context.label.includes('TSS') ? 'tss' : 'tds_ppm';
                        const actualValue = metric === 'tss' ?
                            latestWaterData?.tss || 0 :
                            latestWaterData?.tds_ppm || 0;
                        return [
                            `Safety Level: ${context.raw.toFixed(1)}%`,
                            `Actual ${metric.toUpperCase()}: ${actualValue}`
                        ];
                    }
                }
            }
        }
    };


    // Helper function to get color based on metric value
    function getColorForMetric(value, metric, thresholds) {
        // Handle null/undefined values
        if (value === null || value === undefined) {
            value = 0;
        }

        const thresholdArray = thresholds[metric];
        for (let threshold of thresholdArray) {
            if (value <= threshold.max) {
                return threshold.color;
            }
        }
        return thresholdArray[thresholdArray.length - 1].color;
    }

    // Get status text for each metric
    const getAirQualityStatus = () => {
        if (!latestAirData) return { text: 'No data available', color: 'rgba(200, 200, 200, 0.2)' };

        const pm25Status = getStatusText(latestAirData.pm25, 'pm25', thresholdsAir);
        const pm10Status = getStatusText(latestAirData.pm10, 'pm10', thresholdsAir);

        // Return the worse status
        return pm25Status.severity > pm10Status.severity ? pm25Status : pm10Status;
    };

    const getWaterQualityStatus = () => {
        if (!latestWaterData) return { text: 'No data available', color: 'rgba(200, 200, 200, 0.2)' };

        // Use nullish coalescing to handle null/undefined values
        const tss = latestWaterData.tss ?? 0;
        const tds = latestWaterData.tds_ppm ?? 0;

        const tssStatus = getStatusText(tss, 'tss', thresholdsWater);
        const tdsStatus = getStatusText(tds, 'tds_ppm', thresholdsWater);

        // Return the worse status
        return tssStatus.severity > tdsStatus.severity ? tssStatus : tdsStatus;
    };

    // Modified status text function to include severity and color
    function getStatusText(value, metric, thresholds) {
        // Handle null/undefined values
        if (value === null || value === undefined) {
            value = 0;
        }

        const thresholdArray = thresholds[metric];
        for (let i = 0; i < thresholdArray.length; i++) {
            const threshold = thresholdArray[i];
            if (value <= threshold.max) {
                return {
                    text: threshold.label,
                    color: threshold.color,
                    severity: i
                };
            }
        }
        const lastThreshold = thresholdArray[thresholdArray.length - 1];
        return {
            text: lastThreshold.label,
            color: lastThreshold.color,
            severity: thresholdArray.length
        };
    }

    const getLocationName = (locationId) => {
        const location = locations.find(loc => loc.id === locationId);
        return location ? location.name : 'Unknown Location';
    };

    // Modified status display section in the return JSX
    return (
        <div style={styles.fullcontainer}>
            <div style={styles.headerContainer}>
                <header style={styles.header}>
                    <div>
                        <h1 style={styles.title}>Home Dashboard</h1>
                        <p style={styles.subtitle}>Unified Dashboard Analytics</p>
                    </div>
                </header>
            </div>
            <div style={styles.gridContainer}>
                {/* Air Quality Column */}
                <div style={styles.column}>
                    <div style={styles.box1}>
                        <div style={styles.iotHeaderBox}>
                            <h2 style={styles.airHeaderTitle}>Air Quality</h2>
                        </div>
                        <div style={styles.chartContainer}>
                            <Doughnut
                                data={airQualityData}
                                options={{
                                    maintainAspectRatio: false,
                                    plugins: {
                                        legend: {
                                            labels: {
                                                color: 'white', // Set the legend text color to white
                                                font: {
                                                    size: 14, // Optional: Adjust font size
                                                },
                                            },
                                        },
                                    },
                                }}
                            />
                        </div>
                    </div>
                    <div style={styles.box2}>
                        <div style={styles.iotHeaderBox}>
                            <div style={styles.statusHeader}>
                                <h2 style={styles.airHeaderTitle}>Current Status:</h2>
                                {latestAirData && (
                                    <div style={{
                                        ...styles.statusBox,
                                        backgroundColor: getAirQualityStatus().color
                                    }}>
                                        <p style={styles.statusText}>{getAirQualityStatus().text}</p>
                                    </div>
                                )}
                            </div>
                            {latestAirData && (
                                <p style={styles.metadataText}>
                                    ID: {latestAirData.id}<br />
                                    Time: {new Date(latestAirData.date).toLocaleString()}<br />
                                    Location: {getLocationName(latestAirData.locationId)}
                                </p>
                            )}
                        </div>
                    </div>
                    <div style={styles.box3}>
                        <div style={styles.iotHeaderBox}>
                            <h2 style={styles.airHeaderTitle}>Recommendations</h2>
                            {latestAirData && (
                                <div style={styles.recommendationsList}>
                                    {getRecommendations(getAirQualityStatus(), 'air').map((rec, index) => (
                                        <p key={index} style={styles.recommendationItem}>• {rec}</p>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Water Quality Column */}
                <div style={styles.column}>
                    <div style={styles.box4}>
                        <div style={styles.iotHeaderBox}>
                            <h2 style={styles.waterHeaderTitle}>Water Quality</h2>
                        </div>
                        <div style={styles.chartContainer}>
                            <Bar
                                data={waterQualityData}
                                options={waterChartOptions}
                            />
                        </div>
                    </div>
                    <div style={styles.box5}>
                        <div style={styles.iotHeaderBox}>
                            <div style={styles.statusHeader}>
                                <h2 style={styles.waterHeaderTitle}>Current Status:</h2>
                                {latestWaterData && (
                                    <div style={{
                                        ...styles.statusBox,
                                        backgroundColor: getWaterQualityStatus().color
                                    }}>
                                        <p style={styles.statusText}>{getWaterQualityStatus().text}</p>
                                    </div>
                                )}
                            </div>
                            {latestWaterData && (
                                <p style={styles.metadataText}>
                                    ID: {latestWaterData.id}<br />
                                    Time: {formatTimestampWithoutOffset(latestWaterData.timestamp)}
                                </p>
                            )}
                        </div>
                    </div>
                    <div style={styles.box6}>
                        <div style={styles.iotHeaderBox}>
                            <h2 style={styles.waterHeaderTitle}>Recommendations</h2>
                            {latestWaterData && (
                                <div style={styles.recommendationsList}>
                                    {getRecommendations(getWaterQualityStatus(), 'water').map((rec, index) => (
                                        <p key={index} style={styles.recommendationItem}>• {rec}</p>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Add these new styles
const styles = {
    // Main container with background
    fullcontainer: {
        height: "100vh",
        width: "100vw",
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        display: "flex",
        flexDirection: "column",
        padding: "20px",
        overflow: "hidden",
        boxSizing: "border-box",
    },

    // Header styles
    headerContainer: {
        display: "flex",
        justifyContent: "center",
        marginBottom: "20px",
        marginTop: "5px",
        marginLeft: "70px",
    },
    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        width: "100%",
        textAlign: "left",
        color: "#fff",
    },
    title: {
        fontSize: "28px",
        fontWeight: "bold",
        margin: 0,
        color: "#fff",
    },
    subtitle: {
        fontSize: "15px",
        margin: 0,
        color: "#fff",
    },

    // Grid container styles
    gridContainer: {
        display: "flex",
        flexDirection: "row",
        flex: 1,
        gap: "20px",
        marginLeft: "70px",
    },

    // Column styles
    column: {
        flex: 1,
        display: "flex",
        flexDirection: "column",
        gap: "15px",
    },

    iotHeaderBox: {
        margin: 0,
        fontWeight: "bold",
        textAlign: "left",
    },
    iotHeaderTitle: {
        fontSize: "1.2rem",
        color: "#fff",
    },

    // Box styles AIR QUALITY
    box1: {
        flex: 1,
        backgroundColor: "rgba(22, 193, 255, 0.2)",
        borderRadius: "30px",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",  // Align header to the left
        justifyContent: "flex-start",
        fontSize: "1.5rem",
        color: "#fff",
        fontWeight: "bold",
        padding: "20px",
    },
    box2: {
        flex: 0.3,
        backgroundColor: "rgba(22, 193, 255, 0.2)",
        borderRadius: "30px",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",  // Align header to the left
        justifyContent: "flex-start",
        fontSize: "1.5rem",
        color: "#fff",
        fontWeight: "bold",
        padding: "20px",
    },
    box3: {
        flex: 0.5,
        backgroundColor: "rgba(22, 193, 255, 0.2)",
        borderRadius: "30px",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",  // Align header to the left
        justifyContent: "flex-start",
        fontSize: "1.5rem",
        color: "#fff",
        fontWeight: "bold",
        padding: "20px",
    },
    airHeaderTitle: {
        fontSize: "1.2rem",
        color: "#fff",
    },


    // Box styles WATER QUALITY
    box4: {
        flex: 1,
        backgroundColor: "rgba(188, 255, 159, 0.2)",
        borderRadius: "30px",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",  // Align header to the left
        justifyContent: "flex-start",
        fontSize: "1.5rem",
        color: "#fff",
        fontWeight: "bold",
        padding: "20px",
    },
    box5: {
        flex: 0.3,
        backgroundColor: "rgba(188, 255, 159, 0.2)",
        borderRadius: "30px",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",  // Align header to the left
        justifyContent: "flex-start",
        fontSize: "1.5rem",
        color: "#fff",
        fontWeight: "bold",
        padding: "20px",
    },
    box6: {
        flex: 0.5,
        backgroundColor: "rgba(188, 255, 159, 0.2)",
        borderRadius: "30px",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",  // Align header to the left
        justifyContent: "flex-start",
        fontSize: "1.5rem",
        color: "#fff",
        fontWeight: "bold",
        padding: "20px",
    },
    waterHeaderTitle: {
        fontSize: "1.2rem",
        color: "#fff",
    },

    chartContainer: {
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        margin: '20px 0',
    },
    statusHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        width: '100%',
    },
    statusBox: {
        padding: '5px 10px',
        borderRadius: '5px',
        flex: 1,
        opacity: 0.8,
    },
    statusText: {
        color: '#fff',
        fontSize: '1rem',
        margin: 0,
        textAlign: 'center',
        fontWeight: 'bold',
    },
    metadataText: {
        color: '#fff',
        fontSize: '0.9rem',
        marginTop: '10px',
        lineHeight: '1.4',
    },
    recommendationsList: {
        marginTop: '10px',
        color: '#fff',
        fontSize: '0.9rem',
    },
    recommendationItem: {
        margin: '5px 0',
        lineHeight: '1.4',
    }
};

export default GeneralScreen;