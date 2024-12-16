import React, { useEffect, useState } from 'react';
import { supabaseAir } from '../iot/AirQuality/supabaseClient';
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

const AirView = () => {
    const getCurrentHourBlock = (hour) => {
        // Calculate which block of 6 hours should be shown based on current hour
        const blockStart = Math.floor(hour / 6) * 6;
        return Array.from({ length: 6 }, (_, i) => (blockStart + i) % 24);
    };

    // Now we can use getCurrentHourBlock in our initial state
    const [hourlyData, setHourlyData] = useState([]);
    const [selectedLocation, setSelectedLocation] = useState(3); // Default to USTP-CDO
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [visibleHours, setVisibleHours] = useState([0]); // Show 9 hours
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [slideDirection, setSlideDirection] = useState('left');
    const [currentSlide, setCurrentSlide] = useState(0);
    const [hoveredData, setHoveredData] = useState(null);
    const [selectedHourForNarrative, setSelectedHourForNarrative] = useState(new Date().getHours());
    const [visibleHourRange, setVisibleHourRange] = useState(() =>
        getCurrentHourBlock(new Date().getHours())
    );

    const locations = [
        { id: 1, name: 'LAPASAN' },
        { id: 2, name: 'AGUSAN' },
        { id: 3, name: 'USTP-CDO' },
        { id: 4, name: 'EL SALVADOR' },
        { id: 5, name: 'SPORTS COMPLEX' },
    ];

    // Update thresholds 
    const thresholds = {
        pm25: [
            { min: 0, max: 25.99, label: "Good", color: "rgba(75, 192, 192)" },
            { min: 26, max: 35.99, label: "Fair", color: "rgba(154, 205, 50)" },
            { min: 36, max: 45.99, label: "Unhealthy", color: "rgba(250, 196, 62)" },
            { min: 46, max: 55.99, label: "Very Unhealthy", color: "rgba(230, 126, 14)" },
            { min: 56, max: 90.99, label: "Acutely Unhealthy", color: "rgba(159, 109, 199)" },
            { min: 91, max: Infinity, label: "Emergency", color: "rgba(199, 46, 46)" },
        ],
        pm10: [
            { min: 0, max: 50.99, label: "Good", color: "rgba(75, 192, 192)" },
            { min: 51, max: 100.99, label: "Fair", color: "rgba(154, 205, 50)" },
            { min: 101, max: 150.99, label: "Unhealthy", color: "rgba(250, 196, 62)" },
            { min: 151, max: 200.99, label: "Very Unhealthy", color: "rgba(230, 126, 14)" },
            { min: 201, max: 300.99, label: "Acutely Unhealthy", color: "rgba(159, 109, 199)" },
            { min: 301, max: Infinity, label: "Emergency", color: "rgba(199, 46, 46)" },
        ],
        humidity: [
            { min: 0, max: 25.99, label: "Poor", color: "rgba(250, 196, 62)" },
            { min: 26, max: 30.99, label: "Fair", color: "rgba(154, 205, 50)" },
            { min: 31, max: 60.99, label: "Good", color: "rgba(75, 192, 192)" },
            { min: 61, max: 70.99, label: "Fair", color: "rgba(154, 205, 50)" },
            { min: 71, max: Infinity, label: "Poor", color: "rgba(230, 126, 14)" },
        ],
        temperature: [
            { min: 0, max: 33.99, label: "Good", color: "rgba(75, 192, 192)" },
            { min: 34, max: 41.99, label: "Caution", color: "rgba(154, 205, 50)" },
            { min: 42, max: 54.99, label: "Danger", color: "rgba(250, 196, 62)" },
            { min: 55, max: Infinity, label: "Extreme", color: "rgba(230, 126, 14)" },
        ],
        oxygen: [
            { min: 0, max: 19.49, label: "Poor", color: "rgba(230, 126, 14)" },
            { min: 19.5, max: Infinity, label: "Safe", color: "rgba(75, 192, 192)" },
        ],
    };

    const thresholdInfo = [
        {
            level: "Good",
            color: "rgb(75, 192, 192)",
            description: "The air is clean, and pollution levels are very low. It is safe for everyone to go outside, and no health risks are expected.",
            icon: "😊",
            recommendations: [
                "Ideal for outdoor activities",
                "Safe for all groups",
                "Perfect time for exercise"
            ]
        },
        {
            level: "Fair",
            color: "rgb(154, 205, 50)",
            description: "The air is okay, but sensitive people might have slight health problems. Most people can still go outside without issues.",
            icon: "🙂",
            recommendations: [
                "Generally safe for outdoor activities",
                "Sensitive individuals should monitor conditions",
                "Good for moderate exercise"
            ]
        },
        {
            level: "Unhealthy",
            color: "rgb(250, 196, 62)",
            description: "People with breathing problems like asthma should spend less time outdoors. They may feel discomfort or breathing difficulty.",
            icon: "😷",
            recommendations: [
                "Reduce prolonged outdoor activities",
                "Sensitive groups should limit exposure",
                "Consider indoor exercises"
            ]
        },
        {
            level: "Very Unhealthy",
            color: "rgb(230, 126, 14)",
            description: "People with breathing or heart issues should stay indoors. Avoid unnecessary trips, as the air can harm health if you stay outside too long.",
            icon: "⚠️",
            recommendations: [
                "Avoid outdoor activities",
                "Keep windows closed",
                "Use air purifiers indoors"
            ]
        },
        {
            level: "Acutely Unhealthy",
            color: "rgb(159, 109, 199)",
            description: "People with health issues should stay indoors. Driving and factory work may be restricted because the air can cause serious harm.",
            icon: "🚫",
            recommendations: [
                "Stay indoors",
                "Seal windows and doors",
                "Use air filtration systems"
            ]
        },
        {
            level: "Emergency",
            color: "rgb(199, 46, 46)",
            description: "Everyone should stay inside with windows closed. The air is too dangerous for outdoor activities, except for emergencies.",
            icon: "☠️",
            recommendations: [
                "Avoid all outdoor activities",
                "Seek medical attention if experiencing symptoms",
                "Follow emergency guidelines"
            ]
        }
    ];


    const metrics = [
        {
            id: 'pm25',
            name: 'PM2.5',
            tooltip: 'Ultra-fine dust particles that can enter your bloodstream. Key indicator of air cleanliness and health risk.',
            getIcon: (status) => {
                switch (status) {
                    case 'Good': return '😊';
                    case 'Fair': return '🙂';
                    case 'Unhealthy': return '😷';
                    case 'Very Unhealthy': return '⚠️';
                    case 'Severely Unhealthy': return '🚫';
                    case 'Emergency': return '☠️';
                    default: return '❓';
                }
            }
        },
        {
            id: 'pm10',
            name: 'PM10',
            tooltip: 'Larger dust particles including pollen and mold. Can trigger allergies and breathing problems.',
            getIcon: (status) => {
                switch (status) {
                    case 'Good': return '😊';
                    case 'Fair': return '🙂';
                    case 'Unhealthy': return '😷';
                    case 'Very Unhealthy': return '⚠️';
                    case 'Severely Unhealthy': return '🚫';
                    case 'Emergency': return '☠️';
                    default: return '❓';
                }
            }
        },
        { id: 'temperature', name: 'TEMPERATURE' },
        { id: 'humidity', name: 'HUMIDITY' },
        { id: 'oxygen', name: 'OXYGEN' }
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

    useEffect(() => {
        // When component mounts, show current hour block
        const currentHour = new Date().getHours();
        setVisibleHourRange(getCurrentHourBlock(currentHour));
        setSelectedHourForNarrative(currentHour);
    }, []); // Empty dependency array means this runs once on mount

    const fetchDayData = async () => {
        try {
            setLoading(true);
            const selectedDay = new Date(selectedDate);
            selectedDay.setHours(0, 0, 0, 0);
            const nextDay = new Date(selectedDay);
            nextDay.setDate(nextDay.getDate() + 1);

            const { data, error } = await supabaseAir
                .from('sensors')
                .select('*')
                .eq('locationId', selectedLocation)
                .gte('date', selectedDay.toISOString())
                .lt('date', nextDay.toISOString())
                .order('date', { ascending: true });

            if (error) {
                throw error;
            }

            if (!data || data.length === 0) {
                toast.info('No data available for the selected date and location');
                setHourlyData([]);
                setLoading(false);
                return;
            }

            // Process hourly averages for each metric
            const hourlyProcessed = Array(24).fill(null).map((_, hour) => {
                const hourData = data.filter(record => {
                    const recordHour = new Date(record.date).getHours();
                    return recordHour === hour;
                });

                if (hourData.length === 0) {
                    return {
                        hour,
                        pm25: null,
                        pm10: null,
                        humidity: null,
                        temperature: null,
                        oxygen: null,
                        status: null,
                        color: null
                    };
                }

                const metrics = {};
                ['pm25', 'pm10', 'humidity', 'temperature', 'oxygen'].forEach(metric => {
                    const values = hourData.map(item => item[metric]);
                    const validValues = values.filter(v => v !== null);
                    metrics[metric] = validValues.length > 0
                        ? validValues.reduce((sum, val) => sum + val, 0) / validValues.length
                        : null;
                });

                const status = getAirQualityStatus(metrics.pm25, 'pm25');

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
            padding: "20px 10px 5px 10px",  // Adjusted padding for better alignment
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
            justifyContent: "center", // Updated to center the metrics
            gap: "10px", // Add gap between metric boxes
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
            height: "100%",
            padding: "20px",
            color: "#fff",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: "15px",
        },
        narrativeTitle: {
            display: "flex",
            alignItems: "center",
            gap: "15px",
            color: "#fff",
            marginTop: 0,
            marginBottom: "15px",
        },
        narrativeHeader: {
            fontSize: "25px",
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
        narrativeGrid: {
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "20px",
            padding: "15px",
            backgroundColor: "rgba(36, 77, 112, 0.46)",
            boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
            borderRadius: "10px",
            margin: "10px 0",
        },
        narrativeLeft: {
            borderRight: "1px solid rgba(255, 255, 255, 0.2)",
            paddingRight: "15px",
        },
        narrativeRight: {
            paddingLeft: "15px",
        },
        timeHeader: {
            fontSize: "18px",
            fontWeight: "bold",
            marginBottom: "10px",
            color: "#fff",
        },
        readingsContainer: {
            display: "flex",
            flexDirection: "column",

        },
        readingItem: {
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "16px",
            color: "#fff",
        },
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


    const generateNarrative = (hour) => {
        const hourData = hourlyData[hour];
        if (!hourData) return { text: "No data available for this hour.", status: null };

        const status = getAirQualityStatus(hourData.pm25, 'pm25');
        const time = formatHour(hour);

        let narrative = `At ${time}, the air quality is ${status?.label || 'unavailable'}. `;

        if (hourData.pm25) {
            narrative += `PM2.5 levels are at ${hourData.pm25.toFixed(1)} µg/m³, which is ${status?.label || 'unavailable'}. `;
        }

        if (hourData.temperature) {
            const tempStatus = getAirQualityStatus(hourData.temperature, 'temperature');
            narrative += `The temperature is ${hourData.temperature.toFixed(1)}°C (${tempStatus?.label || 'normal'}). `;
        }

        if (hourData.humidity) {
            const humidStatus = getAirQualityStatus(hourData.humidity, 'humidity');
            narrative += `Humidity levels are at ${hourData.humidity.toFixed(1)}% (${humidStatus?.label || 'normal'}). `;
        }

        if (status) {
            const recommendations = thresholdInfo.find(t => t.level === status.label)?.recommendations || [];
            if (recommendations.length > 0) {
                narrative += "\n\nRecommendations:\n• " + recommendations.join('\n• ');
            }
        }

        return { text: narrative, status };
    };

    // Update the calculatePercentageValue function
    const calculatePercentageValue = (value, metricId) => {
        if (!value) return 0;

        const metricThresholds = thresholds[metricId];
        if (!metricThresholds) return 0;

        // Special handling for PM2.5 and PM10
        if (['pm25', 'pm10'].includes(metricId)) {
            const emergencyThreshold = metricThresholds[metricThresholds.length - 1].min;
            const goodThreshold = metricThresholds[0].max;

            // If value is at emergency level or higher, return 0%
            if (value >= emergencyThreshold) return 0;

            // Calculate percentage based on position between good and emergency levels
            return Math.max(0, Math.min(100, ((emergencyThreshold - value) / (emergencyThreshold - goodThreshold)) * 100));
        }

        // For temperature
        if (metricId === 'temperature') {
            const maxGoodValue = metricThresholds[0].max;
            const criticalValue = metricThresholds[metricThresholds.length - 1].min;

            if (value >= criticalValue) return 0;

            return Math.max(0, Math.min(100, (criticalValue - value) / (criticalValue - maxGoodValue) * 100));
        }

        // For other metrics (humidity, oxygen)
        const optimalMax = metricThresholds.find(t => t.label === 'Good')?.max || 100;
        const criticalValue = metricThresholds[metricThresholds.length - 1].min;

        if (value >= criticalValue) return 0;

        return Math.max(0, Math.min(100, (criticalValue - value) / (criticalValue - optimalMax) * 100));
    };

    // Update the getBarChartData function
    const getBarChartData = () => {
        const hourData = hourlyData[selectedHourForNarrative];
        const relevantMetrics = metrics.filter(metric =>
            ['pm25', 'pm10', 'temperature', 'humidity', 'oxygen'].includes(metric.id)
        );

        return {
            labels: relevantMetrics.map(metric => metric.name),
            datasets: [{
                label: 'Air Quality Safety Level (%)',
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
                        const metricId = ['pm25', 'pm10', 'temperature', 'humidity', 'oxygen'][context.dataIndex];
                        const originalValue = hourlyData[selectedHourForNarrative]?.[metricId];
                        return [
                            `Safety Level: ${context.raw.toFixed(1)}%`,
                            `Actual Value: ${originalValue?.toFixed(2)}`
                        ];
                    },
                },
            },
        },
    };

    // Add this helper function near your other utility functions
    const getAverageAirQualityStatus = (hourData) => {
        if (!hourData || (!hourData.pm25 && !hourData.pm10)) return null;

        const pm25Status = getAirQualityStatus(hourData.pm25, 'pm25');
        const pm10Status = getAirQualityStatus(hourData.pm10, 'pm10');

        // Get the more severe status
        if (!pm25Status) return pm10Status;
        if (!pm10Status) return pm25Status;

        // Compare threshold indices to determine which is more severe
        const pm25Index = thresholds.pm25.findIndex(t => t.label === pm25Status.label);
        const pm10Index = thresholds.pm10.findIndex(t => t.label === pm10Status.label);

        return pm25Index >= pm10Index ? pm25Status : pm10Status;
    };



    return (
        <div style={styles.fullcontainer}>
            {/* Header Section */}
            <div style={styles.headerContainer}>
                <header style={styles.header}>
                    <div>
                        <h1 style={styles.title}>Air Quality Dashboard</h1>
                        <p style={styles.subtitle}>Monitor real-time air quality metrics</p>
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
                        <h2 style={styles.upperRightHeader}>24-Hour View for Air Quality</h2>

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
                                    const airQualityStatus = getAverageAirQualityStatus(hourData);

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
                                            {airQualityStatus && (
                                                <div
                                                    style={{
                                                        textAlign: 'center',
                                                        fontSize: '15px',
                                                        color: '#fff',
                                                        marginTop: '5px',
                                                        fontWeight: 'bold',
                                                        backgroundColor: airQualityStatus
                                                            ? airQualityStatus.color.replace('1)', '1)') // Apply the color only around the label
                                                            : 'transparent', // Ensure background is transparent when no status
                                                        padding: '5px 10px', // Add padding around the label for better visibility
                                                        borderRadius: '20px', // Rounded corners for a bubble effect
                                                        minWidth: '50px', // Ensure the label has a minimum width
                                                        textTransform: 'capitalize', // Optional: Capitalize the status text
                                                    }}
                                                >
                                                    {airQualityStatus.label}
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
                                ['pm25', 'pm10', 'temperature', 'humidity', 'oxygen'].includes(metric.id)
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
                                                            value={(value / maxValue) * 100}
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
                        <div style={styles.narrativeReportContainer}>
                            <div style={styles.narrativeGrid}>
                                <div style={styles.narrativeLeft}>
                                    <div style={styles.timeHeader}>
                                        Air Quality Report for {formatHour(selectedHourForNarrative)}
                                    </div>
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
                                    <div style={styles.reportHeaderContainer}>
                                    </div>
                                </div>
                                <div style={styles.narrativeRight}>
                                    <div style={styles.readingsContainer}>
                                        <div style={styles.timeHeader}>Current Readings</div>
                                        {(() => {
                                            const hourData = hourlyData[selectedHourForNarrative];
                                            if (!hourData) return <div>No data available</div>;

                                            const readings = [
                                                {
                                                    label: 'PM2.5',
                                                    value: hourData.pm25,
                                                    unit: 'µg/m³',
                                                    status: getAirQualityStatus(hourData.pm25, 'pm25'),
                                                },
                                                {
                                                    label: 'PM10',
                                                    value: hourData.pm10,
                                                    unit: 'µg/m³',
                                                    status: getAirQualityStatus(hourData.pm10, 'pm10'),
                                                },
                                                {
                                                    label: 'Temperature',
                                                    value: hourData.temperature,
                                                    unit: '°C',
                                                    status: getAirQualityStatus(hourData.temperature, 'temperature'),
                                                },
                                                {
                                                    label: 'Humidity',
                                                    value: hourData.humidity,
                                                    unit: '%',
                                                    status: getAirQualityStatus(hourData.humidity, 'humidity'),
                                                },
                                            ];

                                            return (
                                                <>
                                                    {readings.map((reading, index) => (
                                                        <div key={index} style={{
                                                            ...styles.readingItem,
                                                            color: reading.status?.color || '#fff'
                                                        }}>
                                                            • {reading.label}: {
                                                                reading.value !== null && reading.value !== undefined
                                                                    ? `${reading.value.toFixed(1)}${reading.unit} (${reading.status?.label || 'unavailable'})`
                                                                    : 'No data'
                                                            }
                                                        </div>
                                                    ))}
                                                </>
                                            );
                                        })()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {hoveredData && renderTooltip()}
            <ToastContainer />
        </div>
    );
};


export default AirView;