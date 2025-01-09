import React, { useEffect, useState } from 'react';
import { supabaseWater } from '../iot/WaterQuality/supabaseClient';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Bar } from 'react-chartjs-2';
import backgroundImage from '../../assets/soildash2.png';
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

const SoilBar = () => {
    const getCurrentHourBlock = (hour) => {
        const blockStart = Math.floor(hour / 6) * 6;
        return Array.from({ length: 6 }, (_, i) => (blockStart + i) % 24);
    };

    const [hourlyData, setHourlyData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState('');
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
                .lte('timestamp', nextDay.toISOString())
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

                if (hourData.length === 0) {
                    return {
                        hour,
                        pH: null,
                        temperature: null,
                        tss: null,
                        tds_ppm: null,
                        status: null,
                        color: null
                    };
                }

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
                data: [value !== null && value !== undefined ? value : 0],
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
                ticks: {
                    color: '#fff',
                },
                grid: {
                    display: true,
                    color: 'rgba(255, 255, 255, 0.3)',
                },
            },
            x: {
                ticks: {
                    color: '#fff',
                    minRotation: 0,
                    maxRotation: 0,
                    font: {
                        size: 14,
                        weight: 'bold'
                    },
                    padding: 10,
                },
                grid: {
                    display: false,
                    color: 'rgba(255, 255, 255, 0.5)',
                },
            },
        },
        elements: {
            bar: {
                borderSkipped: false,
            },
        },
        datasets: {
            bar: {
                barPercentage: 0.2,
                categoryPercentage: 1,
            },
        },
        plugins: {
            legend: {
                labels: {
                    color: '#fff',
                },
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
        if (!hourData || (!hourData.pH && !hourData.temperature && !hourData.tss && !hourData.tds_ppm)) return null;

        const pHStatus = getWaterQualityStatus(hourData.pH, 'pH');
        const temperatureStatus = getWaterQualityStatus(hourData.temperature, 'temperature');
        const tssStatus = getWaterQualityStatus(hourData.tss, 'tss');
        const tdsStatus = getWaterQualityStatus(hourData.tds_ppm, 'tds_ppm');

        // Get the more severe status
        const statuses = [pHStatus, temperatureStatus, tssStatus, tdsStatus].filter(Boolean);
        return statuses.reduce((prev, current) => {
            const prevIndex = thresholds[current.metric].findIndex(t => t.label === prev.label);
            const currentIndex = thresholds[current.metric].findIndex(t => t.label === current.label);
            return currentIndex > prevIndex ? current : prev;
        }, statuses[0]);
    };

    return (
        <div style={styles.fullcontainer}>
            <div style={styles.headerContainer}>
                <header style={styles.header}>
                    <div>
                        <h1 style={styles.title}>Soil Quality Dashboard</h1>
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
                            <h2 style={styles.waterHeaderTitle}>24 Hour Soil Quality View</h2>
                            <div style={styles.hourSelector}>
                                <button
                                    style={styles.hourButton}
                                    onClick={() => handleHourRangeShift('prev')}
                                >
                                    <ArrowLeftIcon style={{ fontSize: 60 }} />
                                </button>

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
                                                <div style={styles.statusText}>{waterQualityStatus?.label || 'N/A'}</div>
                                            </div>
                                        );
                                    })}
                                </div>

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
                {/* Soil Quality Column */}
                <div style={styles.column}>
                    <div style={styles.box1}>
                        <div style={styles.iotHeaderBox}>
                            <div style={styles.statusHeader}>
                                
                            </div>
                        </div>
                        <div style={styles.chartContainer}>
                            
                        </div>
                    </div>
                </div>

                <div style={styles.column}>
                    <div style={styles.box2}>
                        <div style={styles.iotHeaderBox}>
                            <div style={styles.statusHeader}>
                                
                            </div>
                        </div>
                        <div style={styles.chartContainer}>
                            
                        </div>
                    </div>
                </div>

                <div style={styles.column}>
                    <div style={styles.box4}>
                        <div style={styles.iotHeaderBox}>
                            <div style={styles.statusHeader}>
                                
                            </div>
                        </div>
                        <div style={styles.chartContainer}>
                            
                        </div>
                    </div>
                </div>
            </div>

            <div style={styles.gridContainer2}>
                <div style={styles.column}>
                    <div style={styles.box2}>
                        <div style={styles.iotHeaderBox}>
                            <div style={styles.statusHeader}>
                                
                            </div>
                        </div>
                        <div style={styles.chartContainer}>
                            
                        </div>
                    </div>
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
        backgroundColor: "rgba(145, 137, 39, 0.5)", // Semi-transparent white
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

    gridContainer2: {
        display: "flex",
        flexDirection: "row",
        flex: 0.6,
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
        marginBottom: '20px',
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
};

export default SoilBar;
