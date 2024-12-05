import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Line } from 'react-chartjs-2';
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
    const [visibleHours, setVisibleHours] = useState([0, 1, 2, 3, 4, 5, 6, 7, 8]); // Show 9 hours
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [slideDirection, setSlideDirection] = useState('left');
    const [currentSlide, setCurrentSlide] = useState(0);
    const [hoveredData, setHoveredData] = useState(null);
    const [showAdditionalMetrics, setShowAdditionalMetrics] = useState(false);

    const locations = [
        { id: 1, name: 'Lapasan' },
        { id: 2, name: 'Agusan' },
        { id: 3, name: 'USTP-CDO' },
        { id: 4, name: 'El Salvador' },
        { id: 5, name: 'Sports Complex' },
    ];

    // Update thresholds 
    const thresholds = {
        pm25: [
            { min: 0, max: 25, label: "Good", color: "rgba(75, 192, 192, 1)" },
            { min: 25, max: 35, label: "Fair", color: "rgba(154, 205, 50, 1)" },
            { min: 35, max: 45, label: "Unhealthy", color: "rgba(255, 206, 86, 1)" },
            { min: 45, max: 55, label: "Very Unhealthy", color: "rgba(255, 140, 0, 1)" },
            { min: 55, max: 90, label: "Severely Unhealthy", color: "rgba(255, 99, 132, 1)" },
            { min: 90, max: Infinity, label: "Emergency", color: "rgba(139, 0, 0, 1)" },
        ],
        pm10: [
            { min: 0, max: 50, label: "Good", color: "rgba(75, 192, 192, 1)" },
            { min: 50, max: 100, label: "Fair", color: "rgba(154, 205, 50, 1)" },
            { min: 100, max: 150, label: "Unhealthy", color: "rgba(255, 206, 86, 1)" },
            { min: 150, max: 200, label: "Very Unhealthy", color: "rgba(255, 140, 0, 1)" },
            { min: 200, max: 300, label: "Severely Unhealthy", color: "rgba(255, 99, 132, 1)" },
            { min: 300, max: Infinity, label: "Emergency", color: "rgba(139, 0, 0, 1)" }
        ],
        humidity: [
            { min: 0, max: 24, label: "Poor", color: "rgba(139, 0, 0, 1)" },
            { min: 24, max: 30, label: "Fair", color: "rgba(255, 206, 86, 1)" },
            { min: 30, max: 60, label: "Good", color: "rgba(75, 192, 192, 1)" },
            { min: 60, max: 70, label: "Fair", color: "rgba(154, 205, 50, 1)" },
            { min: 70, max: Infinity, label: "Poor", color: "rgba(255, 99, 132, 1)" }
        ],
        temperature: [
            { min: 0, max: 33, label: "Good", color: "rgba(75, 192, 192, 1)" },
            { min: 33, max: 41, label: "Caution", color: "rgba(255, 206, 86, 1)" },
            { min: 41, max: 54, label: "Danger", color: "rgba(255, 140, 0, 1)" },
            { min: 54, max: Infinity, label: "Extreme Danger", color: "rgba(139, 0, 0, 1)" }
        ],
        oxygen: [
            { min: 0, max: 19.5, label: "Poor", color: "rgba(255, 206, 86, 1)" },
            { min: 19.5, max: Infinity, label: "Safe", color: "rgba(75, 192, 192, 1)" }
        ]
    };

    const thresholdInfo = [
        {
            level: "Good",
            color: "rgba(75, 192, 192, 1)",
            description: "Air quality is satisfactory, and air pollution poses little or no risk.",
            icon: "😊",
            recommendations: [
                "Ideal for outdoor activities",
                "Safe for all groups",
                "Perfect time for exercise"
            ]
        },
        {
            level: "Fair",
            color: "rgba(154, 205, 50, 1)",
            description: "Air quality is acceptable but may pose a risk to unusually sensitive individuals.",
            icon: "🙂",
            recommendations: [
                "Generally safe for outdoor activities",
                "Sensitive individuals should monitor conditions",
                "Good for moderate exercise"
            ]
        },
        {
            level: "Unhealthy",
            color: "rgba(255, 206, 86, 1)",
            description: "Sensitive groups may face health effects. General public is unlikely to be affected.",
            icon: "😷",
            recommendations: [
                "Reduce prolonged outdoor activities",
                "Sensitive groups should limit exposure",
                "Consider indoor exercises"
            ]
        },
        {
            level: "Very Unhealthy",
            color: "rgba(255, 140, 0, 1)",
            description: "Health alert: The risk of health effects is increased for everyone.",
            icon: "⚠️",
            recommendations: [
                "Avoid outdoor activities",
                "Keep windows closed",
                "Use air purifiers indoors"
            ]
        },
        {
            level: "Severely Unhealthy",
            color: "rgba(255, 99, 132, 1)",
            description: "Health warning of emergency conditions: everyone is more likely to be affected.",
            icon: "🚫",
            recommendations: [
                "Stay indoors",
                "Seal windows and doors",
                "Use air filtration systems"
            ]
        },
        {
            level: "Emergency",
            color: "rgba(139, 0, 0, 1)",
            description: "Health alert: everyone may experience serious health effects.",
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
        { id: 'temperature', name: 'Temperature' },
        { id: 'humidity', name: 'Humidity' },
        { id: 'oxygen', name: 'Oxygen' }
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
        return `${hour === 0 ? '12' : hour > 12 ? hour - 12 : hour}${hour >= 12 ? 'PM' : 'AM'}`;
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
                const nextHours = prev.map(hour => (hour + 3) % 24);
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

    const renderInfoSlideshow = () => (
        <div style={styles.slideshowWrapper}>
            <div style={styles.slideshowContainer}>
                <button onClick={prevSlide} style={styles.slideButton}>←</button>
                <div style={styles.slide}>
                    <div style={{
                        ...styles.slideContent,
                        backgroundColor: thresholdInfo[currentSlide].color
                    }}>
                        <div style={styles.slideHeader}>
                            <span style={styles.slideIcon}>{thresholdInfo[currentSlide].icon}</span>
                            <h2 style={styles.slideTitle}>{thresholdInfo[currentSlide].level}</h2>
                        </div>
                        <div style={styles.slideBody}>
                            <p style={styles.slideDescription}>{thresholdInfo[currentSlide].description}</p>
                            <div style={styles.rangeInfo}>
                            </div>
                            <div style={styles.recommendations}>
                                <h5>Recommendations:</h5>
                                <ul>
                                    {thresholdInfo[currentSlide].recommendations.map((rec, index) => (
                                        <li key={index}>{rec}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
                <button onClick={nextSlide} style={styles.slideButton}>→</button>
            </div>
        </div>
    );

    const calculateTrend = (currentValue, previousValue) => {
        if (!currentValue || !previousValue) return null;
        const difference = currentValue - previousValue;
        const percentageChange = (difference / previousValue) * 100;
        return {
            direction: difference > 0 ? 'increase' : difference < 0 ? 'decrease' : 'steady',
            percentage: Math.abs(percentageChange).toFixed(1)
        };
    };

    const responsiveStyles = {
        // Mobile styles (default)
        container: {
            padding: '10px',
            width: '100%',
            maxWidth: '100vw',
            overflowX: 'hidden',
        },
        header: {
            flexDirection: 'column',
            gap: '15px',
        },
        controls: {
            flexDirection: 'column',
            width: '100%',
        },
        datePicker: {
            width: '100%',
            maxWidth: '300px',
        },
        locationSelect: {
            width: '100%',
            maxWidth: '300px',
        },
        scrollContainer: {
            width: 'calc(100vw - 100px)', // Account for buttons and padding
            maxWidth: '1000px',
        },
        hourCard: {
            minWidth: '80px', // Smaller cards on mobile
            padding: '10px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',

        },
        levelIndicator: {
            height: '80px', // Smaller height on mobile
            fontSize: '14px',
        },
        slideshowContainer: {
            flexDirection: 'column',
            gap: '10px',
        },
        slide: {
            width: '100%',
            maxWidth: '400px',
            height: 'auto',
            minHeight: '330px',
        },
    };

    // Tablet styles
    const tabletStyles = {
        '@media (min-width: 768px)': {
            container: {
                padding: '15px',
            },
            header: {
                flexDirection: 'row',
            },
            controls: {
                flexDirection: 'row',
                width: 'auto',
            },
            scrollContainer: {
                width: 'calc(100vw - 150px)',
            },
            hourCard: {
                minWidth: '100px',
            },
            levelIndicator: {
                height: '90px',
                fontSize: '15px',
            },
            slideshowContainer: {
                flexDirection: 'row',
            },
            slide: {
                width: '600px',
                height: '350px',
            },
        },
    };

    // Desktop styles
    const desktopStyles = {
        '@media (min-width: 1024px)': {
            container: {
                padding: '20px',
            },
            scrollContainer: {
                width: '1000px',
            },
            hourCard: {
                minWidth: '120px',
            },
            levelIndicator: {
                height: '100px',
                fontSize: '16px',
            },
            slide: {
                width: '800px',
                height: '400px',
            },
        },
    };

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
        // ...existing styles,
        ...responsiveStyles,
        ...tabletStyles['@media (min-width: 768px)'],
        ...desktopStyles['@media (min-width: 1024px)'],
        mainContainer: {
            position: 'relative',
            minHeight: '100vh',
            paddingBottom: '400px', // Increased from 300px to accommodate taller slideshow
        },
        contentContainer: {
            padding: '20px',
            backgroundColor: '#f5f5f5',
            borderRadius: '10px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        },
        header: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
        },
        locationSelect: {
            padding: '8px',
            borderRadius: '5px',
            border: '1px solid #ddd',
            fontSize: '16px',
        },
        hourCard: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            minWidth: '120px', // Increased width
            padding: '15px',
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
            margin: '0 5px',
        },
        hourLabel: {
            fontSize: '16px',
            fontWeight: 'bold',
            color: '#666',
            marginBottom: '10px',
        },
        qualityIndicator: {
            width: '80px',
            height: '80px',
            borderRadius: '10px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '12px',
            marginBottom: '8px',
            padding: '5px',
        },
        statusLabel: {
            fontSize: '12px',
            color: '#666',
            textAlign: 'center',
        },
        loading: {
            textAlign: 'center',
            padding: '20px',
            color: '#666',
        },
        controls: {
            display: 'flex',
            gap: '10px',
            alignItems: 'center',
        },
        datePicker: {
            padding: '8px',
            borderRadius: '5px',
            border: '1px solid #ddd',
            fontSize: '16px',
        },
        timelineWrapper: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center', // Center the timeline
            gap: '10px',
            margin: '20px 0',
        },
        scrollButton: {
            padding: '10px 15px',
            fontSize: '20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            transition: 'background-color 0.3s',
            '&:hover': {
                backgroundColor: '#0056b3',
            },
        },
        slideshowWrapper: {
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: 'rgba(245, 245, 245, 0.95)',
            backdropFilter: 'blur(5px)',
            borderTop: '1px solid rgba(0,0,0,0.1)',
            zIndex: 1000,
            height: '250px', // Changed from maxHeight to fixed height, increased from 180px
            overflow: 'hidden', // Changed from 'auto' to 'hidden'
        },
        slideshowContainer: {
            // Update existing slideshowContainer styles
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '20px',
            padding: '10px',
            maxWidth: '1200px',
            margin: '0 auto',
            height: '100%',
        },
        slide: {
            width: '600px',
            height: '220px', // Increased from 160px
            borderRadius: '10px',
            overflow: 'hidden',
        },
        slideContent: {
            height: '100%',
            padding: '10px', // Reduced padding
            color: 'white',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start', // Changed from space-between
        },
        slideHeader: {
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '5px', // Reduced margin
        },
        slideIcon: {
            fontSize: '24px', // Reduced size
        },
        slideTitle: {
            fontSize: '20px', // Reduced size
            margin: 0,
            textShadow: '1px 1px 2px rgba(0,0,0,0.2)',
        },
        slideBody: {
            backgroundColor: 'rgba(255,255,255,0.15)',
            padding: '10px', // Reduced padding
            borderRadius: '8px',
            maxHeight: '160px', // Increased from 100px
            overflowY: 'auto', // Changed from 'hidden' to 'auto'
            '&::-webkit-scrollbar': {
                width: '8px',
            },
            '&::-webkit-scrollbar-track': {
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '4px',
            },
            '&::-webkit-scrollbar-thumb': {
                background: 'rgba(255,255,255,0.3)',
                borderRadius: '4px',
                '&:hover': {
                    background: 'rgba(255,255,255,0.5)',
                },
            },
        },
        slideDescription: {
            fontSize: '16px', // Reduced size
            marginBottom: '5px',
        },
        rangeInfo: {
            display: 'flex',
            justifyContent: 'space-around',
            marginBottom: '5px', // Reduced margin
            fontSize: '12px', // Reduced size
            fontWeight: 'bold',
        },
        recommendations: {
            '& h5': {
                marginBottom: '3px',
                fontSize: '12px',
            },
            '& ul': {
                margin: '0',
                paddingLeft: '15px',
                fontSize: '11px',
                listStyle: 'none',
            },
            '& li': {
                marginBottom: '2px',
                '&:before': {
                    content: '"•"',
                    marginRight: '5px',
                },
            },
        },
        slideButton: {
            padding: '10px 20px',
            fontSize: '24px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            transition: 'background-color 0.3s',
            '&:hover': {
                backgroundColor: '#0056b3',
            },
        },
        metricsWrapper: {
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            marginBottom: '30px',
        },
        metricContainer: {
            backgroundColor: 'white',
            borderRadius: '15px',
            padding: '20px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            marginBottom: '20px',
        },
        metricTitle: {
            fontSize: '28px',
            fontWeight: 'bold',
            marginBottom: '20px',
            textAlign: 'center',
            color: '#333',
        },
        thresholdLegend: {
            display: 'flex',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: '10px',
            marginTop: '20px',
            padding: '10px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
        },
        legendItem: {
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            padding: '5px 10px',
            borderRadius: '5px',
            backgroundColor: 'white',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        },
        legendColor: {
            width: '15px',
            height: '15px',
            borderRadius: '3px',
        },
        timelineContainer: {
            display: 'flex',
            gap: '15px',
            padding: '10px 0',
            justifyContent: 'flex-start',
            minWidth: 'fit-content',
        },
        scrollContainer: {
            width: '1000px', // Increased width
            overflow: 'hidden',
            position: 'relative',
        },
        levelIndicator: {
            width: '100%',
            height: '100px', // Increased height
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '16px',
            padding: '10px',
            textAlign: 'center',
        },
        trendIndicator: {
            fontSize: '24px',
            marginTop: '3px',
            fontWeight: 'bold',
            backgroundColor: '#F5F5DC',
            borderRadius: '4px',
        },
        noDataLabel: {
            height: '100px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#666',
            fontSize: '16px',
            fontStyle: 'italic',
        },
        '.has-tooltip': {
            cursor: 'help',
        },
        metricsToggleContainer: {
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '20px',
        },
        toggleButton: {
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            transition: 'background-color 0.3s',
            '&:hover': {
                backgroundColor: '#0056b3',
            },
        },
        statusIcon: {
            fontSize: '24px',

        },
        ...additionalStyles,
        tooltipContainer: {
            zIndex: 9999,
            pointerEvents: 'none',
            transform: 'translate(-50%, -100%)',
        },
        tooltipContent: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
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
                    <p>Value: {value.toFixed(2)}</p>
                    <p>Status: {status?.label}</p>
                    <p>Trend: {trend}</p>
                </div>
            </div>
        );
    };

    const renderMetricContainer = (metric) => (
        <div style={styles.metricContainer}>
            <Tooltip title={metric.tooltip || ''} placement="top" arrow>
                <h3 style={styles.metricTitle}>
                    {metric.name}
                </h3>
            </Tooltip>
            <div style={styles.timelineWrapper}>
                <button
                    onClick={() => handleManualScroll('right')}
                    style={{
                        ...styles.scrollButton,
                        padding: window.innerWidth < 768 ? '5px 10px' : '10px 15px',
                        fontSize: window.innerWidth < 768 ? '16px' : '20px',
                    }}
                >
                    ←
                </button>
                <div style={styles.scrollContainer} id={`${metric.id}-container`}>
                    <div style={styles.timelineContainer}>
                        {visibleHours.map((hour) => {
                            const hourData = hourlyData[hour];
                            const value = hourData?.[metric.id];
                            const previousHourData = hourlyData[(hour - 1 + 24) % 24];
                            const previousValue = previousHourData?.[metric.id];
                            const status = getAirQualityStatus(value, metric.id)?.label;

                            // Simplified trend calculation
                            let trend = 'Stable';
                            if (value && previousValue) {
                                trend = value > previousValue ? 'Worsening' : value < previousValue ? 'Improving' : 'Stable';
                            }

                            const trendColors = {
                                Improving: '#4CAF50',
                                Worsening: '#F44336',
                                Stable: '#9E9E9E'
                            };

                            return (
                                <div
                                    key={hour}
                                    style={styles.hourCard}
                                    onMouseEnter={(e) => {
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        setHoveredData({
                                            hour,
                                            value,
                                            metric,
                                            trend,
                                            position: {
                                                x: rect.left + rect.width / 2,
                                                y: rect.top
                                            }
                                        });
                                    }}
                                    onMouseLeave={() => setHoveredData(null)}
                                >
                                    <div style={styles.hourLabel}>{formatHour(hour)}</div>
                                    {value ? (
                                        <>
                                            <div style={{
                                                ...styles.levelIndicator,
                                                backgroundColor: getAirQualityStatus(value, metric.id)?.color
                                            }}>
                                                {metric.getIcon && (
                                                    <div style={styles.statusIcon}>
                                                        {metric.getIcon(status)}
                                                    </div>
                                                )}
                                                {status}
                                                <div style={{
                                                    ...styles.trendIndicator,
                                                    color: trendColors[trend],
                                                    fontSize: '14px'
                                                }}>
                                                    {' ' + trend + ' '}
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div style={styles.noDataLabel}>No Data</div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
                <button
                    onClick={() => handleManualScroll('left')}
                    style={styles.scrollButton}
                >
                    →
                </button>
            </div>
        </div>
    );

    return (
        <div style={styles.mainContainer}>
            {hoveredData && renderTooltip()}
            <div style={styles.contentContainer}>
                <div style={styles.header}>
                    <h2>24-Hour Air Quality View</h2>
                    <div style={styles.controls}>
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
                            {locations.map(location => (
                                <option key={location.id} value={location.id}>
                                    {location.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {loading ? (
                    <div style={styles.loading}>Loading...</div>
                ) : (
                    <>
                        <div style={styles.metricsToggleContainer}>
                            <button
                                style={styles.toggleButton}
                                onClick={() => setShowAdditionalMetrics(!showAdditionalMetrics)}
                            >
                                {showAdditionalMetrics ? 'Hide Additional Metrics' : 'Show Additional Metrics'}
                            </button>
                        </div>
                        <div style={styles.metricsWrapper}>
                            {/* Always show PM2.5 and PM10 */}
                            {metrics
                                .filter(metric => ['pm25', 'pm10'].includes(metric.id))
                                .map(metric => renderMetricContainer(metric))}

                            {/* Conditionally show additional metrics */}
                            {showAdditionalMetrics &&
                                metrics
                                    .filter(metric => !['pm25', 'pm10'].includes(metric.id))
                                    .map(metric => renderMetricContainer(metric))
                            }
                        </div>
                    </>
                )}
            </div>
            {renderInfoSlideshow()}
            <ToastContainer />
        </div>
    );
};

export default AirView;
