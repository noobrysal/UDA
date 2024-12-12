import React, { useEffect, useState } from 'react';
import { supabase } from '../components/iot/AirQuality/supabaseClient';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Line, Bar } from 'react-chartjs-2'; // Add Bar import
import backgroundImage from '../assets/airdash.png';
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
import { Box, Button, useTheme } from "@mui/material";
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
    const [hourlyData, setHourlyData] = useState([]);
    const [selectedLocation, setSelectedLocation] = useState(3); // Default to USTP-CDO
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [scrollPosition, setScrollPosition] = useState(0);
    const [visibleHours, setVisibleHours] = useState([0]); // Show 9 hours
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [slideDirection, setSlideDirection] = useState('left');
    const [currentSlide, setCurrentSlide] = useState(0);
    const [hoveredData, setHoveredData] = useState(null);
    const [showAdditionalMetrics, setShowAdditionalMetrics] = useState(false);
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
        pm25: [
            { min: 0, max: 25.99, label: "Good", color: "rgba(94, 196, 165)" },
            { min: 26, max: 35.99, label: "Fair", color: "rgba(217, 184, 65)" },
            { min: 36, max: 45.99, label: "Unhealthy", color: "rgba(235, 123, 59)" },
            { min: 46, max: 55.99, label: "Very Unhealthy", color: "rgba(214, 54, 49)" },
            { min: 56, max: 90.99, label: "Acutely Unhealthy", color: "rgba(71, 29, 84)" },
            { min: 91, max: Infinity, label: "Emergency", color: "rgba(110, 22, 24)" },
        ],
        pm10: [
            { min: 0, max: 50.99, label: "Good", color: "rgba(94, 196, 165)" },
            { min: 51, max: 100.99, label: "Fair", color: "rgba(217, 184, 65)" },
            { min: 101, max: 150.99, label: "Unhealthy", color: "rgba(235, 123, 59)" },
            { min: 151, max: 200.99, label: "Very Unhealthy", color: "rgba(214, 54, 49)" },
            { min: 201, max: 300.99, label: "Acutely Unhealthy", color: "rgba(71, 29, 84)" },
            { min: 301, max: Infinity, label: "Emergency", color: "rgba(110, 22, 24)" },
        ],
        humidity: [
            { min: 0, max: 25.99, label: "Poor", color: "rgba(235, 123, 59)" },
            { min: 26, max: 30.99, label: "Fair", color: "rgba(217, 184, 65)" },
            { min: 31, max: 60.99, label: "Good", color: "rgba(94, 196, 165)" },
            { min: 61, max: 70.99, label: "Fair", color: "rgba(217, 184, 65)" },
            { min: 71, max: Infinity, label: "Poor", color: "rgba(214, 54, 49)" },
        ],
        temperature: [
            { min: 0, max: 33.99, label: "Good", color: "rgba(94, 196, 165)" },
            { min: 34, max: 41.99, label: "Caution", color: "rgba(217, 184, 65)" },
            { min: 42, max: 54.99, label: "Danger", color: "rgba(235, 123, 59)" },
            { min: 55, max: Infinity, label: "Extreme", color: "rgba(214, 54, 49)" },
        ],
        oxygen: [
            { min: 0, max: 19.49, label: "Poor", color: "rgba(214, 54, 49)" },
            { min: 19.5, max: Infinity, label: "Safe", color: "rgba(94, 196, 165)" },
        ],
    };

    const thresholdInfo = [
        {
            level: "Good",
            color: "rgb(94, 196, 165)",
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
            color: "rgb(217, 184, 65)",
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
            color: "rgb(235, 123, 59)",
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
            color: "rgb(214, 54, 49)",
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
            color: "rgb(71, 29, 84)",
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
            color: "rgb(110, 22, 24)",
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

    const getFilteredDataForAverage = (data, metric) => {
        // Create an accumulator to group data by hour in the local time zone
        const hourlyData = data.reduce((acc, item) => {
            const hour = new Date(item.date).getHours(); // Group by local hour
            if (!acc[hour]) acc[hour] = { sum: 0, count: 0 };
            acc[hour].sum += item[metric];
            acc[hour].count++;
            return acc;
        }, {});

        // Calculate averages for each hour and return an array
        return Object.keys(hourlyData).map((hour) => {
            const { sum, count } = hourlyData[hour];
            return { hour: parseInt(hour), average: sum / count };
        });
    };

    const fetchDayData = async () => {
        try {
            setLoading(true);
            const selectedDay = new Date(selectedDate);
            selectedDay.setHours(0, 0, 0, 0);
            const nextDay = new Date(selectedDay);
            nextDay.setDate(nextDay.getDate() + 1);

            const { data, error } = await supabase
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
    //     '@media (min-width: 1024px)': {
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

    const additionalStyles = {
        // ...existing styles...
        tooltip: {
            position: 'absolute',
            backgroundColor: 'rgba(33, 33, 33, 0.95)',
            color: '#ffffff',
            padding: '12px 16px',
            borderRadius: '8px',
            zIndex: 1000,
            maxWidth: '250px',
            pointerEvents: 'none',
            transform: 'translate(-50%, -120%)',
            left: '50%',
            fontSize: '14px',
            lineHeight: '1.4',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(8px)',
            fontWeight: '500',
            textAlign: 'center',
            '&:after': {
                content: '""',
                position: 'absolute',
                bottom: '-6px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '0',
                height: '0',
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
                borderTop: '6px solid rgba(33, 33, 33, 0.95)'
            }
        },
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
            color: "#fff",
            marginTop: 0,
            marginBottom: "15px",
            fontSize: "16px", // Optional: Adjust title font size
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

    
    const generateNarrative = (hour) => {
        const hourData = hourlyData[hour];
        if (!hourData) return "No data available for this hour.";

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

        // Add recommendations based on overall status
        if (status) {
            const recommendations = thresholdInfo.find(t => t.level === status.label)?.recommendations || [];
            if (recommendations.length > 0) {
                narrative += "\n\nRecommendations:\n• " + recommendations.join('\n• ');
            }
        }

        return narrative;
    };

    const calculateMaxValues = () => {
        const hourData = hourlyData[selectedHourForNarrative];
        return metrics.reduce((acc, metric) => {
            if (['pm25', 'pm10', 'temperature', 'humidity', 'oxygen'].includes(metric.id)) {
                const value = hourData?.[metric.id] || 0;
                return Math.max(acc, value);
            }
            return acc;
        }, 0);
    };
    

    // Add this helper function for bar chart data
    const getBarChartData = () => {
        const hourData = hourlyData[selectedHourForNarrative];
        return {
            labels: metrics
                .filter(metric => ['pm25', 'pm10', 'temperature', 'humidity', 'oxygen'].includes(metric.id))
                .map(metric => metric.name),
            datasets: [{
                label: 'Air Quality Metrics',
                data: metrics
                    .filter(metric => ['pm25', 'pm10', 'temperature', 'humidity', 'oxygen'].includes(metric.id))
                    .map(metric => hourData?.[metric.id] || 0),
                backgroundColor: metrics
                    .filter(metric => ['pm25', 'pm10', 'temperature', 'humidity', 'oxygen'].includes(metric.id))
                    .map(metric => {
                        const value = hourData?.[metric.id];
                        const status = getAirQualityStatus(value, metric.id);
                        return status?.color || 'rgba(75, 192, 192, 0.6)';
                    }),
                // borderColor: "rgb(0, 255, 251)",
                // borderWidth: 2,
                borderRadius: 25, // Rounded corners
            }]
        };
    };
    
    const maxValues = calculateMaxValues(); // Calculate the maximum value for the chart
    
    const barChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                beginAtZero: true,
                suggestedMax: maxValues, // Use the dynamically calculated maximum value
                ticks: {
                    color: '#fff',
                    callback: (value) => value.toFixed(1), // Display raw values
                },
                grid: {
                    display: false, // Hide y-axis grid lines
                },
            },
            x: {
                ticks: {
                    color: '#fff',
                    minRotation: 0,
                    maxRotation: 0,
                    font: {
                        size: 12, // Adjust font size to prevent overlap
                    },
                    padding: 10, // Adjust padding between the x-axis labels
                },
                grid: {
                    display: false, // Hide x-axis grid lines
                },
            },
        },
        elements: {
            bar: {
                borderRadius: 10, // Rounded corners for bars
                borderSkipped: false, // Ensure all edges of the bar have a border radius
            },
        },
        datasets: {
            bar: {
                barPercentage: 0.9, // Adjust the width of the bars
                categoryPercentage: 1, // Adjust the space between bars
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
                    label: (context) => context.raw.toFixed(2), // Show raw values in the tooltip
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
                        {/* Narrative Report */}
                        <div style={styles.narrativeReportContainer}>
                            <h3 style={styles.narrativeTitle}>Air Quality Report</h3>
                            <p style={styles.narrativeContent}>
                                {generateNarrative(selectedHourForNarrative)}
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


export default AirView;