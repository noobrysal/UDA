import React, { useEffect, useState } from 'react';
import { supabaseWater } from '../iot/WaterQuality/supabaseClient';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Bar } from 'react-chartjs-2';
import backgroundImage from '../../assets/waterdash2.png';
import ArrowLeftIcon from '@mui/icons-material/ArrowLeft';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import { IconButton } from '@mui/material';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip as ChartTooltip,
    Legend,
} from 'chart.js';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    ChartTooltip,
    Legend
);

const WaterBar = () => {
    const getCurrentLocalDate = () => {
        const now = new Date();
        return now.toLocaleDateString('en-CA'); // Returns YYYY-MM-DD format in local timezone
    };
    const getCurrentHourBlock = (hour) => {
        const blockStart = Math.floor(hour / 6) * 6;
        return Array.from({ length: 6 }, (_, i) => (blockStart + i) % 24);
    };

    const [hourlyData, setHourlyData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(getCurrentLocalDate());
    const [visibleHours, setVisibleHours] = useState([0]);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [slideDirection, setSlideDirection] = useState('left');
    const [currentSlide, setCurrentSlide] = useState(0);
    const [hoveredData, setHoveredData] = useState(null);
    const [selectedHourForNarrative, setSelectedHourForNarrative] = useState(new Date().getHours());
    const [visibleHourRange, setVisibleHourRange] = useState(() =>
        getCurrentHourBlock(new Date().getHours())
    );
    const [showTooltip, setShowTooltip] = useState(false);
    const [showThresholdInfo, setShowThresholdInfo] = useState({
        pH: false,
        temperature: false,
        tss: false,
        tds_ppm: false
    });

    const handleTooltipToggle = () => {
        setShowTooltip(!showTooltip);
    };

    const thresholds = {
        pH: [
            { min: 0, max: 6.49, label: "Too Acidic", color: "rgba(199, 46, 46)" },
            { min: 6.5, max: 8.5, label: "Acceptable", color: "rgba(154, 205, 50)" },
            { min: 8.51, max: Infinity, label: "Too Alkaline", color: "rgba(230, 126, 14)" },
        ],
        temperature: [
            { min: 0, max: 25.99, label: "Too Cold", color: "rgba(230, 126, 14)" },
            { min: 26, max: 30, label: "Acceptable", color: "rgba(154, 205, 50)" },
            { min: 30.01, max: Infinity, label: "Too Hot", color: "rgba(199, 46, 46)" },
        ],
        tss: [
            { min: 0, max: 50, label: "Acceptable", color: "rgba(154, 205, 50)" },
            { min: 50.01, max: Infinity, label: "Too Cloudy", color: "rgba(199, 46, 46)" },
        ],
        tds_ppm: [
            { min: 0, max: 500, label: "Acceptable", color: "rgba(154, 205, 50)" },
            { min: 500.01, max: Infinity, label: "High Dissolved Substances", color: "rgba(199, 46, 46)" },
        ],
    };

    const thresholdInfoWater = [
        // pH Levels
        {
            level: "Too Acidic",
            metric: "pH",
            color: "rgba(199, 46, 46)",
            description: "The water is too acidic, which can harm aquatic life and affect water usability.",
            icon: "⚠️",
            recommendations: [
                "• Use lime or other alkaline substances to neutralize acidity",
                "• Avoid discharge of acidic substances into water",
                "• Monitor aquatic ecosystems for stress"
            ]
        },
        {
            level: "Acceptable",
            metric: "pH",
            color: "rgba(154, 205, 50)",
            description: "The water pH is within the acceptable range, suitable for most uses and aquatic life.",
            icon: "✅",
            recommendations: [
                "• Maintain regular monitoring to ensure pH stability",
                "• Avoid introducing contaminants that may affect pH balance",
                "• Ensure proper filtration and treatment"
            ]
        },
        {
            level: "Too Alkaline",
            metric: "pH",
            color: "rgba(230, 126, 14)",
            description: "The water is too alkaline, which can reduce nutrient availability and harm aquatic organisms.",
            icon: "⚠️",
            recommendations: [
                "• Apply acids or acidic compounds to adjust pH levels",
                "• Check for sources of alkaline pollution",
                "• Monitor for algae blooms or other signs of imbalance"
            ]
        },
    
        // Temperature Levels
        {
            level: "Too Cold",
            metric: "Water Temperature",
            color: "rgba(230, 126, 14)",
            description: "Water temperature is too cold, which may reduce the metabolism of aquatic organisms.",
            icon: "❄️",
            recommendations: [
                "• Consider using temperature regulation in controlled environments",
                "• Monitor temperature-sensitive species",
                "• Avoid thermal shock by gradual adjustments"
            ]
        },
        {
            level: "Acceptable",
            metric: "Water Temperature",
            color: "rgba(154, 205, 50)",
            description: "Water temperature is within the acceptable range, supporting healthy aquatic life.",
            icon: "🌊",
            recommendations: [
                "• Maintain consistent water temperature",
                "• Avoid activities that may cause temperature fluctuations",
                "• Regularly monitor for any sudden changes"
            ]
        },
        {
            level: "Too Hot",
            metric: "Water Temperature",
            color: "rgba(199, 46, 46)",
            description: "Water temperature is too high, which can reduce oxygen levels and harm aquatic organisms.",
            icon: "🔥",
            recommendations: [
                "• Implement cooling measures in industrial discharges",
                "• Provide shading for small water bodies",
                "• Avoid thermal pollution from power plants or other sources"
            ]
        },
    
        // TSS Levels
        {
            level: "Acceptable",
            metric: "TSS (Total Suspended Solids)",
            color: "rgba(154, 205, 50)",
            description: "The water clarity is acceptable, with suspended solid levels within safe limits.",
            icon: "💧",
            recommendations: [
                "• Maintain current water management practices",
                "• Continue regular monitoring to detect changes",
                "• Prevent soil erosion and runoff into water sources"
            ]
        },
        {
            level: "Too Cloudy",
            metric: "TSS (Total Suspended Solids)",
            color: "rgba(199, 46, 46)",
            description: "The water is too cloudy, which can block sunlight and harm aquatic life.",
            icon: "🌫️",
            recommendations: [
                "• Use filtration or sedimentation to reduce suspended solids",
                "• Control runoff and erosion near water sources",
                "• Inspect for algal blooms or other sources of turbidity"
            ]
        },
    
        // TDS Levels
        {
            level: "Acceptable",
            metric: "TDS (Total Dissolved Substances)",
            color: "rgba(154, 205, 50)",
            description: "The dissolved substance levels are acceptable, ensuring water quality is safe for most uses.",
            icon: "🌊",
            recommendations: [
                "• Continue regular monitoring to maintain levels",
                "• Check for potential sources of dissolved substances",
                "• Ensure proper filtration and treatment where needed"
            ]
        },
        {
            level: "High Dissolved Substances",
            metric: "TDS (Total Dissolved Substances)",
            color: "rgba(199, 46, 46)",
            description: "The water contains high levels of dissolved substances, which can affect taste, usability, and aquatic life.",
            icon: "⚠️",
            recommendations: [
                "• Use reverse osmosis or other purification methods",
                "• Identify and eliminate sources of high TDS",
                "• Monitor aquatic ecosystems for stress"
            ]
        }
    ];
    

    const fetchDayData = async () => {
        try {
            setLoading(true);
            const selectedDay = selectedDate ? new Date(selectedDate) : new Date();
            selectedDay.setHours(0, 0, 0, 0);
            const nextDay = new Date(selectedDay);
            nextDay.setDate(nextDay.getDate() + 1);

            const { data, error } = await supabaseWater
                .from('sensor_data')
                .select('*')
                .gte('timestamp', selectedDay.toISOString())
                .lt('timestamp', nextDay.toISOString())
                .order('timestamp', { ascending: true });

            if (error) throw error;

            if (!data || data.length === 0) {
                toast.info('No data available for the selected date');
                setHourlyData([]);
                setLoading(false);
                return;
            }

            const hourlyProcessed = Array(24).fill(null).map((_, hour) => {
                const hourData = data.filter(record => {
                    const recordHour = new Date(record.timestamp).getUTCHours();
                    return recordHour === hour;
                });

                if (hourData.length === 0) return {
                    hour,
                    pH: null,
                    temperature: null,
                    tss: null,
                    tds_ppm: null,
                    status: null,
                    color: null
                };

                const metrics = {};
                ['pH', 'temperature', 'tss', 'tds_ppm'].forEach(metric => {
                    const values = hourData.map(item => item[metric]);
                    const validValues = values.filter(v => v !== null);
                    metrics[metric] = validValues.length > 0
                        ? validValues.reduce((sum, val) => sum + val, 0) / validValues.length
                        : null;
                });

                return {
                    hour,
                    ...metrics,
                };
            });

            setHourlyData(hourlyProcessed);
            setLoading(false);
            toast.success('Data fetched successfully');

        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Error fetching data: ' + error.message);
            setLoading(false);
            setHourlyData([]);
        }
    };

    useEffect(() => {
        fetchDayData();
    }, [selectedDate]);

    useEffect(() => {
        const interval = setInterval(() => {
            setShowThresholdInfo(prevState => ({
                pH: !prevState.pH,
                temperature: !prevState.temperature,
                tss: !prevState.tss,
                tds_ppm: !prevState.tds_ppm
            }));
        }, 10000); // Toggle every 10 seconds

        return () => clearInterval(interval);
    }, []);

    const getWaterQualityStatus = (value, metricId) => {
        if (value === null || value === undefined) return null;

        const metricThresholds = thresholds[metricId];
        if (!metricThresholds) return null;

        for (const threshold of metricThresholds) {
            if (value <= threshold.max) {
                return threshold;
            }
        }
        return metricThresholds[metricThresholds.length - 1];
    };

    const getBarChartData = (metricId) => {
        const hourData = hourlyData[selectedHourForNarrative];
        const value = hourData?.[metricId];
        const status = getWaterQualityStatus(value, metricId);

        return {
            labels: [metricId.toUpperCase()],
            datasets: [{
                label: `${metricId.toUpperCase()} Measurement`,
                data: [value !== null && value !== undefined ? Number(value.toFixed(2)) : 0],
                backgroundColor: [status?.color || 'rgba(75, 192, 192, 0.6)'],
                borderRadius: 4,
            }]
        };
    };

    const barChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    color: 'rgba(255, 255, 255, 0.1)',
                },
                ticks: {
                    color: '#fff',
                    font: {
                        size: 12
                    },
                    callback: function (value) {
                        return value.toFixed(0);
                    },
                    autoSkip: false,  // Show all ticks
                    maxTicksLimit: 10  // Maximum number of ticks to show
                },
            },
            x: {
                grid: {
                    display: false
                },
                ticks: {
                    color: '#fff',
                    font: {
                        size: 14,
                        weight: 'bold'
                    }
                }
            }
        },
        plugins: {
            legend: {
                display: true,
                labels: {
                    color: '#fff',
                    font: {
                        size: 12
                    }
                }
            },
            tooltip: {
                callbacks: {
                    label: (context) => {
                        const metricId = context.label.toLowerCase();
                        const originalValue = hourlyData[selectedHourForNarrative]?.[metricId];
                        const status = getWaterQualityStatus(originalValue, metricId);
                        return [
                            `Measurement: ${context.raw.toFixed(2)}`,
                            `Status: ${status?.label || 'N/A'}`
                        ];
                    },
                },
            },
            datalabels: {
                color: '#fff', // Set the text color to white
                font: {
                    size: 18,
                    weight: 'bold'
                },
                formatter: (value) => value.toFixed(2) // Format to 2 decimal places
            }
        },
        layout: {
            padding: {
                left: 25,    // Increased left padding
                right: 25,   // Increased right padding
                top: 25,     // Increased top padding
                bottom: 15   // Increased bottom padding
            }
        },
        elements: {
            bar: {
                borderWidth: 2,
                borderRadius: 4,
                borderSkipped: false,
            }
        },
        barThickness: 40,
        datasets: {
            bar: {
                barThickness: 60,  // Make bars thicker
                maxBarThickness: 80,  // Maximum thickness
                barPercentage: 0.5,  // Control bar width relative to category
                categoryPercentage: 0.8,  // Control spacing between bars
            },
        },
    };

    const formatHour = (hour) => {
        if (hour === 0) return '12AM'; // Midnight
        if (hour === 12) return '12PM'; // Noon
        return `${hour > 12 ? hour - 12 : hour}${hour >= 12 ? 'PM' : 'AM'}`;
    };

    const handleHourRangeShift = (direction) => {
        setVisibleHourRange(prev => {
            const firstHour = prev[0];
            if (direction === 'next') {
                const nextStart = (firstHour + 6) % 24;
                return Array.from({ length: 6 }, (_, i) => (nextStart + i) % 24);
            } else {
                let prevStart = firstHour - 6;
                if (prevStart < 0) prevStart += 24;
                return Array.from({ length: 6 }, (_, i) => (prevStart + i) % 24);
            }
        });
    };

    const getAverageWaterQualityStatus = (hourData) => {
        if (!hourData || (!hourData.tds_ppm && !hourData.tss)) return null;

        const tdsStatus = getWaterQualityStatus(hourData.tds_ppm, 'tds_ppm');
        const tssStatus = getWaterQualityStatus(hourData.tss, 'tss');

        if (tdsStatus?.label === "High Dissolved Substances") return tdsStatus;
        if (tssStatus?.label === "Too Cloudy") return tssStatus;
        if (tdsStatus?.label === "Acceptable" && tssStatus?.label === "Acceptable") return tdsStatus;

        return tdsStatus || tssStatus;
    };

    const renderHourCards = () => (
        <div style={styles.hoursContainer}>
            {visibleHourRange.map((hour) => {
                const hourData = hourlyData[hour];
                const waterQualityStatus = getAverageWaterQualityStatus(hourData);

                return (
                    <div
                        key={hour}
                        style={{
                            ...styles.upperHourCard,
                            ...(hour === selectedHourForNarrative ? styles.selectedHourCard : {}),
                            border: hour === selectedHourForNarrative ? '3px solid #00fffb' : 'none',
                        }}
                        onClick={() => setSelectedHourForNarrative(hour)}
                    >
                        <div style={styles.hourText}>{formatHour(hour)}</div>
                        {waterQualityStatus && (
                            <div style={{
                                textAlign: 'center',
                                fontSize: '10px',
                                color: '#fff',
                                marginTop: '5px',
                                fontWeight: 'bold',
                                backgroundColor: waterQualityStatus.color,
                                padding: '5px 10px',
                                borderRadius: '20px',
                                minWidth: '50px',
                            }}>
                                {waterQualityStatus.label}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );

    const renderThresholdInfo = (metricId) => {
        const status = getWaterQualityStatus(hourlyData[selectedHourForNarrative]?.[metricId], metricId);
        const thresholdData = thresholdInfoWater.find(t => t.level === status?.label);

        return (
            <div style={styles.thresholdInfoContainer}>
                <h2 style={styles.thresholdTitle}>{thresholdData?.level}</h2>
                <p style={styles.thresholdDescription}>{thresholdData?.description}</p>
                <ul style={styles.recommendationsList}>
                    {thresholdData?.recommendations.map((rec, index) => (
                        <li key={index} style={styles.recommendationItem}>{rec}</li>
                    ))}
                </ul>
            </div>
        );
    };

    const renderMetricBox = (metricId, title, boxStyle) => (
        <div style={boxStyle}>
            <div style={styles.iotHeaderBox}>
                <div style={styles.statusHeader}>
                    {hourlyData[selectedHourForNarrative] && (
                        <div
                            style={{
                                ...styles.statusBox,
                                backgroundColor: getWaterQualityStatus(
                                    hourlyData[selectedHourForNarrative][metricId],
                                    metricId
                                )?.color,
                                cursor: 'pointer'
                            }}
                            onClick={() => setShowThresholdInfo(prev => ({ ...prev, [metricId]: !prev[metricId] }))}
                        >
                            <p style={styles.statusText}>
                                {getWaterQualityStatus(
                                    hourlyData[selectedHourForNarrative][metricId],
                                    metricId
                                )?.label || 'N/A'}
                            </p>
                        </div>
                    )}
                </div>
            </div>
            <div style={styles.chartContainer}>
                {showThresholdInfo[metricId] ?
                    renderThresholdInfo(metricId) :
                    <Bar data={getBarChartData(metricId)} options={barChartOptions} />
                }
            </div>
        </div>
    );

    return (
        <div style={styles.fullcontainer}>
            <div style={styles.headerContainer}>
                <header style={styles.header}>
                    <div>
                        <h1 style={styles.title}>Water Quality Dashboard</h1>
                        <p style={styles.subtitle}>Monitor real-time water quality metrics</p>
                    </div>
                    <div style={styles.inputContainer}>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            style={styles.datePicker}
                        />
                    </div>
                </header>
            </div>

            <div style={styles.hourcard}>
                <div style={styles.row}>
                    <div style={styles.box0}>
                        <div style={styles.iotHeaderBox}>
                            <h2 style={styles.waterHeaderTitle}>24 Hour Water Quality View</h2>
                            <div style={styles.hourSelector}>
                                <button
                                    style={styles.hourButton}
                                    onClick={() => handleHourRangeShift('prev')}
                                >
                                    <ArrowLeftIcon style={{ fontSize: 60 }} />
                                </button>
                                {renderHourCards()}
                                <button
                                    style={styles.hourButton}
                                    onClick={() => handleHourRangeShift('next')}
                                >
                                    <ArrowRightIcon style={{ fontSize: 60 }} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div style={styles.gridContainer}>
                <div style={styles.column}>
                    {renderMetricBox('pH', 'pH Level', styles.box1)}
                    {renderMetricBox('temperature', 'Temperature', styles.box2)}
                </div>
                <div style={styles.column}>
                    {renderMetricBox('tss', 'TSS', styles.box3)}
                    {renderMetricBox('tds_ppm', 'TDS', styles.box4)}
                </div>
            </div>

            <ToastContainer style={{ marginTop: '70px' }} />
        </div>
    );
};

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
    inputContainer: {
        display: "flex",
        gap: "10px",
        padding: "10px",
        borderRadius: "8px",
        backgroundColor: 'rgba(242, 242, 242, 0.1)', // Semi-transparent white
    },
    datePicker: {
        borderRadius: "8px",
        border: "none",
        color: '#fff',
        margin: 0,
        padding: "5px", // Controls inner spacing (top-bottom and left-right)
        textAlign: "center", // Aligns the text inside the input
        width: "130px", // Adjusts the width if needed
        backgroundColor: "rgba(4, 184, 175, 0.46)", // Semi-transparent white
    },

    // 24-Hour Row styles
    hourcard: {
        display: "flex",
        flexDirection: "row",
        flex: 0.25,
        gap: "20px",
        marginLeft: "70px",
    },

    // Grid container styles
    gridContainer: {
        display: "flex",
        flexDirection: "row",
        flex: 1,
        gap: "20px",
        marginTop: "15px",
        marginLeft: "70px",
    },

    row: {
        flex: 1,
        display: "flex",
        flexDirection: "row",
        gap: "15px",
    },

    // Column styles
    column: {
        flex: 1,
        display: "flex",
        flexDirection: "column",
        gap: "15px",
    },

    box0: {
        flex: 1,
        backgroundColor: 'rgba(242, 242, 242, 0.1)',
        borderRadius: "30px",
        display: "flex",
        flexDirection: "row",
        alignItems: "flex-start",  // Align header to the left
        justifyContent: "center",
        fontSize: "1.5rem",
        color: "#fff",
        fontWeight: "bold",
        padding: "15px",
    },
    box1: {
        flex: 1,
        backgroundColor: 'rgba(242, 242, 242, 0.1)',
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
        flex: 1,
        backgroundColor: 'rgba(242, 242, 242, 0.1)',
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
        flex: 1,
        backgroundColor: 'rgba(242, 242, 242, 0.1)',
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
    box4: {
        flex: 1,
        backgroundColor: 'rgba(242, 242, 242, 0.1)',
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
        flex: 1,
        backgroundColor: 'rgba(242, 242, 242, 0.1)',
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
    iotHeaderBox: {
        margin: 0,
        fontWeight: "bold",
        textAlign: "left",
    },
    waterHeaderTitle: {
        fontSize: "1.2rem",
        color: "#fff",
        textAlign: 'center',
        marginLeft: '-60px',
    },
    hourSelector: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    hourButton: {
        backgroundColor: 'transparent',
        border: 'none',
        color: '#fff',
        cursor: 'pointer',
    },
    hoursContainer: {
        display: 'flex',
        justifyContent: 'space-between',
        flex: 1,
        margin: '0 10px',
    },
    upperHourCard: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '10px',
        borderRadius: '10px',
        backgroundColor: 'rgba(255, 255, 255, 0.1)', // Semi-transparent white
        cursor: 'pointer',
        margin: '10px',
        width: '150px',
        transition: 'background-color 0.3s',
    },
    selectedHourCard: {
        backgroundColor: "rgba(0, 204, 221, 0.46)",
        transform: "scale(1.05)",
    },
    hourText: {
        color: '#fff',
        fontSize: '1rem',
        fontWeight: 'bold',
    },
    statusHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
    },
    statusBox: {
        padding: '5px 10px',
        borderRadius: '5px',
        color: '#fff',
        fontSize: '15px',
        fontWeight: 'bold',
        textAlign: 'center',
    },
    statusText: {
        margin: 0,
    },
    chartContainer: {
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        margin: '-20px 0',
        // paddingBottom: '20px',
    },
    thresholdInfoContainer: {
        color: '#fff',
        justifyContent: 'flex-end',
    },
    thresholdTitle: {
        textAlign: 'center',
        fontSize: '1.5rem',
        fontWeight: 'bold',
        display: 'none',
    },
    thresholdDescription: {
        textAlign: 'left',
        fontSize: '1.1rem',
        margin: '10px 0',
    },
    recommendationsList: {
        listStyleType: 'none',
        padding: 0,
    },
    recommendationItem: {
        textAlign: 'left',
        fontSize: '1rem',
        margin: '5px 0',
        fontWeight: 'normal',
    },
};

export default WaterBar;
