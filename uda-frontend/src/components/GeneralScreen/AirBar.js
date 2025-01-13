import React, { useEffect, useState } from 'react';
import { supabaseAir } from '../iot/AirQuality/supabaseClient';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Bar } from 'react-chartjs-2';
import backgroundImage from '../../assets/airdash2.png';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
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
import { Tooltip as MuiTooltip } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';

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

const AirBar = () => {
    const getCurrentHourBlock = (hour) => {
        const blockStart = Math.floor(hour / 6) * 6;
        return Array.from({ length: 6 }, (_, i) => (blockStart + i) % 24);
    };

    const [hourlyData, setHourlyData] = useState([]);
    const [selectedLocation, setSelectedLocation] = useState(3);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(() => {
        const today = new Date();
        today.setDate(today.getDate() + 1); // Add 1 day
        return today.toISOString().split('T')[0]; // Format to YYYY-MM-DD
    });
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
        pm25: false,
        pm10: false,
        humidity: false,
        temperature: false,
        oxygen: false
    });

    const handleTooltipToggle = () => {
        setShowTooltip(!showTooltip);
    };

    const locations = [
        { id: 1, name: 'LAPASAN' },
        { id: 2, name: 'AGUSAN' },
        { id: 3, name: 'USTP-CDO' },
        { id: 4, name: 'EL SALVADOR' },
        { id: 5, name: 'SPORTS COMPLEX' },
    ];

    const thresholds = {
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

    const thresholdInfoAir = [
        // PM2.5 Levels
        {
            level: "Good",
            metric: "pm25",
            color: "rgb(154, 205, 50)",
            description: "PM2.5 levels are low, indicating excellent air quality with minimal health risks.",
            icon: "😊",
            recommendations: [
                "• Engage in outdoor activities freely",
                "• No precautions necessary",
                "• Ideal conditions for exercise"
            ]
        },
        {
            level: "Fair",
            metric: "pm25",
            color: "rgb(250, 196, 62)",
            description: "PM2.5 levels are moderate, which may be a concern for sensitive individuals.",
            icon: "😐",
            recommendations: [
                "• Sensitive groups should limit prolonged outdoor exposure",
                "• Check air quality before engaging in activities",
                "• Use a mask if outdoors for long periods"
            ]
        },
        {
            level: "Unhealthy",
            metric: "pm25",
            color: "rgb(230, 126, 14)",
            description: "PM2.5 levels are high, posing potential health risks for everyone, especially sensitive groups.",
            icon: "😷",
            recommendations: [
                "• Limit outdoor activities",
                "• Wear a mask if necessary",
                "• Avoid exercise outdoors"
            ]
        },
        {
            level: "Very Unhealthy",
            metric: "pm25",
            color: "rgb(232, 44, 48)",
            description: "PM2.5 levels are very high, causing significant health concerns for everyone.",
            icon: "🤢",
            recommendations: [
                "• Stay indoors with air purification",
                "• Avoid outdoor exposure entirely",
                "• Seek medical advice for any symptoms"
            ]
        },
        {
            level: "Acutely Unhealthy",
            metric: "pm25",
            color: "rgb(159, 109, 199)",
            description: "PM2.5 levels are critical, posing severe health risks to all groups.",
            icon: "😫",
            recommendations: [
                "• Remain indoors and seal windows",
                "• Use air purifiers",
                "• Follow emergency air quality advisories"
            ]
        },
        {
            level: "Emergency",
            metric: "pm25",
            color: "rgb(140, 1, 4)",
            description: "PM2.5 levels are dangerously high, causing immediate health risks for everyone.",
            icon: "🚨",
            recommendations: [
                "• Avoid all outdoor activities",
                "• Stay in a sealed and purified environment",
                "• Follow emergency alerts strictly"
            ]
        },
    
        // PM10 Levels
        {
            level: "Good",
            metric: "pm10",
            color: "rgb(154, 205, 50)",
            description: "PM10 levels are low, indicating safe and clean air quality.",
            icon: "🌿",
            recommendations: [
                "• Perfect for outdoor activities",
                "• No need for precautions",
                "• Great conditions for breathing"
            ]
        },
        {
            level: "Fair",
            metric: "pm10",
            color: "rgb(250, 196, 62)",
            description: "PM10 levels are moderate; sensitive groups might experience mild discomfort.",
            icon: "😐",
            recommendations: [
                "• Avoid prolonged outdoor exposure if sensitive",
                "• Consider light activities outdoors",
                "• Monitor air quality alerts"
            ]
        },
        {
            level: "Unhealthy",
            metric: "pm10",
            color: "rgb(230, 126, 14)",
            description: "PM10 levels are high, potentially causing respiratory issues for everyone.",
            icon: "😷",
            recommendations: [
                "• Limit outdoor exposure",
                "• Use a mask if outdoors for extended periods",
                "• Monitor respiratory symptoms"
            ]
        },
        {
            level: "Very Unhealthy",
            metric: "pm10",
            color: "rgb(232, 44, 48)",
            description: "PM10 levels are very high, causing serious respiratory risks for everyone.",
            icon: "🤢",
            recommendations: [
                "• Stay indoors with filtered air",
                "• Avoid physical activities outdoors",
                "• Seek medical help for respiratory distress"
            ]
        },
        {
            level: "Acutely Unhealthy",
            metric: "pm10",
            color: "rgb(159, 109, 199)",
            description: "PM10 levels are critical, with severe health risks for all groups.",
            icon: "😫",
            recommendations: [
                "• Avoid outdoor exposure completely",
                "• Use air filtration systems indoors",
                "• Follow emergency health advisories"
            ]
        },
        {
            level: "Emergency",
            metric: "pm10",
            color: "rgb(140, 1, 4)",
            description: "PM10 levels are hazardous, posing immediate health risks for everyone.",
            icon: "🚨",
            recommendations: [
                "• Stay indoors and avoid all exposure",
                "• Use sealed, purified spaces",
                "• Follow government health alerts"
            ]
        },
    
        // Humidity Levels
        {
            level: "Poor",
            metric: "humidity",
            color: "rgb(230, 126, 14)",
            description: "Humidity levels are unbalanced, causing discomfort and potential health issues.",
            icon: "🌫️",
            recommendations: [
                "• Use a humidifier or dehumidifier as needed",
                "• Stay hydrated to avoid discomfort",
                "• Limit exposure to extreme conditions"
            ]
        },
        {
            level: "Fair",
            metric: "humidity",
            color: "rgb(250, 196, 62)",
            description: "Humidity levels are acceptable but may cause mild discomfort.",
            icon: "😐",
            recommendations: [
                "• Adjust indoor humidity for comfort",
                "• Stay hydrated",
                "• Monitor air quality for allergens"
            ]
        },
        {
            level: "Good",
            metric: "humidity",
            color: "rgb(154, 205, 50)",
            description: "Humidity levels are optimal, promoting comfort and respiratory health.",
            icon: "💧",
            recommendations: [
                "• Enjoy normal activities indoors and outdoors",
                "• No special precautions required",
                "• Maintain hydration"
            ]
        },
    
        // Temperature Levels
        {
            level: "Good",
            metric: "temperature",
            color: "rgb(154, 205, 50)",
            description: "Temperature is comfortable and ideal for outdoor activities.",
            icon: "☀️",
            recommendations: [
                "• Engage in all activities freely",
                "• Enjoy the pleasant weather",
                "• No precautions necessary"
            ]
        },
        {
            level: "Caution",
            metric: "temperature",
            color: "rgb(250, 196, 62)",
            description: "Temperature is slightly elevated, which may cause mild discomfort.",
            icon: "🌡️",
            recommendations: [
                "• Stay hydrated and cool",
                "• Avoid strenuous activities during peak hours",
                "• Wear light, breathable clothing"
            ]
        },
        {
            level: "Danger",
            metric: "temperature",
            color: "rgb(230, 126, 14)",
            description: "High temperatures may lead to heat-related illnesses without precautions.",
            icon: "🔥",
            recommendations: [
                "• Limit outdoor activities",
                "• Take frequent breaks in shaded or cool areas",
                "• Watch for signs of heat exhaustion"
            ]
        },
        {
            level: "Extreme",
            metric: "temperature",
            color: "rgb(232, 44, 48)",
            description: "Extreme temperatures pose severe health risks for everyone.",
            icon: "🚑",
            recommendations: [
                "• Stay indoors in air-conditioned spaces",
                "• Avoid outdoor exposure entirely",
                "• Seek medical attention for heat-related symptoms"
            ]
        },
    
        // Oxygen Levels
        {
            level: "Safe",
            metric: "oxygen",
            color: "rgb(154, 205, 50)",
            description: "Oxygen levels are within safe limits, supporting healthy breathing.",
            icon: "💨",
            recommendations: [
                "• Engage in all activities without concern",
                "• No need for precautions",
                "• Ideal conditions for physical activities"
            ]
        },
        {
            level: "Poor",
            metric: "oxygen",
            color: "rgb(232, 44, 48)",
            description: "Oxygen levels are low, potentially causing respiratory issues.",
            icon: "⚠️",
            recommendations: [
                "• Avoid strenuous activities",
                "• Use supplemental oxygen if necessary",
                "• Seek medical help for difficulty breathing"
            ]
        }
    ];
    
    useEffect(() => {
        const interval = setInterval(() => {
            setShowThresholdInfo(prevState => ({
                pm25: !prevState.pm25,
                pm10: !prevState.pm10,
                humidity: !prevState.humidity,
                temperature: !prevState.temperature,
                oxygen: !prevState.oxygen
            }));
        }, 10000); // Toggle every 10 seconds

        return () => clearInterval(interval);
    }, []);

    const fetchDayData = async () => {
        try {
            setLoading(true);
            const selectedDay = selectedDate ? new Date(selectedDate) : new Date();
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
    }, [selectedLocation, selectedDate]);

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

    const getBarChartData = (metricId) => {
        const hourData = hourlyData[selectedHourForNarrative];
        const value = hourData?.[metricId];
        const status = getAirQualityStatus(value, metricId);

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
                display: false,
                labels: {
                    color: '#fff',
                },
            },
            tooltip: {
                callbacks: {
                    label: (context) => {
                        const metricId = context.label.toLowerCase();
                        const originalValue = hourlyData[selectedHourForNarrative]?.[metricId];
                        const status = getAirQualityStatus(originalValue, metricId);
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

    const renderThresholdInfo = (metricId) => {
        const status = getAirQualityStatus(hourlyData[selectedHourForNarrative]?.[metricId], metricId);
        const thresholdData = thresholdInfoAir.find(t => t.level === status?.label && t.metric === metricId);
    
        return (
            <div style={styles.thresholdInfoContainer}>
                <ul style={styles.recommendationsList}> Recommendations:
                    {thresholdData?.recommendations.map((rec, index) => (
                        <li key={index} style={styles.recommendationItem}>{rec}</li>
                    ))}
                </ul>
            </div>
        );
    };

    const formatDateTime = (date) => {
        return new Intl.DateTimeFormat('en-PH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            hour12: true,
            timeZone: 'Asia/Manila'
        }).format(date);
    };

    return (
        <div style={styles.fullcontainer}>
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

            <div style={styles.hourcard}>
            {/* 24-HOUR */}
            <div style={styles.row}>
                    <div style={styles.box0}>
                        <div style={styles.iotHeaderBox}>
                            <h2 style={styles.airHeaderTitle}>24 Hour Air Quality View</h2>
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
                                                            fontSize: '10px',
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
                    </div>
                </div>
            </div>
            <div style={styles.gridContainer}>
                {/* Air Quality Column */}
                <div style={styles.column}>
                    <div style={styles.box1}>
                        <div style={styles.iotHeaderBox}>
                            <div style={styles.statusHeader}>
                                {hourlyData[selectedHourForNarrative] && (
                                    <div
                                        style={{
                                            ...styles.statusBox,
                                            backgroundColor: getAirQualityStatus(hourlyData[selectedHourForNarrative].pm25, 'pm25')?.color,
                                            cursor: 'pointer'
                                        }}
                                        onClick={() => setShowThresholdInfo(prev => ({ ...prev, pm25: !prev.pm25 }))}
                                    >
                                        <p style={styles.statusText}>{getAirQualityStatus(hourlyData[selectedHourForNarrative].pm25, 'pm25')?.label}</p>
                                    </div>
                                )}
                                {!showThresholdInfo.pm25 && (
                                    <h2 style={styles.airHeaderTitle}>
                                        {thresholdInfoAir.find(t => t.level === getAirQualityStatus(hourlyData[selectedHourForNarrative]?.pm25, 'pm25')?.label && t.metric === 'pm25')?.description}
                                    </h2>
                                )}
                            </div>
                        </div>
                        <div style={styles.chartContainer}>
                            {showThresholdInfo.pm25 ? renderThresholdInfo('pm25') : <Bar data={getBarChartData('pm25')} options={barChartOptions} />}
                        </div>
                    </div>
                    <div style={styles.box3}>
                        <div style={styles.iotHeaderBox}>
                            <div style={styles.statusHeader}>
                                {hourlyData[selectedHourForNarrative] && (
                                    <div
                                        style={{
                                            ...styles.statusBox,
                                            backgroundColor: getAirQualityStatus(hourlyData[selectedHourForNarrative].humidity, 'humidity')?.color,
                                            cursor: 'pointer'
                                        }}
                                        onClick={() => setShowThresholdInfo(prev => ({ ...prev, humidity: !prev.humidity }))}
                                    >
                                        <p style={styles.statusText}>{getAirQualityStatus(hourlyData[selectedHourForNarrative].humidity, 'humidity')?.label}</p>
                                    </div>
                                )}
                                {!showThresholdInfo.humidity && (
                                    <h2 style={styles.airHeaderTitle}>
                                        {thresholdInfoAir.find(t => t.level === getAirQualityStatus(hourlyData[selectedHourForNarrative]?.humidity, 'humidity')?.label && t.metric === 'humidity')?.description}
                                    </h2>
                                )}
                            </div>
                        </div>
                        <div style={styles.chartContainer}>
                            {showThresholdInfo.humidity ? renderThresholdInfo('humidity') : <Bar data={getBarChartData('humidity')} options={barChartOptions} />}
                        </div>
                    </div>
                </div>

                {/* Water Quality Column */}
                <div style={styles.column}>
                    <div style={styles.box4}>
                        <div style={styles.iotHeaderBox}>
                            <div style={styles.statusHeader}>
                                {hourlyData[selectedHourForNarrative] && (
                                    <div
                                        style={{
                                            ...styles.statusBox,
                                            backgroundColor: getAirQualityStatus(hourlyData[selectedHourForNarrative].pm10, 'pm10')?.color,
                                            cursor: 'pointer'
                                        }}
                                        onClick={() => setShowThresholdInfo(prev => ({ ...prev, pm10: !prev.pm10 }))}
                                    >
                                        <p style={styles.statusText}>{getAirQualityStatus(hourlyData[selectedHourForNarrative].pm10, 'pm10')?.label}</p>
                                    </div>
                                )}
                                {!showThresholdInfo.pm10 && (
                                    <h2 style={styles.airHeaderTitle}>
                                        {thresholdInfoAir.find(t => t.level === getAirQualityStatus(hourlyData[selectedHourForNarrative]?.pm10, 'pm10')?.label && t.metric === 'pm10')?.description}
                                    </h2>
                                )}
                            </div>
                        </div>
                        <div style={styles.chartContainer}>
                            {showThresholdInfo.pm10 ? renderThresholdInfo('pm10') : <Bar data={getBarChartData('pm10')} options={barChartOptions} />}
                        </div>
                    </div>
                    <div style={styles.box6}>
                        <div style={styles.iotHeaderBox}>
                            <div style={styles.statusHeader}>
                                {hourlyData[selectedHourForNarrative] && (
                                    <div
                                        style={{
                                            ...styles.statusBox,
                                            backgroundColor: getAirQualityStatus(hourlyData[selectedHourForNarrative].oxygen, 'oxygen')?.color,
                                            cursor: 'pointer'
                                        }}
                                        onClick={() => setShowThresholdInfo(prev => ({ ...prev, oxygen: !prev.oxygen }))}
                                    >
                                        <p style={styles.statusText}>{getAirQualityStatus(hourlyData[selectedHourForNarrative].oxygen, 'oxygen')?.label}</p>
                                    </div>
                                )}
                                {!showThresholdInfo.oxygen && (
                                    <h2 style={styles.airHeaderTitle}>
                                        {thresholdInfoAir.find(t => t.level === getAirQualityStatus(hourlyData[selectedHourForNarrative]?.oxygen, 'oxygen')?.label && t.metric === 'oxygen')?.description}
                                    </h2>
                                )}
                            </div>
                        </div>
                        <div style={styles.chartContainer}>
                            {showThresholdInfo.oxygen ? renderThresholdInfo('oxygen') : <Bar data={getBarChartData('oxygen')} options={barChartOptions} />}
                        </div>
                    </div>
                </div>

                {/* Soil Quality Column */}
                <div style={styles.column}>
                    <div style={styles.box7}>
                        <div style={styles.iotHeaderBox}>
                            <div style={styles.statusHeader}>
                                {hourlyData[selectedHourForNarrative] && (
                                    <div
                                        style={{
                                            ...styles.statusBox,
                                            backgroundColor: getAirQualityStatus(hourlyData[selectedHourForNarrative].temperature, 'temperature')?.color,
                                            cursor: 'pointer'
                                        }}
                                        onClick={() => setShowThresholdInfo(prev => ({ ...prev, temperature: !prev.temperature }))}
                                    >
                                        <p style={styles.statusText}>{getAirQualityStatus(hourlyData[selectedHourForNarrative].temperature, 'temperature')?.label}</p>
                                    </div>
                                )}
                                {!showThresholdInfo.temperature && (
                                    <h2 style={styles.airHeaderTitle}>
                                        {thresholdInfoAir.find(t => t.level === getAirQualityStatus(hourlyData[selectedHourForNarrative]?.temperature, 'temperature')?.label && t.metric === 'temperature')?.description}
                                    </h2>
                                )}
                            </div>
                        </div>
                        <div style={styles.chartContainer}>
                            {showThresholdInfo.temperature ? renderThresholdInfo('temperature') : <Bar data={getBarChartData('temperature')} options={barChartOptions} />}
                        </div>
                    </div>
                    <div style={styles.box9}>
                        <div style={styles.iotHeaderBox}>
                            <h2 style={styles.airHeaderTitle}>Current Reading:
                                <IconButton size="small" style={{ ...styles.tooltipButton }}>
                                    <InfoOutlinedIcon />
                                </IconButton>
                            </h2>
                            <div style={styles.currentStatusContainer}>
                                <p style={styles.currentStatusText}>ID: {selectedLocation}</p>
                                <p style={styles.currentStatusText}>Time: {formatDateTime(new Date().setHours(selectedHourForNarrative))}</p>
                                <p style={styles.currentStatusText}>Location: {locations.find(loc => loc.id === selectedLocation)?.name}</p>
                            </div>
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
    toggleButton: {
        borderRadius: "8px",
        border: "none",
        color: '#fff',
        margin: 0,
        padding: "5px", // Controls inner spacing (top-bottom and left-right)
        textAlign: "center", // Aligns the text inside the input
        width: "160px", // Adjusts the width if needed
        backgroundColor: "rgba(0, 204, 221, 0.46)", // Semi-transparent white
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

    iotHeaderBox: {
        margin: 0,
        fontWeight: "bold",
        textAlign: "left",
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
    // Box styles AIR QUALITY
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
    box3: {
        flex: 0.9,
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
    airHeaderTitle: {
        fontSize: "14px",
        color: "#fff",
        textAlign: 'left',
        // paddingTop: '0px',
    },

    // Box styles WATER QUALITY
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
    box6: {
        flex: 0.9,
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

    // Box styles SOIL QUALITY
    box7: {
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
    box9: {
        flex: 0.9,
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

    tooltipButton: {
        color: '#fff',
        padding: '5px 10px',
        cursor: 'pointer',
        fontSize: '1rem',
    },
    tooltipButton2: {
        color: '#fff',
        padding: '5px 10px',
        cursor: 'pointer',
        fontSize: '1rem',
    },
    tooltipButton3: {
        color: '#fff',
        padding: '5px 10px',
        cursor: 'pointer',
        fontSize: '1rem',
    },
    chartContainer: {
        width: '100%',
        height: '100%',
        display: 'flex',
        // justifyContent: 'center',
        alignItems: 'center',
        margin: '-20px 0',
        paddingBottom: '20px',
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
        gap: '10px',
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
    thresholdInfoContainer: {
        color: '#fff',
        justifyContent: 'flex-end',
    },
    // thresholdTitle: {
    //     textAlign: 'center',
    //     fontSize: '1.5rem',
    //     fontWeight: 'bold',
    //     display: 'none',
    // },
    thresholdDescription: {
        textAlign: 'left',
        fontSize: '1rem',
        margin: '10px 0',
    },
    recommendationsList: {
        listStyleType: 'none',
        padding: 0,
    },
    recommendationItem: {
        textAlign: 'left',
        fontSize: '1.2rem',
        margin: '5px 0',
        fontWeight: 'normal',
    },
    currentStatusContainer: {
        marginTop: '10px',
    },
    currentStatusText: {
        color: '#fff',
        fontSize: '1rem',
        margin: '5px 0',
    },
};

export default AirBar;
