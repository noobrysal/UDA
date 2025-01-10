import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import backgroundImage from '../../assets/udabackg4.png';
import { supabaseAir } from '../iot/AirQuality/supabaseClient';
import { supabaseWater } from '../iot/WaterQuality/supabaseClient';
import axiosClient from '../iot/SoilQuality/axiosClient';
import { useNavigate } from 'react-router-dom';
import { border, display, fontSize, fontWeight, margin, width } from '@mui/system';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { IconButton, Tooltip as MuiTooltip } from '@mui/material';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const GeneralScreen = () => {
    const navigate = useNavigate();
    const [latestAirData, setLatestAirData] = useState(null);
    const [latestWaterData, setLatestWaterData] = useState(null);
    const [latestSoilData, setLatestSoilData] = useState(null);
    const [showLast24Hours, setShowLast24Hours] = useState(true); // Change initial state to true
    const [airData24Hours, setAirData24Hours] = useState([]);
    const [soilData24Hours, setSoilData24Hours] = useState([]);
    const [expandedStatus, setExpandedStatus] = useState({
        air: false,
        water: false,
        soil: false
    });
    const [showTooltip, setShowTooltip] = useState(false);
    const [showAirTooltip, setShowAirTooltip] = useState(false);
    const [showWaterTooltip, setShowWaterTooltip] = useState(false);
    const [showSoilTooltip, setShowSoilTooltip] = useState(false);
    const [showAirThreshold, setShowAirThreshold] = useState(false);
    const [showWaterThreshold, setShowWaterThreshold] = useState(false);
    const [showSoilThreshold, setShowSoilThreshold] = useState(false);

    const toggleStatusExpansion = (type) => {
        setExpandedStatus(prevState => ({
            ...prevState,
            [type]: !prevState[type]
        }));
    };

/*************  ✨ Codeium Command ⭐  *************/
/**
 * Toggles the visibility of a general tooltip.
 * When called, this function will switch the state of `showTooltip` between true and false.
 */

/******  22c83ee9-b4c6-4998-9224-233c11ba7abb  *******/
    // const handleTooltipToggle = () => {
    //     setShowTooltip(!showTooltip);
    // };

    const handleAirTooltipToggle = () => {
        setShowAirTooltip(!showAirTooltip);
        setShowWaterTooltip(false); // Ensure water tooltip is hidden
    };

    const handleWaterTooltipToggle = () => {
        setShowWaterTooltip(!showWaterTooltip);
        setShowAirTooltip(false); // Ensure air tooltip is hidden
    };

    const handleSoilTooltipToggle = () => {
        setShowSoilTooltip(!showSoilTooltip);
        setShowAirTooltip(false); // Ensure air tooltip is hidden
        setShowWaterTooltip(false); // Ensure water tooltip is hidden
    };

    // const handleAirThresholdToggle = () => {
    //     setShowAirThreshold(!showAirThreshold);
    // };

    // const handleWaterThresholdToggle = () => {
    //     setShowWaterThreshold(!showWaterThreshold);
    // };

    // const handleSoilThresholdToggle = () => {
    //     setShowSoilThreshold(!showSoilThreshold);
    // };

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
            { min: 91, max: Infinity, label: "Emergency", color: "rgba(232, 44, 48)" },
        ],
        pm10: [
            { min: 0, max: 50.99, label: "Good", color: "rgba(154, 205, 50)" },
            { min: 51, max: 100.99, label: "Fair", color: "rgba(250, 196, 62)" },
            { min: 101, max: 150.99, label: "Unhealthy", color: "rgba(230, 126, 14)" },
            { min: 151, max: 200.99, label: "Very Unhealthy", color: "rgba(232, 44, 48)" },
            { min: 201, max: 300.99, label: "Acutely Unhealthy", color: "rgba(159, 109, 199)" },
            { min: 301, max: Infinity, label: "Emergency", color: "rgba(232, 44, 48)" },
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

    const thresholdsSoil = {
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

    const soilRecommendations = {
        "Optimal": [
            "Maintain current irrigation schedule",
            "Continue monitoring soil conditions",
            "Document successful conditions for reference"
        ],
        "Low Moisture": [
            "Increase irrigation frequency",
            "Apply mulch to retain moisture",
            "Check irrigation system efficiency"
        ],
        "Waterlogged": [
            "Improve drainage",
            "Reduce irrigation",
            "Consider raised beds or soil amendments"
        ]
    };

    // Add helper function to get recommendations
    const getRecommendations = (status, type) => {
        if (!status) return [];
        const recommendationMap = {
            'air': airRecommendations,
            'water': waterRecommendations,
            'soil': soilRecommendations
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
            if (showLast24Hours) {
                const today = new Date();
                const yesterday = new Date(today);
                yesterday.setDate(today.getDate() - 1);

                const { data, error } = await supabaseAir
                    .from('sensors')
                    .select('*')
                    .gte('date', yesterday.toISOString())
                    .lte('date', today.toISOString())
                    .order('id', { ascending: false });

                if (error) throw error;
                setAirData24Hours(data);
                setLatestAirData(data[0]); // Set most recent data
            } else {
                const { data, error } = await supabaseAir
                    .from('sensors')
                    .select('*')
                    .order('id', { ascending: false })
                    .limit(1)
                    .single();

                if (error) throw error;
                setLatestAirData(data);
            }
        } catch (error) {
            console.error('Error fetching air data:', error);
        }
    };

    // Function to get current date in YYYY-MM-DD format
    const formatDate = (date) => {
        return date.toISOString().split('T')[0];
    };

    // Function to get latest water quality data
    const fetchLatestWaterData = async () => {
        try {
            if (showLast24Hours) {
                // Get current date in UTC
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate());
                const today = new Date(tomorrow);
                today.setDate(tomorrow.getDate() - 1);

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
                    .maybeSingle();

                if (error) throw error;
                setLatestWaterData(data);
            } else {
                // Fetch only the latest record
                const { data, error } = await supabaseWater
                    .from('sensor_data')
                    .select('*')
                    .order('id', { ascending: false })
                    .limit(1)
                    .single();

                if (error) throw error;
                setLatestWaterData(data);
            }
        } catch (error) {
            console.error('Error fetching water data:', error);
        }
    };

    // Function to get latest soil quality data
    const fetchLatestSoilData = async () => {
        try {
            if (showLast24Hours) {
                const today = new Date();
                const yesterday = new Date(today);
                yesterday.setDate(today.getDate() - 1);

                const response = await axiosClient.get('');
                const last24HoursData = response.data.filter(data => {
                    const dataDate = new Date(data.timestamp);
                    return dataDate >= yesterday && dataDate <= today;
                });

                setSoilData24Hours(last24HoursData);
                setLatestSoilData(last24HoursData[0]); // Set most recent data
            } else {
                const response = await axiosClient.get('');
                const sortedData = response.data.sort((a, b) => b.id - a.id);
                setLatestSoilData(sortedData[0]);
            }
        } catch (error) {
            console.error('Error fetching soil data:', error);
        }
    };

    useEffect(() => {
        fetchLatestAirData();
        fetchLatestWaterData();
        fetchLatestSoilData();

        const interval = setInterval(() => {
            fetchLatestAirData();
            fetchLatestWaterData();
            fetchLatestSoilData();
        }, 30000); // Refresh every 30 seconds

        return () => clearInterval(interval);
    }, [showLast24Hours]);

    // Add new calculation function for air quality safety percentage
    const calculateAirSafetyPercentage = (value, metric) => {
        if (value === null || value === undefined) {
            return 0;
        }

        const thresholds = {
            'pm25': { good: 25.99, emergency: 91 },
            'pm10': { good: 50.99, emergency: 301 }
        };

        const { good, emergency } = thresholds[metric];

        if (value <= good) {
            // Scale from 100% to 50% within good range
            return 100 - ((value / good) * 50);
        } else {
            // Scale from 50% to 0% after exceeding good range
            const range = emergency - good;
            const excess = value - good;
            return Math.max(0, 50 - ((excess / range) * 50));
        }
    };

    // Replace Air Quality Charts Configuration with new bar chart
    const airQualityData = {
        labels: ['PM2.5 Safety', 'PM10 Safety'],
        datasets: [{
            data: latestAirData ? [
                calculateAirSafetyPercentage(latestAirData?.pm25 ?? 0, 'pm25'),
                calculateAirSafetyPercentage(latestAirData?.pm10 ?? 0, 'pm10')
            ] : [0, 0],
            backgroundColor: latestAirData ? [
                getColorForMetric(latestAirData?.pm25 ?? 0, 'pm25', thresholdsAir),
                getColorForMetric(latestAirData?.pm10 ?? 0, 'pm10', thresholdsAir)
            ] : ['rgba(200, 200, 200, 0.2)', 'rgba(200, 200, 200, 0.2)'],
        }]
    };

    const airChartOptions = {
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
                    color: '#fff',
                    font: {
                        size: 16, // Adjust the size as needed
                        weight: 'bold' // Add bold font weight
                    }
                },
                grid: {
                    display: false
                }
            }
        },
        elements: {
            bar: {
                borderRadius: 4,
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
                        if (!latestAirData) {
                            return 'No data available';
                        }
                        const metric = context.label.includes('PM2.5') ? 'pm25' : 'pm10';
                        const actualValue = metric === 'pm25' ?
                            latestAirData?.pm25 || 0 :
                            latestAirData?.pm10 || 0;
                        return [
                            `Safety Level: ${context.raw.toFixed(1)}%`,
                            `Actual ${metric.toUpperCase()}: ${actualValue}`
                        ];
                    }
                }
            },
            datalabels: {
                color: '#fff', // Set the text color to white
                font: {
                    size: 14, // Adjust the size as needed
                    weight: 'bold'
                },
                formatter: (value) => `${value.toFixed(2)}%` // Format to 2 decimal places with percent sign
            },
        }
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
            data: latestWaterData ? [
                calculateSafetyPercentage(latestWaterData?.tss ?? 0, 'tss'),
                calculateSafetyPercentage(latestWaterData?.tds_ppm ?? 0, 'tds_ppm')
            ] : [0, 0],
            backgroundColor: latestWaterData ? [
                getColorForMetric(latestWaterData?.tss ?? 0, 'tss', thresholdsWater),
                getColorForMetric(latestWaterData?.tds_ppm ?? 0, 'tds_ppm', thresholdsWater)
            ] : ['rgba(200, 200, 200, 0.2)', 'rgba(200, 200, 200, 0.2)'],
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
                    color: '#fff',
                    font: {
                        size: 16, // Adjust the size as needed
                        weight: 'bold' // Add bold font weight
                    }
                },
                grid: {
                    display: false
                }
            }
        },
        elements: {
            bar: {
                borderRadius: 4,
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
                        if (!latestWaterData) {
                            return 'No data available';
                        }
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
            },
            datalabels: {
                color: '#fff', // Set the text color to white
                font: {
                    size: 14, // Adjust the size as needed
                    weight: 'bold'
                },
                formatter: (value) => `${value.toFixed(2)}%` // Format to 2 decimal places with percent sign
            },
        }
    };

    // Soil Quality Gauge Configuration
    const soilGaugeData = {
        labels: ['Soil Moisture'],
        datasets: [{
            data: [latestSoilData?.soil_moisture || 0, 100 - (latestSoilData?.soil_moisture || 0)],
            backgroundColor: [
                getColorForMetric(latestSoilData?.soil_moisture, 'soil_moisture', thresholdsSoil),
                'rgba(200, 200, 200, 0.2)'
            ],
            circumference: 180,
            rotation: -90,
        }]
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

    const getSoilQualityStatus = () => {
        if (!latestSoilData) return 'No data available';
        return getStatusText(latestSoilData.soil_moisture, 'soil_moisture', thresholdsSoil);
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

    const renderSoilRecommendations = () => {
        if (!latestSoilData) return null;
        return (
            <div style={styles.recommendationsList}>
                <p style={styles.recommendationItem}>
                    <strong>Irrigation Status:</strong> {latestSoilData.remarks || 'No status available'}
                </p>
                {getRecommendations(getSoilQualityStatus(), 'soil').map((rec, index) => (
                    <p key={index} style={styles.recommendationItem}>• {rec}</p>
                ))}
            </div>
        );
    };

    // Add toggle handler
    const handleToggleView = () => {
        setShowLast24Hours(!showLast24Hours);
    };

    // Helper to render no data message
    const renderNoDataMessage = () => (
        <div style={styles.noDataMessage}>
            No data available for last 24 hours
        </div>
    );

    // Add click handlers for each chart
    const handleAirChartClick = () => {
        if (latestAirData?.id) {
            window.open(`/air-quality/id/${latestAirData.id}`, '_blank');
        }
    };

    const handleWaterChartClick = () => {
        if (latestWaterData?.id) {
            window.open(`/water-quality/id/${latestWaterData.id}`, '_blank');
        }
    };

    const handleSoilChartClick = () => {
        if (latestSoilData?.id) {
            window.open(`/soil-quality/id/${latestSoilData.id}`, '_blank');
        }
    };

    const renderTooltipContent = () => {
        return (
            <div>
                <h4 style={{...styles.tooltipHeader, marginBottom: '20px'}}>Air Quality Thresholds</h4>
                <table style={styles.tooltipTable}>
                    <thead>
                        <tr>
                            <th style={styles.tooltipTableHeader}>Category</th>
                            <th style={{ ...styles.tooltipTableHeader, width: '11%'}}>Particle Matter 10 (PM10)</th>
                            <th style={{ ...styles.tooltipTableHeader, width: '12%'}}>Particle Matter 2.5 (PM2.5)</th>
                            <th style={styles.tooltipTableHeader}>Cautionary Statement</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style={{ ...styles.tooltipTableCell, backgroundColor: "rgba(154, 205, 50)", color: "#fff" }}>Good</td>
                            <td style={styles.tooltipTableCell}>0–54µg/m³</td>
                            <td style={styles.tooltipTableCell}>0–25µg/m³</td>
                            <td style={styles.tooltipTableCell}>None.</td>
                        </tr>
                        <tr>
                            <td style={{ ...styles.tooltipTableCell, backgroundColor: "rgba(250, 196, 62)", color: "#fff" }}>Fair</td>
                            <td style={styles.tooltipTableCell}>55–154µg/m³</td>
                            <td style={styles.tooltipTableCell}>25.1–35.0µg/m³</td>
                            <td style={styles.tooltipTableCell}>None.</td>
                        </tr>
                        <tr>
                            <td style={{ ...styles.tooltipTableCell, backgroundColor: "rgba(230, 126, 14)", color: "#fff" }}>Unhealthy</td>
                            <td style={styles.tooltipTableCell}>155–254µg/m³</td>
                            <td style={styles.tooltipTableCell}>35.1–45.0µg/m³</td>
                            <td style={{ ...styles.tooltipTableCell, textAlign: "left" }}>People with respiratory disease, such as asthma, should limit outdoor exertion.</td>
                        </tr>
                        <tr>
                            <td style={{ ...styles.tooltipTableCell, backgroundColor: "rgba(232, 44, 48)", color: "#fff" }}>Very Unhealthy</td>
                            <td style={styles.tooltipTableCell}>255–354µg/m³</td>
                            <td style={styles.tooltipTableCell}>45.1–55µg/m³</td>
                            <td style={{ ...styles.tooltipTableCell, textAlign: "left" }}>
                                Pedestrians should avoid heavy traffic areas.
                                People with heart or respiratory disease such as asthma should stay indoors and rest as much as possible.
                                Unnecessary trips should be postponed.
                                People should voluntarily restrict the use of vehicles.
                            </td>
                        </tr>
                        <tr>
                            <td style={{ ...styles.tooltipTableCell, backgroundColor: "rgba(159, 109, 199)", color: "#fff" }}>Acutely Unhealthy</td>
                            <td style={styles.tooltipTableCell}>355–424µg/m³</td>
                            <td style={styles.tooltipTableCell}>55.1–90µg/m³</td>
                            <td style={{ ...styles.tooltipTableCell, textAlign: "left" }}>
                                Pedestrians should avoid heavy traffic areas.
                                People with heart or respiratory disease such as asthma should stay indoors and rest as much as possible.
                                Unnecessary trips should be postponed.
                                Motor vehicle use may be restricted.
                                Industrial activities may be curtailed.
                            </td>
                        </tr>
                        <tr>
                            <td style={{ ...styles.tooltipTableCell, backgroundColor: "rgba(140, 1, 4)", color: "#fff" }}>Emergency</td>
                            <td style={styles.tooltipTableCell}>425–504µg/m³</td>
                            <td style={styles.tooltipTableCell}>Above 91µg/m³</td>
                            <td style={{ ...styles.tooltipTableCell, textAlign: "left" }}>
                                Everyone should remain indoors (keeping windows and doors closed unless heat stress is possible).
                                Motor vehicle use should be prohibited except for emergency situations.
                                Industrial activities, except that which is vital for public safety and health, should be curtailed.
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        );
    };

    const thresholdInfo = [
        {
            level: "Acceptable",
            color: "rgba(154, 205, 50)",
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
            color: "rgba(199, 46, 46)",
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
            color: "rgba(199, 46, 46)",
            description: "Total Dissolved Solids (TDS) exceed recommended levels. This may affect water taste and quality.",
            icon: "💧",
            recommendations: [
                "Review treatment processes",
                "Check for mineral buildup",
                "Consider additional filtration"
            ]
        }
    ];

    const renderWaterTooltipContent = () => {
        return (
            <div>
                <h4 style={{...styles.tooltipHeader, marginBottom: '20px'}}>Water Quality Thresholds</h4>
                <table style={styles.tooltipTable}>
                    <thead>
                        <tr>
                            <th style={styles.tooltipTableHeader}>Category</th>
                            <th style={styles.tooltipTableHeader}>Total Suspended Solids (TSS)</th>
                            <th style={styles.tooltipTableHeader}>Total Dissolved Solids (TDS)</th>
                            <th style={styles.tooltipTableHeader}>Cautionary Statement</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style={{ ...styles.tooltipTableCell, backgroundColor: thresholdsWater.tss[0].color }}>Acceptable</td>
                            <td style={styles.tooltipTableCell}>0–50 mg/L</td>
                            <td style={styles.tooltipTableCell}>{"<500 mg/L"}</td>
                            <td style={styles.tooltipTableCell}>Water quality is within safe limits.</td>
                        </tr>
                        <tr>
                            <td style={{ ...styles.tooltipTableCell, backgroundColor: thresholdsWater.tss[1].color }}>Too Cloudy/High Dissolved Substances</td>
                            <td style={styles.tooltipTableCell}>50.01+ mg/L</td>
                            <td style={styles.tooltipTableCell}>500.01+ mg/L</td>
                            <td style={styles.tooltipTableCell}>High TSS and TDS levels may indicate contamination and affect water clarity and taste.</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        );
    };

    const renderSoilTooltipContent = () => {
        return (
            <div>
                <h4 style={{...styles.tooltipHeader, marginBottom: '20px'}}>Soil Quality Thresholds</h4>
                <table style={styles.tooltipTable}>
                    <thead>
                        <tr>
                            <th style={styles.tooltipTableHeader}>Category</th>
                            <th style={styles.tooltipTableHeader}>Soil Moisture</th>
                            <th style={styles.tooltipTableHeader}>Cautionary Statement</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style={{ ...styles.tooltipTableCell, backgroundColor: thresholdsSoil.soil_moisture[0].color }}>Dry</td>
                            <td style={styles.tooltipTableCell}>0–19.99%</td>
                            <td style={styles.tooltipTableCell}>Soil is too dry, which may affect plant growth.</td>
                        </tr>
                        <tr>
                            <td style={{ ...styles.tooltipTableCell, backgroundColor: thresholdsSoil.soil_moisture[1].color }}>Low Moisture</td>
                            <td style={styles.tooltipTableCell}>20–39.99%</td>
                            <td style={styles.tooltipTableCell}>Soil moisture is low, consider increasing irrigation.</td>
                        </tr>
                        <tr>
                            <td style={{ ...styles.tooltipTableCell, backgroundColor: thresholdsSoil.soil_moisture[2].color }}>Optimal</td>
                            <td style={styles.tooltipTableCell}>40–70.99%</td>
                            <td style={styles.tooltipTableCell}>Soil moisture is at optimal levels for plant growth.</td>
                        </tr>
                        <tr>
                            <td style={{ ...styles.tooltipTableCell, backgroundColor: thresholdsSoil.soil_moisture[3].color }}>Saturated</td>
                            <td style={styles.tooltipTableCell}>71–100%</td>
                            <td style={styles.tooltipTableCell}>Soil is saturated, which may lead to waterlogging.</td>
                        </tr>
                        <tr>
                            <td style={{ ...styles.tooltipTableCell, backgroundColor: thresholdsSoil.soil_moisture[4].color }}>Waterlogged</td>
                            <td style={styles.tooltipTableCell}>101%+</td>
                            <td style={styles.tooltipTableCell}>Soil is waterlogged, which can harm plant roots.</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        );
    };

    // Modified status display section in the return JSX
    const thresholdInfoAir = [
        {
            level: "Good",
            color: "rgb(154, 205, 50)",
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
            color: "rgb(250, 196, 62)",
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
            color: "rgb(230, 126, 14)",
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
            color: "rgb(232, 44, 48)",
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
            color: "rgb(140, 1, 4)",
            description: "Everyone should stay inside with windows closed. The air is too dangerous for outdoor activities, except for emergencies.",
            icon: "☠️",
            recommendations: [
                "Avoid all outdoor activities",
                "Seek medical attention if experiencing symptoms",
                "Follow emergency guidelines"
            ]
        }
    ];

    const thresholdInfoWater = [
        {
            level: "Acceptable",
            color: "rgba(154, 205, 50)",
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
            color: "rgba(199, 46, 46)",
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
            color: "rgba(199, 46, 46)",
            description: "Total Dissolved Solids (TDS) exceed recommended levels. This may affect water taste and quality.",
            icon: "💧",
            recommendations: [
                "Review treatment processes",
                "Check for mineral buildup",
                "Consider additional filtration"
            ]
        }
    ];

    const thresholdInfoSoil = [
        {
            level: "Optimal",
            color: "rgba(154, 205, 50, 1)",
            description: "Soil moisture is between 40-70%. These conditions are ideal for plant growth, ensuring proper water availability while maintaining adequate oxygen in the soil.",
            icon: "✅",
            recommendations: [
                "Maintain current irrigation schedule",
                "Continue monitoring soil conditions",
                "Document successful conditions for reference"
            ]
        },
        {
            level: "Low Moisture",
            color: "rgba(250, 196, 62, 1)",
            description: "Soil moisture is between 20-39%. Plants may start experiencing mild water stress, affecting their growth and development.",
            icon: "💧",
            recommendations: [
                "Increase irrigation frequency",
                "Apply mulch to retain moisture",
                "Check irrigation system efficiency"
            ]
        },
        {
            level: "Dry",
            color: "rgba(232, 44, 4, 1)",
            description: "Soil moisture is below 20%. Plants are at risk of severe water stress and wilting. Immediate action is required.",
            icon: "🏜️",
            recommendations: [
                "Implement emergency irrigation",
                "Add organic matter to improve water retention",
                "Consider drought-resistant crops"
            ]
        },
        {
            level: "Saturated",
            color: "rgba(230, 126, 14, 1)",
            description: "Soil moisture is between 71-100%. While plants have plenty of water, root health may be compromised due to limited oxygen.",
            icon: "💦",
            recommendations: [
                "Reduce irrigation frequency",
                "Improve soil drainage",
                "Monitor for signs of root disease"
            ]
        },
        {
            level: "Waterlogged",
            color: "rgba(140, 1, 4, 1)",
            description: "Soil moisture exceeds 100%. Plants are at risk of root rot and other water-related diseases due to oxygen deficiency in the soil.",
            icon: "🌊",
            recommendations: [
                "Stop irrigation immediately",
                "Implement drainage solutions",
                "Consider raised beds or soil amendments"
            ]
        }
    ];

    const getThresholdInfo = (level, type) => {
        const thresholdMap = {
            'air': thresholdInfoAir,
            'water': thresholdInfoWater,
            'soil': thresholdInfoSoil
        };
        return thresholdMap[type].find(info => info.level === level);
    };

    return (
        <div style={styles.fullcontainer}>
            <div style={styles.headerContainer}>
                <header style={styles.header}>
                    <div>
                        <h1 style={styles.title}>Home Dashboard</h1>
                        <p style={styles.subtitle}>Unified Dashboard Analytics</p>
                    </div>
                    <button
                        onClick={handleToggleView}
                        style={styles.toggleButton}
                    >
                        {showLast24Hours ? 'Show Latest Data' : 'Show Last 24 Hours'} {/* Swap the toggle text */}
                    </button>
                </header>
            </div>
            <div style={styles.gridContainer}>
                {/* Air Quality Column */}
                <div style={styles.column}>
                    <div style={styles.box1}>
                        <div style={styles.iotHeaderBox}>
                            <h2 style={styles.airHeaderTitle}>Air Quality
                            <IconButton size="small" style={{ ...styles.tooltipButton}} onClick={handleAirTooltipToggle}>
                                <InfoOutlinedIcon />
                            </IconButton>
                            </h2>
                            
                        </div>
                        <div style={styles.chartContainer} onClick={handleAirChartClick}>
                            {showLast24Hours && airData24Hours.length === 0 ? (
                                renderNoDataMessage()
                            ) : (
                                <div style={styles.clickableChart}>
                                    <Bar
                                        data={airQualityData}
                                        options={airChartOptions}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                    <div style={styles.box2}>
                        <div style={styles.iotHeaderBox}>
                            <div style={styles.statusHeader}>
                                <h2 style={styles.airHeaderTitle}>Current Status:</h2>
                                {latestAirData && (
                                    <div
                                        style={{
                                            ...styles.statusBox,
                                            backgroundColor: getAirQualityStatus().color,
                                            cursor: 'pointer'
                                        }}
                                        onClick={() => toggleStatusExpansion('air')}
                                    >
                                        <p style={styles.statusText}>{getAirQualityStatus().text}</p>
                                    </div>
                                )}
                            </div>
                            {latestAirData && expandedStatus.air && (
                                <div style={styles.metadataText}>
                                    <p>{getThresholdInfo(getAirQualityStatus().text, 'air').description}</p>
                                </div>
                            )}
                            {latestAirData && !expandedStatus.air && (
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
                            <h2 style={styles.waterHeaderTitle}>Water Quality
                            <IconButton size="small" style={{ ...styles.tooltipButton2}} onClick={handleWaterTooltipToggle}>
                                <InfoOutlinedIcon />
                            </IconButton>
                            </h2>
                        </div>
                        <div style={styles.chartContainer} onClick={handleWaterChartClick}>
                            {showLast24Hours && !latestWaterData ? (
                                renderNoDataMessage()
                            ) : (
                                <div style={styles.clickableChart}>
                                    <Bar
                                        data={waterQualityData}
                                        options={waterChartOptions}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                    <div style={styles.box5}>
                        <div style={styles.iotHeaderBox}>
                            <div style={styles.statusHeader}>
                                <h2 style={styles.waterHeaderTitle}>Current Status:</h2>
                                {latestWaterData && (
                                    <div
                                        style={{
                                            ...styles.statusBox,
                                            backgroundColor: getWaterQualityStatus().color,
                                            cursor: 'pointer'
                                        }}
                                        onClick={() => toggleStatusExpansion('water')}
                                    >
                                        <p style={styles.statusText}>{getWaterQualityStatus().text}</p>
                                    </div>
                                )}
                            </div>
                            {latestWaterData && expandedStatus.water && (
                                <div style={styles.metadataText}>
                                    <p>{getThresholdInfo(getWaterQualityStatus().text, 'water').description}</p>
                                </div>
                            )}
                            {latestWaterData && !expandedStatus.water && (
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

                {/* Soil Quality Column */}
                <div style={styles.column}>
                    <div style={styles.box7}>
                        <div style={styles.iotHeaderBox}>
                            <h2 style={styles.soilHeaderTitle}>Soil Quality
                            <IconButton size="small" style={{ ...styles.tooltipButton3}} onClick={handleSoilTooltipToggle}>
                                <InfoOutlinedIcon />
                            </IconButton>
                            </h2>
                        </div>
                        <div style={styles.chartContainer} onClick={handleSoilChartClick}>
                            {showLast24Hours && soilData24Hours.length === 0 ? (
                                renderNoDataMessage()
                            ) : (
                                <div style={styles.clickableChart}>
                                    <Doughnut
                                        data={soilGaugeData}
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
                                                datalabels: {
                                                    color: '#fff', // Set the text color to white
                                                    font: {
                                                        size: 14, // Adjust the size as needed
                                                        weight: 'bold'
                                                    },
                                                    formatter: (value) => `${value.toFixed(2)}%` // Format to 2 decimal places with percent sign
                                                },
                                            },
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                    <div style={styles.box8}>
                        <div style={styles.iotHeaderBox}>
                            <div style={styles.statusHeader}>
                                <h2 style={styles.soilHeaderTitle}>Current Status:</h2>
                                {latestSoilData && (
                                    <div
                                        style={{
                                            ...styles.statusBox,
                                            backgroundColor: getSoilQualityStatus().color,
                                            cursor: 'pointer'
                                        }}
                                        onClick={() => toggleStatusExpansion('soil')}
                                    >
                                        <p style={styles.statusText}>{getSoilQualityStatus().text}</p>
                                    </div>
                                )}
                            </div>
                            {latestSoilData && expandedStatus.soil && (
                                <div style={styles.metadataText}>
                                    <p>{getThresholdInfo(getSoilQualityStatus().text, 'soil').description}</p>
                                </div>
                            )}
                            {latestSoilData && !expandedStatus.soil && (
                                <p style={styles.metadataText}>
                                    ID: {latestSoilData.id}<br />
                                    Time: {new Date(latestSoilData.timestamp).toLocaleString()}
                                </p>
                            )}
                        </div>
                    </div>
                    <div style={styles.box9}>
                        <div style={styles.iotHeaderBox}>
                            <h2 style={styles.soilHeaderTitle}>Recommendations</h2>
                            {latestSoilData && renderSoilRecommendations()}
                        </div>
                    </div>
                </div>
            </div>
            {showAirTooltip && (
                <div style={styles.tooltipOverlay} onClick={handleAirTooltipToggle}>
                    <div style={styles.tooltipContent} onClick={(e) => e.stopPropagation()}>
                        {renderTooltipContent()}
                    </div>
                </div>
            )}
            {showWaterTooltip && (
                <div style={styles.tooltipOverlay} onClick={handleWaterTooltipToggle}>
                    <div style={styles.tooltipContent2} onClick={(e) => e.stopPropagation()}>
                        {renderWaterTooltipContent()}
                    </div>
                </div>
            )}
            {showSoilTooltip && (
                <div style={styles.tooltipOverlay} onClick={handleSoilTooltipToggle}>
                    <div style={styles.tooltipContent3} onClick={(e) => e.stopPropagation()}>
                        {renderSoilTooltipContent()}
                    </div>
                </div>
            )}
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

    // Box styles SOIL QUALITY
    box7: {
        flex: 1,
        backgroundColor: "rgba(255, 222, 89, 0.2)",
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
    box8: {
        flex: 0.3,
        backgroundColor: "rgba(255, 222, 89, 0.2)",
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
        flex: 0.5,
        backgroundColor: "rgba(255, 222, 89, 0.2)",
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
    soilHeaderTitle: {
        fontSize: "1.2rem",
        color: "#fff",
    },

    chartContainer: {
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        margin: '-20px 0',
        paddingBottom: '20px',
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
        width: 'auto',
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
    },
    toggleButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        border: '1px solid rgba(255, 255, 255, 0.4)',
        borderRadius: '20px',
        color: '#fff',
        padding: '8px 16px',
        cursor: 'pointer',
        fontSize: '0.9rem',
        marginLeft: 'auto',
        transition: 'background-color 0.3s',
        '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
        }
    },
    gaugeContainer: {
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-around',
        alignItems: 'center',
        margin: '20px 0',
    },
    gauge: {
        width: '100%',
        height: '45%',
        position: 'relative',
    },
    noDataMessage: {
        color: '#fff',
        fontSize: '1rem',
        textAlign: 'center',
        width: '100%',
        margin: 'auto',
    },
    clickableChart: {
        width: '100%',
        height: '100%',
        cursor: 'pointer',
        transition: 'transform 0.2s ease',
        '&:hover': {
            transform: 'scale(1.02)',
        }
    },

    // tooltipHeaderBox: {
    //     display: "flex",
    //     margin: 0,
    //     fontWeight: "bold",
    //     // textAlign: "left",
    //     alignItems: "center",
    //     justifyContent: "space-between",
    // },
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
    tooltipOverlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    tooltipContent: {
        backgroundColor: 'rgba(12, 38, 64, 0.9)',
        color: '#fff',
        padding: '20px',
        borderRadius: '20px',
        maxWidth: '80%',
        textAlign: 'center',
    },
    tooltipContent2: {
        backgroundColor: 'rgba(20, 60, 11, 0.9)',
        color: '#fff',
        padding: '20px',
        borderRadius: '20px',
        maxWidth: '80%',
        textAlign: 'center',
    },
    tooltipContent3: {
        backgroundColor: 'rgba(81, 74, 29, 0.9)',
        color: '#fff',
        padding: '20px',
        borderRadius: '20px',
        maxWidth: '80%',
        textAlign: 'center',
    },
    tooltipTable: {
        width: '100%',
        borderCollapse: 'collapse',
        marginBottom: '10px',
    },
    tooltipTableHeader: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        border: '1px solid rgba(255, 255, 255)',
    },
    tooltipTableCell: {
        border: '1px solid rgba(255, 255, 255)',
        padding: '10px',
    },
    tooltipTableCell2: {
        border: '1px solid rgba(255, 255, 255)',
        // padding: '10px',
    }
};

export default GeneralScreen;