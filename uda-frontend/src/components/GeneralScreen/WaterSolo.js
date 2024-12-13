import React, { useEffect, useState } from 'react';
import { supabase } from '../iot/WaterQuality/supabaseClient';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Bar } from 'react-chartjs-2'; // Add Bar import
import backgroundImage from '../../assets/airdash.png';
import ArrowLeftIcon from '@mui/icons-material/ArrowLeft';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip as ChartTooltip,
    Legend,
} from 'chart.js';
import { Tooltip } from '@mui/material';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    ChartTooltip,
    Legend
);

const WaterView = () => {
    // Get the current local date in YYYY-MM-DD format
    const getCurrentLocalDate = () => {
        const now = new Date();
        return now.toLocaleDateString('en-CA'); // Returns YYYY-MM-DD format in local timezone
    };

    const [hourlyData, setHourlyData] = useState([]);
    const [selectedLocation, setSelectedLocation] = useState(3); // Default to USTP-CDO
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(getCurrentLocalDate());
    const [visibleHours, setVisibleHours] = useState([0]); // Show 9 hours
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [slideDirection, setSlideDirection] = useState('left');
    const [currentSlide, setCurrentSlide] = useState(0);
    const [hoveredData, setHoveredData] = useState(null);
    const [selectedHourForNarrative, setSelectedHourForNarrative] = useState(new Date().getHours());
    const [visibleHourRange, setVisibleHourRange] = useState([1, 2, 3, 4, 5, 6]); // Start from 1AM

    const locations = [
        { id: 1, name: 'LAPASAN' },
        { id: 2, name: 'AGUSAN' },
        { id: 3, name: 'USTP-CDO' },
        { id: 4, name: 'EL SALVADOR' },
        { id: 5, name: 'SPORTS COMPLEX' },
    ];

    // Update thresholds 
    const thresholds = {
        pH: [
            { min: 0, max: 6.49, label: "Too Acidic", color: "rgba(254, 0, 0)" },
            { min: 6.5, max: 8.5, label: "Acceptable", color: "rgba(22, 186, 1)" },
            { min: 8.51, max: Infinity, label: "Too Alkaline", color: "rgba(255, 140, 0)" },
        ],
        temperature: [
            { min: 0, max: 25.99, label: "Too Cold", color: "rgba(255, 140, 0)" },
            { min: 26, max: 30, label: "Acceptable", color: "rgba(22, 186, 1)" },
            { min: 30.01, max: Infinity, label: "Too Hot", color: "rgba(254, 0, 0)" },
        ],
        tss: [
            { min: 0, max: 50, label: "Acceptable", color: "rgba(22, 186, 1)" },
            { min: 50.01, max: Infinity, label: "Too Cloudy", color: "rgba(254, 0, 0)" },
        ],
        tds_ppm: [
            { min: 0, max: 500, label: "Acceptable", color: "rgba(22, 186, 1)" },
            { min: 500.01, max: Infinity, label: "High Dissolved Substances", color: "rgba(254, 0, 0)" },
        ],
    };

    // Update thresholdInfo to only include relevant statuses
    const thresholdInfo = [
        {
            level: "Acceptable",
            color: "rgba(22, 186, 1)",
            description: "The water quality is within safe limits. Both TSS and TDS levels are within acceptable ranges, indicating good water clarity and mineral content.",
            icon: "✅",
            recommendations: [
                "Continue regular monitoring",
                "Maintain current filtration system",
                "Document conditions for reference"
            ]
        },
        {
            level: "Too Cloudy",
            color: "rgba(254, 0, 0)",
            description: "Total Suspended Solids (TSS) are too high, making the water cloudy. This affects water clarity and may indicate contamination.",
            icon: "🌫️",
            recommendations: [
                "Check filtration systems",
                "Increase settling time",
                "Investigate source of turbidity"
            ]
        },
        {
            level: "High Dissolved Substances",
            color: "rgba(254, 0, 0)",
            description: "Total Dissolved Solids (TDS) exceed recommended levels. This may affect water taste and quality.",
            icon: "💧",
            recommendations: [
                "Review treatment processes",
                "Check for mineral buildup",
                "Consider additional filtration"
            ]
        }
    ];


    const metrics = [
        {
            id: 'pH',
            name: 'pH Level',
            tooltip: 'Measure of water acidity or alkalinity. Optimal range is 6.5-8.5.',
            getIcon: (status) => {
                switch (status) {
                    case 'Acceptable': return '✅';
                    case 'Too Acidic': return '⚠️';
                    case 'Too Alkaline': return '⚡';
                    default: return '❓';
                }
            }
        },
        {
            id: 'temperature',
            name: 'Temperature',
            tooltip: 'Water temperature in Celsius. Optimal range is 26-30°C.',
            getIcon: (status) => {
                switch (status) {
                    case 'Acceptable': return '✅';
                    case 'Too Hot': return '🔥';
                    case 'Too Cold': return '❄️';
                    default: return '❓';
                }
            }
        },
        {
            id: 'tss',
            name: 'TSS',
            tooltip: 'Total Suspended Solids, measures water clarity. Should be below 50 mg/L.',
            getIcon: (status) => {
                switch (status) {
                    case 'Acceptable': return '✅';
                    case 'Too Cloudy': return '🌫️';
                    default: return '❓';
                }
            }
        },
        {
            id: 'tds_ppm',
            name: 'TDS',
            tooltip: 'Total Dissolved Solids in parts per million. Should be below 500 ppm.',
            getIcon: (status) => {
                switch (status) {
                    case 'Acceptable': return '✅';
                    case 'High Dissolved Substances': return '💧';
                    default: return '❓';
                }
            }
        }
    ];


    useEffect(() => {
        fetchDayData();
    }, [selectedLocation, selectedDate]);

    useEffect(() => {
        // Auto-scroll timer
        const timer = setInterval(() => {
            handleAutomaticScroll();
        }, 5000); // Scroll every 5 seconds

        return () => clearInterval(timer);
    }, [visibleHours]);

    useEffect(() => {
        const slideTimer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % thresholdInfo.length);
        }, 10000); // Change slide every 10 seconds

        return () => clearInterval(slideTimer);
    }, []);

    const fetchDayData = async () => {
        try {
            setLoading(true);

            const startOfDay = `${selectedDate}T00:00:00.000Z`;
            const endOfDay = `${selectedDate}T23:59:59.999Z`;

            const { data, error } = await supabase
                .from('sensor_data')
                .select('*')
                .gte('timestamp', startOfDay)
                .lte('timestamp', endOfDay)
                .order('timestamp', { ascending: true });

            if (error) throw error;

            if (!data || data.length === 0) {
                toast.info('No data available for the selected date and location');
                setHourlyData([]);
                setLoading(false);
                return;
            }

            // Process hourly averages without timezone adjustments
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

                // Calculate averages for metrics
                const metrics = {};
                ['pH', 'temperature', 'tss', 'tds_ppm'].forEach(metric => {
                    const values = hourData.map(item => item[metric]);
                    const validValues = values.filter(v => v !== null);
                    metrics[metric] = validValues.length > 0
                        ? validValues.reduce((sum, val) => sum + val, 0) / validValues.length
                        : null;
                });

                const status = getAverageWaterQualityStatus({ tds_ppm: metrics.tds_ppm, tss: metrics.tss });

                return {
                    hour,
                    ...metrics,
                    status: status?.label || null,
                    color: status?.color || null
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

    // Update getAirQualityStatus function to handle all metrics
    const getAirQualityStatus = (value, metricId) => {
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

    const formatHour = (hour) => {
        if (hour === 0) return '12AM'; // Midnight
        if (hour === 12) return '12PM'; // Noon
        return `${hour > 12 ? hour - 12 : hour}${hour >= 12 ? 'PM' : 'AM'}`;
    };

    const handleScroll = (direction) => {
        const container = document.getElementById('timeline-container');
        const scrollAmount = direction === 'right' ? 300 : -300;
        if (container) {
            container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    const handleAutomaticScroll = () => {
        setIsTransitioning(true);
        setSlideDirection('left');

        setTimeout(() => {
            setVisibleHours(prev => {
                const nextHours = prev.map(hour => (hour + 1) % 24);
                return nextHours;
            });
            setIsTransitioning(false);
        }, 500); // Match this with CSS transition duration
    };

    const handleManualScroll = (direction) => {
        setIsTransitioning(true);
        setSlideDirection(direction);

        setTimeout(() => {
            setVisibleHours(prev => {
                const shift = direction === 'right' ? -3 : 3;
                return prev.map(hour => {
                    const newHour = hour + shift;
                    return newHour < 0 ? newHour + 24 : newHour % 24;
                });
            });
            setIsTransitioning(false);
        }, 500);
    };

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % thresholdInfo.length);
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev - 1 + thresholdInfo.length) % thresholdInfo.length);
    };


    // const responsiveStyles = {
    //     // Mobile styles (default)
    //     container: {
    //         padding: '10px',
    //         width: '100%',
    //         maxWidth: '100vw',
    //         overflowX: 'hidden',
    //     },
    //     header: {
    //         flexDirection: 'column',
    //         gap: '15px',
    //     },
    //     controls: {
    //         flexDirection: 'column',
    //         width: '100%',
    //     },
    //     datePicker: {
    //         width: '100%',
    //         maxWidth: '300px',
    //     },
    //     locationSelect: {
    //         width: '100%',
    //         maxWidth: '300px',
    //     },
    //     scrollContainer: {
    //         width: 'calc(100vw - 100px)', // Account for buttons and padding
    //         maxWidth: '1000px',
    //     },
    //     hourCard: {
    //         maxHeight: '10px', // Smaller cards on mobile
    //         padding: '10px',
    //         boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',

    //     },
    //     levelIndicator: {
    //         height: '80px', // Smaller height on mobile
    //         fontSize: '14px',
    //     },
    //     slideshowContainer: {
    //         flexDirection: 'column',
    //         gap: '10px',
    //     },
    //     slide: {
    //         width: '100%',
    //         maxWidth: '400px',
    //         height: 'auto',
    //         minHeight: '330px',
    //     },
    // };

    // // Tablet styles
    // const tabletStyles = {
    //     '@media (min-width: 768px)': {
    //         container: {
    //             padding: '15px',
    //         },
    //         header: {
    //             flexDirection: 'row',
    //         },
    //         controls: {
    //             flexDirection: 'row',
    //             width: 'auto',
    //         },
    //         scrollContainer: {
    //             width: 'calc(100vw - 150px)',
    //         },
    //         hourCard: {
    //             minWidth: '100px',
    //         },
    //         levelIndicator: {
    //             height: '90px',
    //             fontSize: '15px',
    //         },
    //         slideshowContainer: {
    //             flexDirection: 'row',
    //         },
    //         slide: {
    //             width: '600px',
    //             height: '350px',
    //         },
    //     },
    // };

    // // Desktop styles
    // const desktopStyles = {
    //     '@media (min-width: 0px)': {
    //         container: {
    //             padding: '20px',
    //         },
    //         scrollContainer: {
    //             width: '1000px',
    //         },
    //         hourCard: {
    //             minWidth: '120px',
    //         },
    //         levelIndicator: {
    //             height: '100px',
    //             fontSize: '16px',
    //         },
    //         slide: {
    //             width: '800px',
    //             height: '400px',
    //         },
    //     },
    // };

    const styles = {
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
            overflowX: 'hidden', // Prevent horizontal scroll
        },

        // Header Section Styles
        headerContainer: {
            display: "flex",
            justifyContent: "center", // Centers the entire header container
            marginBottom: "20px",
            marginTop: "5px",
            marginLeft: "70px",
            // marginRight: "70px",
        },
        header: {
            display: "flex",
            justifyContent: "space-between", // Separates the text and input containers
            alignItems: "center", // Ensures both sections are aligned vertically
            width: "100%", // Ensures the header takes up full width
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
            backgroundColor: "rgba(0, 204, 221, 0.46)", // Semi-transparent white
        },
        locationSelect: {
            borderRadius: "8px",
            border: "none",
            color: '#fff',
            margin: 0,
            padding: "5px", // Controls inner spacing (top-bottom and left-right)
            textAlign: "center", // Aligns the text inside the input
            width: "160px", // Adjusts the width if needed
            backgroundColor: "rgba(0, 204, 221, 0.46)", // Semi-transparent white
        },

        // Main Content Section Styles
        content: {
            flex: 1,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "stretch",
            gap: "20px",
            marginLeft: '70px',
        },

        // Left Container
        leftContainer: {
            flex: 0.4, // Slightly smaller than the right container
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            gap: "10px",
        },

        // UPPER LEFT BOX BAR CHART MERGED METRICS
        upperLeftBox: {
            flex: 0.62, // Reduce flex value to make the upper box smaller
            backgroundColor: 'rgba(242, 242, 242, 0.1)',
            borderRadius: "20px",
            width: "100%",
            height: "150px",  // Keep the height as needed
            padding: "15px",
            display: "flex",
            flexDirection: "column"
        },
        chartContainer: {
            flex: 1,
            width: '100%',
            height: '50%', // Set height as a percentage of the parent container's height
        },

        //LOWER LEFT THRESHOLD INFO SLIDER BOX
        lowerLeftBox: {
            flex: 0.38, // Increase flex value to make the lower box taller
            width: "100%",
            minHeight: "250px",  // Set a minimum height to ensure it has enough space even if text grows
            borderRadius: "15px",
            padding: "15px",
            transition: "background-color 0.3s ease",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            backgroundColor: 'rgba(242, 242, 242, 0.1)',
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
        },
        thresholdWrapper: {
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "0 30px 0 10px", // Padding for the surfboard effect
            borderRadius: "30px", // Elongated oval shape
            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)", // Subtle shadow
            maxWidth: "fit-content", // Prevent it from taking up unnecessary space
        },
        wrapperContent: {
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            color: "#fff", // Text color
        },
        slideHeader: {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "8px",
        },
        slideHeaderLeft: {
            display: "flex",
            alignItems: "center",
        },
        slideHeaderRight: {
            display: "flex",
            alignItems: "center",
            gap: "8px", // Space between elements
        },
        thresholdCircle: {
            marginRight: "8px",
            width: "40px", // Adjust the size of the circle
            height: "40px",
            borderRadius: "50%",
            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)", // Optional shadow for better visual appeal
        },
        slideIcon: {
            fontSize: "30px", // Reduce icon size
            marginLeft: "8px",
        },
        slideTitle: {
            fontSize: "20px", // Adjust font size for title
            fontWeight: "bold",
            color: "#fff",
            marginTop: "10px",
        },
        slideshowBody: {
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
            alignItems: "flex-start",
            height: "100%",
        },
        slide: {
            flex: 1,
            display: "flex",
        },
        slideContent: {
            width: "100%",
            marginLeft: "10px",
            // padding: "15px", // Reduce padding
            color: "#fff",
            textAlign: "left",
        },
        slideBody: {
            // marginTop: "8px", // Reduce margin
            textAlign: "left",
        },
        slideDescription: {
            marginTop: "15px", // Reduce margin
            fontSize: "25px", // Adjust font size for text
            lineHeight: "1.4", // Slightly tighter line spacing
        },
        rangeInfo: {
            marginBottom: "8px", // Reduce margin
        },
        recommendations: {
            marginTop: "8px", // Reduce margin
            textAlign: "left",
        },
        slideButton: {
            backgroundColor: "rgba(0, 204, 221, 0.46)",
            color: "#fff",
            border: "none",
            borderRadius: "5px",
            padding: "6px 10px", // Adjust button size
            cursor: "pointer",
            fontSize: "12px", // Adjust font size for buttons
        },




        // Right Container
        rightContainer: {
            flex: 0.6, // Slightly larger than the left container
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "20px",  // Increased gap between boxes
            backgroundColor: 'rgba(242, 242, 242, 0.1)',
            borderRadius: "20px",
            padding: "20px 20px 5px 20px",  // Adjusted padding for better alignment
        },

        // UPPER RIGHT BOX
        upperRightBox: {
            backgroundColor: 'rgba(242, 242, 242, 0)',
            borderRadius: "10px",
            height: "25%",
            width: "95%",
        },
        // Add new styles for hour selector
        upperRightHeader: {
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#fff',
            textAlign: 'center',
            marginBottom: '15px',
        },
        hourSelector: {
            display: "flex",
            justifyContent: "space-between",
            // alignItems: "center",
            height: "100%",
            gap: "10px",
        },
        hoursContainer: {
            display: "flex",
            justifyContent: "space-between",
            flex: 1,
            gap: "10px",
            transition: "all 0.3s ease",
        },
        selectedHourCard: {
            backgroundColor: "rgba(0, 204, 221, 0.46)",
            transform: "scale(1.05)",
        },
        upperHourCard: {
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            borderRadius: "8px",
            width: "100%",
            height: "130px", // Slightly bigger than the current 170px
            cursor: "pointer",
            transition: "0.3s ease",
            backgroundColor: "rgba(255, 255, 255, 0.1)",
        },
        hourText: {
            fontSize: "20px",
            fontWeight: "bold",
            color: "#fff",
            marginBottom: "5px",
        },
        hourButton: {
            backgroundColor: "rgba(255, 255, 255, 0)",
            color: "#fff",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            height: "100%",
            display: "flex",
            // alignItems: "center",
            // justifyContent: "center",
            marginTop: "25px",
        },

        // MIDDLE RIGHT BOX
        middleRightBox: {
            backgroundColor: "rgba(255, 255, 255, 0)",
            borderRadius: "10px",
            width: "95%",
            height: "31%",
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            flexWrap: "wrap",
            justifyContent: "space-between",
            marginBottom: "8px",
        },
        metricBoxWrapper: {
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: "19%",
            marginBottom: "10px",
        },
        metricBox: {
            backgroundColor: 'rgba(242, 242, 242, 0.1)',
            paddingTop: "15px",
            borderRadius: "8px",
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
            width: "100%",
            textAlign: "center",
            fontSize: "12px",
            overflow: "hidden",
            position: "relative",
            height: "180px", // Set a fixed height for the metric box to allow room for both progress bar and trend indicator
        },
        metricTitle: {
            fontSize: "14px",
            fontWeight: "bold",
            color: "#fff",
            marginBottom: "8px",
        },
        progressWrapper: {
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
        },
        circularProgressContainer: {
            width: "100px",
            height: "100px",
            fontWeight: "bold",
        },
        noDataLabel: {
            fontSize: "15px",
            fontWeight: "bold",
            color: "#ffce56",
            height: "80px",
            width: "63px",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
        },
        trendIndicator: {
            fontSize: "12px",
            fontWeight: "bold",
            color: "#fff",
            position: "absolute",
            bottom: "10px",
            width: "100%",
            textAlign: "center",
        },
        statusWrapper: {
            backgroundColor: '#75c7b6',
            width: "100%",
            borderRadius: "8px",
            padding: "5px",
            marginTop: "8px",
            textAlign: "center",
        },
        statusLabel: {
            fontSize: "15px",
            fontWeight: "bold",
            color: "#fff",
        },

        // LOWER RIGHT BOX
        lowerRightBox: {
            backgroundColor: 'rgba(242, 242, 242, 0.1)',
            borderRadius: "10px",
            height: "35%", // Adjust height for smaller boxes
            width: "95%",
        },
        // NARRATIVE REPORT
        narrativeReportContainer: {
            borderRadius: "8px",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            padding: "20px",
            overflowY: "auto", // Adds scrolling if content overflows
            height: "100%", // Ensures it fits the allocated height
        },
        narrativeTitle: {
            display: "flex",
            alignItems: "center",
            gap: "15px",
            color: "#fff",
            marginTop: 0,
            marginBottom: "15px",
            fontSize: "16px",
            fontWeight: "bold",
        },
        narrativeContent: {
            whiteSpace: "pre-line",
            margin: 0,
            fontSize: "14px", // Optional: Adjust content font size
            color: "#fff", // Optional: Adjust text color
        },
        tooltipContent: {
            backgroundColor: 'rgba(255, 255, 255, 1)',
            color: 'black',
            padding: '10px 15px',
            borderRadius: '8px',
            fontSize: '14px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
            minWidth: '200px',
            textAlign: 'center',
            '& h4': {
                margin: '0 0 8px 0',
                fontSize: '16px',
                fontWeight: 'bold',
            },
            '& p': {
                margin: '4px 0',
                fontSize: '14px',
            }
        },
        reportStatusWrapper: {
            display: "flex",
            alignItems: "center",
            backgroundColor: 'rgba(242, 242, 242, 0.1)',
            borderRadius: "15px",
            padding: "5px 15px",
            width: "fit-content"
        },
        reportIcon: {
            fontSize: "20px",
            marginRight: "8px"
        },
        reportStatus: {
            fontSize: "16px",
            fontWeight: "bold",
            color: "#fff"
        },


    };

    const handleHourRangeShift = (direction) => {
        setVisibleHourRange(prev => {
            const shift = direction === 'next' ? 6 : -6;
            return prev.map(hour => {
                let newHour = hour + shift;
                // Handle wraparound for 24-hour format
                if (newHour <= 0) newHour = 24 + newHour; // Convert negative hours
                if (newHour > 24) newHour = newHour - 24; // Convert hours > 24
                if (newHour === 24) newHour = 0; // Convert 24 to 0 for midnight
                return newHour;
            }).sort((a, b) => {
                // Special sorting that treats 0 (midnight) as 24 for ordering
                const aSort = a === 0 ? 24 : a;
                const bSort = b === 0 ? 24 : b;
                return aSort - bSort;
            });
        });
    };

    const renderTooltip = () => {
        if (!hoveredData || !hoveredData.value) return null;
        const { hour, value, metric, trend, position } = hoveredData;
        const status = getAirQualityStatus(value, metric.id);

        return (
            <div style={{
                ...styles.tooltipContainer,
                display: hoveredData ? 'block' : 'none',
                position: 'fixed',
                top: position?.y - 10 || 0,
                left: position?.x || 0,
            }}>
                <div style={styles.tooltipContent}>
                    <h4>{metric.name} at {formatHour(hour)}</h4>
                    <p>Value: {value.toFixed(3)}</p>
                    <p>Status: {status?.label}</p>
                    <p>Trend: {trend}</p>
                </div>
            </div>

        );
    };

    const getMaxValue = (metricId) => {
        const thresholdValues = thresholds[metricId];
        return thresholdValues[thresholdValues.length - 2]?.max || 100;
    };


    // Update generateNarrative to focus on water quality metrics
    const generateNarrative = (hour) => {
        const hourData = hourlyData[hour];
        if (!hourData) return { text: "No data available for this hour.", status: null };

        const time = formatHour(hour);
        const tds = hourData.tds_ppm ?? 0;
        const tss = hourData.tss ?? 0;
        const pH = hourData.pH;

        const tdsStatus = getAirQualityStatus(tds, 'tds_ppm');
        const tssStatus = getAirQualityStatus(tss, 'tss');
        const pHStatus = getAirQualityStatus(pH, 'pH');

        let narrative = `Water Quality Report for ${time}:\n\n`;
        narrative += `Current Readings: TDS: ${tds.toFixed(1)} ppm (${tdsStatus?.label || 'unavailable'}), `;
        narrative += `TSS: ${tss.toFixed(1)} mg/L (${tssStatus?.label || 'unavailable'}), `;
        narrative += `pH Level: ${pH ? pH.toFixed(1) : 'N/A'} (${pHStatus?.label || 'unavailable'})\n`;

        // Get overall status based on TDS and TSS
        const status = getAverageWaterQualityStatus({ tds_ppm: tds, tss: tss });

        if (status) {
            narrative += "Overall Water Quality Status: " + status.label;
            const info = thresholdInfo.find(t => t.level.includes(status.label.split(' ')[0]));
            if (info?.recommendations) {
                narrative += "\n\nRecommendations:\n• " + info.recommendations.join('\n• ');
            }
        }

        return { text: narrative, status };
    };

    // Update the calculatePercentageValue function
    const calculatePercentageValue = (value, metricId) => {
        if (value === null || value === undefined) {
            if (metricId === 'tds_ppm' || metricId === 'tss') {
                return 100; // Return 100% for null TDS and TSS values
            }
            return 0;
        }

        const metricThresholds = thresholds[metricId];
        if (!metricThresholds) return 0;

        switch (metricId) {
            case 'pH':
                if (value >= 6.5 && value <= 8.5) return 100;
                if (value < 6.5) return (value / 6.5) * 100;
                return ((14 - value) / (14 - 8.5)) * 100;

            case 'tss':
                // For TSS, scale based on threshold of 50 mg/L
                const tssMaxThreshold = 50;
                if (value <= tssMaxThreshold) {
                    return 100 - ((value / tssMaxThreshold) * 50); // Linear decrease from 100% to 50%
                } else {
                    // For values above threshold, scale from 50% to 0%
                    const excessTSS = value - tssMaxThreshold;
                    const maxExcessTSS = 50; // Additional 50 mg/L brings it to 0%
                    return Math.max(0, 50 - ((excessTSS / maxExcessTSS) * 50));
                }

            case 'temperature':
                const idealMin = 26;
                const idealMax = 30;
                if (value >= idealMin && value <= idealMax) return 100;
                if (value < idealMin) return (value / idealMin) * 100;
                return Math.max(0, (40 - value) / (40 - idealMax) * 100);

            case 'tds_ppm':
                // For TDS, scale based on threshold of 500 ppm
                const tdsMaxThreshold = 500;
                if (value <= tdsMaxThreshold) {
                    return 100 - ((value / tdsMaxThreshold) * 50); // Linear decrease from 100% to 50%
                } else {
                    // For values above threshold, scale from 50% to 0%
                    const excessTDS = value - tdsMaxThreshold;
                    const maxExcessTDS = 500; // Additional 500 ppm brings it to 0%
                    return Math.max(0, 50 - ((excessTDS / maxExcessTDS) * 50));
                }

            default:
                return 0;
        }
    };

    // Update the getBarChartData function
    const getBarChartData = () => {
        const hourData = hourlyData[selectedHourForNarrative];
        const relevantMetrics = metrics.filter(metric =>
            ['pH', 'temperature', 'tss', 'tds_ppm'].includes(metric.id)
        );

        return {
            labels: relevantMetrics.map(metric => metric.name),
            datasets: [{
                label: 'Water Quality Safety Level (%)',
                data: relevantMetrics.map(metric => {
                    const value = hourData?.[metric.id];
                    return calculatePercentageValue(value, metric.id);
                }),
                backgroundColor: relevantMetrics.map(metric => {
                    const value = hourData?.[metric.id];
                    const status = getAirQualityStatus(value, metric.id);
                    return status?.color || 'rgba(75, 192, 192, 0.6)';
                }),
                borderRadius: 25,
            }]
        };
    };

    // Update the barChartOptions
    const barChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                beginAtZero: true,
                max: 100,
                ticks: {
                    color: '#fff',
                    callback: (value) => `${value}%`,
                },
                grid: {
                    display: false,
                },
            },
            x: {
                ticks: {
                    color: '#fff',
                    minRotation: 0,
                    maxRotation: 0,
                    font: {
                        size: 12,
                    },
                    padding: 10,
                },
                grid: {
                    display: false,
                },
            },
        },
        elements: {
            bar: {
                borderRadius: 10,
                borderSkipped: false,
            },
        },
        datasets: {
            bar: {
                barPercentage: 0.8,
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
                        const metricId = ['pH', 'temperature', 'tss', 'tds_ppm'][context.dataIndex];
                        const originalValue = hourlyData[selectedHourForNarrative]?.[metricId];
                        let unit = '';
                        switch (metricId) {
                            case 'temperature': unit = '°C'; break;
                            case 'tss': unit = 'mg/L'; break;
                            case 'tds_ppm': unit = 'ppm'; break;
                            default: unit = '';
                        }
                        return [
                            `Safety Level: ${context.raw.toFixed(1)}%`,
                            `Actual Value: ${originalValue?.toFixed(2)}${unit}`
                        ];
                    },
                },
            },
        },
    };

    // Add this helper function near your other utility functions
    const getAverageWaterQualityStatus = (hourData) => {
        if (!hourData || (!hourData.tds_ppm && !hourData.tss)) return null;

        const tdsStatus = getAirQualityStatus(hourData.tds_ppm ?? 0, 'tds_ppm');
        const tssStatus = getAirQualityStatus(hourData.tss ?? 0, 'tss');

        // Return "High Dissolved Substances" if TDS is high, regardless of TSS
        if (tdsStatus?.label === "High Dissolved Substances") {
            return tdsStatus;
        }

        // Return "Too Cloudy" if TSS is high, regardless of TDS
        if (tssStatus?.label === "Too Cloudy") {
            return tssStatus;
        }

        // Only return "Acceptable" if both are acceptable
        if (tdsStatus?.label === "Acceptable" && tssStatus?.label === "Acceptable") {
            return tdsStatus; // Both are acceptable, can return either one
        }

        // If we get here, something is null or undefined, return whatever status we have
        return tdsStatus || tssStatus;
    };

    return (
        <div style={styles.fullcontainer}>
            {/* Header Section */}
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
                        <select
                            value={selectedLocation}
                            onChange={(e) => setSelectedLocation(Number(e.target.value))}
                            style={styles.locationSelect}
                        >
                            {locations.map((location) => (
                                <option key={location.id} value={location.id}>
                                    {location.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </header>
            </div>

            {/* Main Content Section */}
            <div style={styles.content}>
                {/* Left Container Section */}
                <div style={styles.leftContainer}>
                    <div style={styles.upperLeftBox}>
                        <div style={styles.chartContainer}>
                            <Bar data={getBarChartData()} options={barChartOptions} />
                        </div>
                    </div>
                    <div style={styles.lowerLeftBox}>
                        <div style={styles.slideHeader}>
                            {/* Surfboard-like Wrapper */}
                            <div
                                style={{
                                    ...styles.thresholdWrapper,
                                    backgroundColor: thresholdInfo[currentSlide].color,
                                }}
                            >
                                <div style={styles.wrapperContent}>
                                    <span style={styles.slideIcon}>{thresholdInfo[currentSlide].icon}</span>
                                    <h2 style={styles.slideTitle}>{thresholdInfo[currentSlide].level}</h2>
                                </div>
                            </div>
                            {/* Navigation buttons */}
                            <div style={styles.slideHeaderRight}>
                                <button onClick={prevSlide} style={styles.slideButton}>←</button>
                                <button onClick={nextSlide} style={styles.slideButton}>→</button>
                            </div>
                        </div>
                        <div style={styles.slideshowBody}>
                            <div style={styles.slide}>
                                <div style={styles.slideContent}>
                                    <div style={styles.slideBody}>
                                        <p style={styles.slideDescription}>
                                            {thresholdInfo[currentSlide].description}
                                        </p>
                                        {/* <div style={styles.rangeInfo}></div> */}
                                        {/* <div style={styles.recommendations}>
                                            <h5>Recommendations:</h5>
                                            <ul>
                                                {thresholdInfo[currentSlide].recommendations.map((rec, index) => (
                                                    <li key={index}>{rec}</li>
                                                ))}
                                            </ul>
                                        </div> */}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Container Section */}
                <div style={styles.rightContainer}>
                    <div style={styles.upperRightBox}>
                        {/* Header */}
                        <h2 style={styles.upperRightHeader}>24-Hour Water Quality View</h2>

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
                                            {waterQualityStatus && (
                                                <div
                                                    style={{
                                                        textAlign: 'center',
                                                        fontSize: '15px',
                                                        color: '#fff',
                                                        marginTop: '5px',
                                                        fontWeight: 'bold',
                                                        backgroundColor: waterQualityStatus
                                                            ? waterQualityStatus.color.replace('1)', '1)') // Apply the color only around the label
                                                            : 'transparent', // Ensure background is transparent when no status
                                                        padding: '5px 10px', // Add padding around the label for better visibility
                                                        borderRadius: '20px', // Rounded corners for a bubble effect
                                                        minWidth: '50px', // Ensure the label has a minimum width
                                                        textTransform: 'capitalize', // Optional: Capitalize the status text
                                                    }}
                                                >
                                                    {waterQualityStatus.label}
                                                </div>
                                            )}
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

                    <div style={styles.middleRightBox}>
                        {metrics
                            .filter((metric) =>
                                ['pH', 'temperature', 'tss', 'tds_ppm'].includes(metric.id)
                            )
                            .map((metric) => {
                                const hourData = hourlyData[selectedHourForNarrative];
                                const value = hourData?.[metric.id];
                                const status = getAirQualityStatus(value, metric.id);
                                const maxValue = getMaxValue(metric.id);

                                return (
                                    <div key={metric.id} style={styles.metricBoxWrapper}>
                                        <div style={styles.metricBox}>
                                            <Tooltip title={metric.tooltip || ''} placement="top" arrow>
                                                <h3 style={styles.metricTitle}>{metric.name}</h3>
                                            </Tooltip>
                                            <div style={styles.progressWrapper}>
                                                <div style={styles.circularProgressContainer}>
                                                    {value !== null && value !== undefined ? (
                                                        <CircularProgressbar
                                                            value={calculatePercentageValue(value, metric.id)}
                                                            text={`${value.toFixed(1)}`}
                                                            strokeWidth={20}
                                                            styles={buildStyles({
                                                                rotation: 0,
                                                                strokeLinecap: 'round',
                                                                textSize: '20px',
                                                                pathTransitionDuration: 0.5,
                                                                pathColor: status?.color || '#75c7b6',
                                                                textColor: status?.color || '#75c7b6',
                                                                trailColor: '#fff',
                                                            })}
                                                        />
                                                    ) : (
                                                        <div style={styles.noDataLabel}>No Data</div>
                                                    )}
                                                </div>
                                            </div>
                                            <div style={styles.trendIndicator}>
                                                {value && hourlyData[(selectedHourForNarrative - 1 + 24) % 24]?.[metric.id] ?
                                                    value > hourlyData[(selectedHourForNarrative - 1 + 24) % 24][metric.id] ?
                                                        'Worsening' : value < hourlyData[(selectedHourForNarrative - 1 + 24) % 24][metric.id] ?
                                                            'Improving' : 'Stable'
                                                    : ''}
                                            </div>
                                        </div>

                                        {status && (
                                            <div style={{ ...styles.statusWrapper, backgroundColor: status.color }}>
                                                <div style={styles.statusLabel}>{status.label}</div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                    </div>


                    <div style={styles.lowerRightBox}>
                        {/* Narrative Report */}
                        <div style={styles.narrativeReportContainer}>
                            <div style={styles.narrativeTitle}>
                                <h3 style={{ margin: 0 }}>Water Quality Report</h3>
                                {(() => {
                                    const { text, status } = generateNarrative(selectedHourForNarrative);
                                    const thresholdData = thresholdInfo.find(t => t.level === status?.label);
                                    return status && thresholdData ? (
                                        <div style={{
                                            ...styles.reportStatusWrapper,
                                            backgroundColor: status.color
                                        }}>
                                            <span style={styles.reportIcon}>{thresholdData.icon}</span>
                                            <span style={styles.reportStatus}>{status.label}</span>
                                        </div>
                                    ) : null;
                                })()}
                            </div>
                            <p style={styles.narrativeContent}>
                                {generateNarrative(selectedHourForNarrative).text}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            {hoveredData && renderTooltip()}
            <ToastContainer />
        </div>
    );
};


export default WaterView;