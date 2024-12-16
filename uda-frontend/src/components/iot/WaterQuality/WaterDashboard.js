import React, { useEffect, useState, useRef } from 'react';
import { supabaseWater } from './supabaseClient';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Bar } from 'react-chartjs-2';
import { useNavigate } from 'react-router-dom';
// import Sidebar from '../../Sidebar';
import backgroundImage from '../../../assets/waterdash.png';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { color, height, width } from '@mui/system';

// Register chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);



const WaterDashboard = () => {
    const [waterData, setWaterData] = useState([]);
    const [summary, setSummary] = useState([]);
    const [visibleIndices, setVisibleIndices] = useState([0, 1]); // Tracks visible locations for the carousel
    const [isTransitioning, setIsTransitioning] = useState(false); // Track if a transition is in progress
    const [transitionDirection, setTransitionDirection] = useState('left'); // Track slide direction
    const [filters, setFilters] = useState({
        range: 'day',
        first: { date: '', month: '', weekStart: '' },
        second: { date: '', month: '', weekStart: '' }
    });
    const [summaryErrorMessage, setSummaryErrorMessage] = useState(null);
    const [logsErrorMessage, setLogsErrorMessage] = useState(null);

    const [comparisonData, setComparisonData] = useState(null); // State for comparison chart data

    //BUTTON NAVIGATION TO WATER DETAILED DATA
    const navigate = useNavigate();

    const handleButtonClick = () => {
        // Navigate to the desired route when the button is clicked
        navigate('/water-quality'); // Change '/detailed-data' to the route you want
    };

    const locations = [
        { id: 1, name: 'Lapasan' },
        { id: 2, name: 'Agusan' },
        { id: 3, name: 'USTP-CDO' },
        { id: 4, name: 'El Salvador' },
        { id: 5, name: 'Sports Complex' },
    ];

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

    const [summaryFilters, setSummaryFilters] = useState({
        date: '',
        time: '',
        range: 'day',
        comparisonDate: '',
    });

    const handleSummaryFiltersChange = (event) => {
        const { name, value } = event.target;
        setSummaryFilters((prevFilters) => ({ ...prevFilters, [name]: value }));
    };

    const fetchData = async () => {
        try {
            const { date, comparisonDate, range } = summaryFilters;

            if (date === comparisonDate) {
                toast.error('Main date range and comparison date range should be different.');
                return;
            }

            let start, end, comparisonStart, comparisonEnd;

            // Helper function to format date to locale string
            const formatDateToLocaleString = (date) => {
                return new Date(date).toLocaleString("en-US", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour12: true,
                    timeZone: "UTC" // Changed to UTC for water data
                });
            };

            // Calculate start and end dates for the main date range
            if (range === 'day') {
                start = `${date}T00:00:00.000Z`;
                end = `${date}T23:59:59.999Z`;
            } else if (range === 'week') {
                start = calculateStartDate(date, range);
                end = calculateEndDate(date, range);
            } else if (range === 'month') {
                const startDate = new Date(date);
                startDate.setDate(1);
                start = `${startDate.toISOString().split('T')[0]}T00:00:00.000Z`;
                const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
                end = `${endDate.toISOString().split('T')[0]}T23:59:59.999Z`;
            }

            // Calculate start and end dates for the comparison date range using the same range
            if (range === 'day') {
                comparisonStart = `${comparisonDate}T00:00:00.000Z`;
                comparisonEnd = `${comparisonDate}T23:59:59.999Z`;
            } else if (range === 'week') {
                comparisonStart = calculateStartDate(comparisonDate, range);
                comparisonEnd = calculateEndDate(comparisonDate, range);
            } else if (range === 'month') {
                const comparisonStartDate = new Date(comparisonDate);
                comparisonStartDate.setDate(1);
                comparisonStart = `${comparisonStartDate.toISOString().split('T')[0]}T00:00:00.000Z`;
                const comparisonEndDate = new Date(comparisonStartDate.getFullYear(), comparisonStartDate.getMonth() + 1, 0);
                comparisonEnd = `${comparisonEndDate.toISOString().split('T')[0]}T23:59:59.999Z`;
            }

            // Single data fetch without location filtering
            const { data, error } = await supabaseWater
                .from('sensor_data')
                .select('*')
                .gte('timestamp', start)
                .lt('timestamp', end);

            if (error) throw error;

            const summaryComparisonData = await supabaseWater
                .from('sensor_data')
                .select('*')
                .gte('timestamp', comparisonStart)
                .lt('timestamp', comparisonEnd);

            if (summaryComparisonData.error) throw summaryComparisonData.error;

            let hasData = data.length > 0 || summaryComparisonData.data.length > 0;
            let hasMainData = data.length > 0;
            let hasComparisonData = summaryComparisonData.data.length > 0;

            if (!hasData) {
                const formattedStart = formatDateToLocaleString(start);
                const formattedComparisonStart = formatDateToLocaleString(comparisonStart);
                toast.error(`No data found for both ${formattedStart} and ${formattedComparisonStart}`);
                return;
            }

            if (!hasMainData) {
                const formattedStart = formatDateToLocaleString(start);
                toast.error(`No data found for the main date range starting at ${formattedStart}`);
                return;
            }

            if (!hasComparisonData) {
                const formattedComparisonStart = formatDateToLocaleString(comparisonStart);
                toast.error(`No data found for the comparison date range starting at ${formattedComparisonStart}`);
                return;
            }

            // Simplified data structure without location
            const waterData = [{
                data,
                summaryComparisonData: summaryComparisonData.data
            }];

            setWaterData(waterData);
            calculateSummary(waterData);
            toast.success('Summary data fetched successfully.');
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Error fetching data. Please try again.');
        }
    };

    useEffect(() => {
        const timer = setInterval(() => {
            if (!isTransitioning) {
                setTransitionDirection(transitionDirection === 'left' ? 'right' : 'left');
                setTimeout(() => {
                    setVisibleIndices((prevIndices) => {
                        const nextStart = (prevIndices[1] + 1) % locations.length;
                        return [nextStart, (nextStart + 1) % locations.length];
                    });
                }, 500); // delay the update by 500ms
            }
        }, 5000);

        return () => clearInterval(timer);
    }, [locations.length, isTransitioning, transitionDirection]);

    const calculateSummary = (waterData) => {
        const summaries = waterData.map(({ data, summaryComparisonData }) => {
            const calculateMetric = (metric) => {
                const calculateRangeAverage = (data, range) => {
                    if (!data || data.length === 0) return NaN;

                    // Helper function to safely parse dates
                    const safeParseDate = (dateStr) => {
                        try {
                            const date = new Date(dateStr);
                            // Check if date is valid
                            if (isNaN(date.getTime())) {
                                console.warn('Invalid date:', dateStr);
                                return null;
                            }
                            return date;
                        } catch (err) {
                            console.warn('Error parsing date:', dateStr, err);
                            return null;
                        }
                    };

                    // Sort data by date and filter out invalid dates
                    const sortedData = [...data]
                        .map(item => ({
                            ...item,
                            parsedDate: safeParseDate(item.timestamp) // Use timestamp instead of date
                        }))
                        .filter(item => item.parsedDate !== null)
                        .sort((a, b) => a.parsedDate - b.parsedDate);

                    if (sortedData.length === 0) return NaN;

                    const calculateGroupedAverage = (data, groupKeyFn) => {
                        const groups = {};
                        data.forEach(item => {
                            try {
                                const key = groupKeyFn(item.parsedDate);
                                if (!groups[key]) {
                                    groups[key] = { sum: 0, count: 0 };
                                }
                                const value = item[metric];
                                if (value != null && !isNaN(value)) {
                                    groups[key].sum += value;
                                    groups[key].count++;
                                }
                            } catch (err) {
                                console.warn('Error processing item:', item, err);
                            }
                        });

                        const groupAverages = Object.values(groups)
                            .map(g => g.count > 0 ? g.sum / g.count : NaN)
                            .filter(v => !isNaN(v));

                        return groupAverages.length > 0
                            ? groupAverages.reduce((a, b) => a + b) / groupAverages.length
                            : NaN;
                    };

                    // Helper function to format date to ISO string safely
                    const safeFormatDate = (date, formatter) => {
                        try {
                            return formatter(date);
                        } catch (err) {
                            console.warn('Error formatting date:', date, err);
                            return null;
                        }
                    };

                    switch (range) {
                        case 'hour':
                            return calculateGroupedAverage(sortedData, d =>
                                safeFormatDate(d, date => date.toISOString().split(':')[0]));
                        case 'day':
                            return calculateGroupedAverage(sortedData, d =>
                                safeFormatDate(d, date => date.toISOString().split('T')[0]));
                        case 'week':
                            return calculateGroupedAverage(sortedData, d => {
                                const startOfWeek = new Date(d);
                                startOfWeek.setDate(d.getDate() - d.getDay());
                                return safeFormatDate(startOfWeek, date => date.toISOString().split('T')[0]);
                            });
                        case 'month':
                            return calculateGroupedAverage(sortedData, d =>
                                safeFormatDate(d, date => date.toISOString().slice(0, 7)));
                        default:
                            return NaN;
                    }
                };

                // Calculate averages for both periods
                const avg = calculateRangeAverage(data, summaryFilters.range);
                const comparisonAvg = calculateRangeAverage(summaryComparisonData, summaryFilters.range);

                const trend = !isNaN(avg) && !isNaN(comparisonAvg)
                    ? (avg < comparisonAvg ? 'improving' : avg > comparisonAvg ? 'worsening' : 'stable')
                    : '';

                const status = getStatus(avg, metric);

                return { avg, status, trend };
            };

            // Return a single summary object instead of array
            return {
                pH: calculateMetric('pH'),
                temperature: calculateMetric('temperature'),
                tss: calculateMetric('tss'),
                tds_ppm: calculateMetric('tds_ppm'),
            };
        });

        // Set the first summary as it's a single dataset
        setSummary(summaries[0]);
    };

    const getStatus = (value, metric) => {
        const metricThresholds = thresholds[metric];
        if (!metricThresholds || value === null || value === undefined || isNaN(value)) {
            return 'Unknown';
        }

        // Find the threshold where value is within range
        const threshold = metricThresholds.find(
            (range) => value >= range.min && value <= range.max
        );

        // Return the label of the matched threshold or last threshold's label if value exceeds all ranges
        return threshold ? threshold.label : metricThresholds[metricThresholds.length - 1].label;
    };

    const renderTrendIndicator = (trend) => {
        if (!trend) return null;
        return (
            <span style={{ fontSize: '16px', color: trend === 'improving' ? 'green' : 'red', backgroundColor: '#fefefe', paddingLeft: '4px', paddingRight: '4px', borderRadius: '4px' }}>
                {trend === 'improving' ? 'Improving ↑' : 'Worsening ↓'}
            </span>
        );
    };

    const renderSummaryPanel = (metric, label, locationSummary) => {
        const metricData = locationSummary[metric];
        if (!metricData || isNaN(metricData.avg)) {
            return (
                <div style={styles.summaryPanel}>
                    <h5>{label}</h5>
                    <p>Data for this time / location not available</p>
                    <p>Status: <span style={styles.status?.['Missing'] || {}}>Missing</span></p>
                </div>
            );
        }

        // Get status for the current value using the thresholds
        const currentStatus = getStatus(metricData.avg, metric);

        return (
            <div style={styles.summaryPanel}>
                <h5>{label}</h5>
                <p>{metricData.avg.toFixed(2)}</p>
                <p>Status: <span style={{
                    padding: '3px 8px',
                    borderRadius: '4px',
                    backgroundColor: getColor(metricData.avg, metric),
                    color: 'white'
                }}>{currentStatus}</span></p>
                {renderTrendIndicator?.(metricData.trend)}
            </div>
        );
    };

    // You can also add this helper function if not already present
    const getColor = (value, metric) => {
        const metricThresholds = thresholds[metric];
        if (!metricThresholds || value === null || value === undefined || isNaN(value)) {
            return "rgba(128, 128, 128, 0.5)"; // Gray color for unknown status
        }

        const threshold = metricThresholds.find(
            (range) => value >= range.min && value <= range.max
        );

        return threshold ? threshold.color : metricThresholds[metricThresholds.length - 1].color;
    };

    const fetchComparisonData = async () => {
        setComparisonData(null); // Clear chart
        try {
            const { range, first, second } = filters; // Removed location since we don't need it

            let firstDate = first.date;
            let secondDate = second.date;

            let firstStart, firstEnd, secondStart, secondEnd;

            // Set up date ranges for first period
            if (range === 'hour' && first.hour !== null) {
                firstStart = `${firstDate}T${first.hour}:00:00.000Z`;
                firstEnd = `${firstDate}T${first.hour}:59:59.999Z`;
            } else if (range === 'day') {
                firstStart = `${firstDate}T00:00:00.000Z`;
                firstEnd = `${firstDate}T23:59:59.999Z`;
            } else if (range === 'week') {
                firstStart = calculateStartDate(first.weekStart, range);
                firstEnd = calculateEndDate(first.weekStart, range);
            } else if (range === 'month') {
                const currentYear = new Date().getFullYear();
                const startDate = new Date(`${currentYear}-${first.month}-01`);
                firstStart = `${startDate.toISOString().split('T')[0]}T00:00:00.000Z`;
                const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
                firstEnd = `${endDate.toISOString().split('T')[0]}T23:59:59.999Z`;
            }

            // Set up date ranges for second period
            if (range === 'hour' && second.hour !== null) {
                secondStart = `${secondDate}T${second.hour}:00:00.000Z`;
                secondEnd = `${secondDate}T${second.hour}:59:59.999Z`;
            } else if (range === 'day') {
                secondStart = `${secondDate}T00:00:00.000Z`;
                secondEnd = `${secondDate}T23:59:59.999Z`;
            } else if (range === 'week') {
                secondStart = calculateStartDate(second.weekStart, range);
                secondEnd = calculateEndDate(second.weekStart, range);
            } else if (range === 'month') {
                const currentYear = new Date().getFullYear();
                const startDate = new Date(`${currentYear}-${second.month}-01`);
                secondStart = `${startDate.toISOString().split('T')[0]}T00:00:00.000Z`;
                const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
                secondEnd = `${endDate.toISOString().split('T')[0]}T23:59:59.999Z`;
            }

            // Fetch first period data
            const { data: firstData, error: firstError } = await supabaseWater
                .from('sensor_data')
                .select('*')
                .gte('timestamp', firstStart)
                .lt('timestamp', firstEnd);

            if (firstError) throw firstError;

            // Fetch second period data
            const { data: secondData, error: secondError } = await supabaseWater
                .from('sensor_data')
                .select('*')
                .gte('timestamp', secondStart)
                .lt('timestamp', secondEnd);

            if (secondError) throw secondError;

            if (!firstData.length || !secondData.length) {
                toast.warning('No data found for one or both ranges.');
                setComparisonData(null);
                return;
            }

            const comparisonResult = calculateComparison(firstData, secondData);
            setComparisonData(comparisonResult);
            toast.success('Comparison data fetched successfully.');
        } catch (error) {
            console.error('Error fetching comparison data:', error);
            toast.error('Error fetching comparison data.');
        }
    };

    // Remove fetchDataForTimeRange function as it's no longer needed

    // Helper function for calculating start date for 'month' and 'week'
    const calculateStartDate = (date, range) => {
        const startDate = new Date(date + 'T00:00:00+00:00');
        if (isNaN(startDate)) throw new RangeError('Invalid date value');

        if (range === 'week') {
            // For week, the start date is the given date
            return startDate.toISOString().replace('Z', '+00:00').split('.')[0]; // Ensure date is in yyyy-MM-ddTHH:mm:ss+00:00 format
        } else if (range === 'month') {
            startDate.setUTCDate(1);
        }

        return startDate.toISOString().replace('Z', '+00:00').split('.')[0]; // Ensure date is in yyyy-MM-ddTHH:mm:ss+00:00 format
    };

    const calculateEndDate = (date, range) => {
        const endDate = new Date(date + 'T23:59:59+00:00');
        if (isNaN(endDate)) throw new RangeError('Invalid date value');

        if (range === 'week') {
            // For week, the end date is 6 days after the given date
            endDate.setUTCDate(endDate.getUTCDate() + 6);
        } else if (range === 'month') {
            endDate.setUTCMonth(endDate.getUTCMonth() + 1);
            endDate.setUTCDate(0);
        }

        return endDate.toISOString().replace('Z', '+00:00').split('.')[0]; // Ensure date is in yyyy-MM-ddTHH:mm:ss+00:00 format
    };

    const calculateComparison = (firstData, secondData) => {
        const calculateMetric = (data, metric) => {
            const values = data.map((item) => item[metric]).filter((value) => value != null);
            const avg = values.length > 0 ? values.reduce((acc, val) => acc + val, 0) / values.length : NaN;
            const status = getStatus(avg, metric);
            return { avg, status };
        };

        const metrics = ['pH', 'temperature', 'tss', 'tds_ppm'];
        const firstResult = {};
        const secondResult = {};

        metrics.forEach((metric) => {
            firstResult[metric] = calculateMetric(firstData, metric);
            secondResult[metric] = calculateMetric(secondData, metric);
        });

        return { first: firstResult, second: secondResult };
    };

    const thresholds1 = {
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

    const Legend = ({ thresholds, metric }) => (
        <div
            style={{
                marginTop: "20px", // Space above each metric's container
                marginLeft: "15px",
                display: "flex",
                flexDirection: "column",
                gap: "15px", // Spacing between containers
                marginBottom: '20px',
            }}
        >
            {/* Metric Title */}
            <h3
                style={{
                    textAlign: "left", // Align title to the left
                    marginBottom: "5px", // Space below the title
                    color: "#fff", // Light color for the title text
                    fontSize: "1.2rem", // Adjusted font size for better readability
                }}
            >
                {metric.toUpperCase()} thresholds
            </h3>

            {/* Transparent Container for Threshold Items */}
            <div
                style={{
                    backgroundColor: "rgba(255, 255, 255, 0.1)", // Transparent background
                    padding: "15px", // Space inside the container
                    borderRadius: "10px", // Rounded corners
                    boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)", // Subtle shadow for depth
                    border: "1px solid rgba(255, 255, 255, 0.2)", // Border to define edges
                    marginRight: '15px',
                }}
            >
                <div
                    style={{
                        display: "flex", // Arrange threshold items horizontally
                        flexWrap: "wrap", // Allow wrapping
                        gap: "10px", // Space between items
                    }}
                >
                    {thresholds.map((threshold, index) => (
                        <div
                            key={index}
                            style={{
                                backgroundColor: threshold.color, // Background color for the threshold
                                padding: "8px 15px", // Inner spacing
                                border: 'none',
                                borderRadius: "10px", // Rounded corners for individual boxes
                                color: "#fff", // Text color for better contrast
                                textAlign: "center", // Center-align text
                                fontSize: "1rem", // Font size for text
                                // border: "solid black 0.3px", // Thin border for individual boxes
                            }}
                        >
                            {/* Threshold Label and Max Value */}
                            <strong style={{ fontSize: "1.1rem" }}>{threshold.label}</strong>:
                            <span style={{ fontSize: "0.9rem" }}> ≤ {threshold.max}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderComparisonChart = (comparisonData) => {
        const metrics = ["pH", "temperature", "tss", "tds_ppm"];

        // Default values when comparisonData is null or undefined
        const defaultData = {
            first: metrics.reduce((acc, metric) => ({ ...acc, [metric]: { avg: 0 } }), {}),
            second: metrics.reduce((acc, metric) => ({ ...acc, [metric]: { avg: 0 } }), {}),
        };

        const dataToUse = comparisonData || defaultData;
        const { first, second } = dataToUse;

        const getStatus = (value, metric) => {
            const threshold = thresholds1[metric]?.find((t) => value <= t.max);
            return threshold ? threshold.label : "Unknown";
        };

        const labels = metrics.map((metric) => metric.toUpperCase());
        const firstAverages = metrics.map((metric) => first[metric]?.avg || 0);
        const secondAverages = metrics.map((metric) => second[metric]?.avg || 0);

        const firstDateLabel = comparisonData ? formatDateLabel(filters.first) : "No Range Selected";
        const secondDateLabel = comparisonData ? formatDateLabel(filters.second) : "No Range Selected";

        const data = {
            labels,
            datasets: [
                {
                    label: `First Range: (${firstDateLabel})`,
                    data: firstAverages,
                    backgroundColor: firstAverages.map((value, index) =>
                        thresholds1[metrics[index]]?.find((t) => value <= t.max)?.color || "rgba(128, 128, 128, 0.5)"
                    ),
                    borderColor: "rgb(255, 255, 255)",
                    borderWidth: 3,
                },
                {
                    label: `Second Range: (${secondDateLabel})`,
                    data: secondAverages,
                    backgroundColor: secondAverages.map((value, index) =>
                        thresholds1[metrics[index]]?.find((t) => value <= t.max)?.color || "rgba(192, 192, 192, 0.5)"
                    ),
                    borderColor: "rgb(0, 0, 0)",
                    borderWidth: 3,
                },
            ],
        };

        const options = {
            maintainAspectRatio: false,
            responsive: true,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const metric = metrics[context.dataIndex];
                            const value = context.raw;
                            const status = getStatus(value, metric);
                            return `${context.dataset.label}: ${value} (${status})`;
                        },
                    },
                },
                legend: {
                    display: true,
                    position: "top",
                    labels: {
                        color: "#fff",
                        font: {
                            size: 14,
                            family: "Arial",
                        },
                    },
                },
            },
            scales: {
                x: {
                    grid: {
                        display: false,
                    },
                    ticks: {
                        color: "#fff",
                        font: {
                            size: 14,
                            family: "Verdana",
                        },
                    },
                },
                y: {
                    grid: {
                        display: false,
                    },
                    ticks: {
                        color: "#fff",
                        font: {
                            size: 14,
                            family: "Verdana",
                        },
                        beginAtZero: true,
                    },
                },
            },
            elements: {
                bar: {
                    borderRadius: 15,
                    borderWidth: 2,
                },
            },
            datasets: {
                bar: {
                    barPercentage: 0.95, // Adjust the width of the bars
                    categoryPercentage: 0.95, // Adjust the space between bars
                },
            },
        };

        const generateInsight = () => {
            if (!comparisonData) {
                return "No data available for comparison.";
            }

            return metrics.map((metric, index) => {
                const firstValue = firstAverages[index];
                const secondValue = secondAverages[index];
                const firstStatus = getStatus(firstValue, metric);
                const secondStatus = getStatus(secondValue, metric);

                return `${metric.toUpperCase()} - First Range (${firstStatus}): ${firstValue.toFixed(
                    2
                )}, Second Range (${secondStatus}): ${secondValue.toFixed(
                    2
                )}. ${firstValue > secondValue ? "Decreased" : "Increased"} between ranges.`;
            }).join("\n");
        };

        const narrativeInsight = generateInsight();

        return (
            <div style={{ display: "flex", flexDirection: "column", height: "70%" }}>
                <div style={{ flex: 1 }}>
                    <Bar data={data} options={options} height="100%" />
                </div>
                <div style={{ marginTop: "20px", color: "#fff", fontSize: "1rem", textAlign: "justify" }}>
                    <strong>Narrative Insight:</strong>
                    {comparisonData ? (
                        <pre style={{ textAlign: "justify", whiteSpace: "pre-wrap" }}>{narrativeInsight}</pre>
                    ) : (
                        " No data available for comparison."
                    )}
                </div>
            </div>
        );
    };

    const renderLegend = () => {
        const metrics = ["pH", "temperature", "tss", "tds_ppm"];
        return (
            <div style={{ marginTop: "30px" }}>
                {metrics.map((metric) => (
                    <Legend key={metric} thresholds={thresholds1[metric]} metric={metric} />
                ))}
            </div>
        );
    };

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const formatDateLabel = (filtersPart) => {
        if (filters.range === "month") {
            return filtersPart.month ? monthNames[parseInt(filtersPart.month) - 1] : "Unknown";
        } else if (filters.range === "hour") {
            const date = filtersPart.date || "Unknown";
            const hour = filtersPart.hour ? `${filtersPart.hour}:00` : "";
            return `${date} ${hour}`.trim();
        } else {
            return filtersPart.weekStart || filtersPart.date || "Unknown";
        }
    };

    const handleDateChange = (e, field, rangeType) => {
        const { value } = e.target;
        setFilters((prevFilters) => ({
            ...prevFilters,
            [rangeType]: { ...prevFilters[rangeType], [field]: value },
        }));
    };

    const [logs, setLogs] = useState([]);
    const [logFilters, setLogFilters] = useState({
        range: 'day',
        date: '',
        locationId: null,
    });

    const handleLogFiltersChange = (e) => {
        const { name, value } = e.target;

        let updatedValue = value;

        if (name === "date") {
            const date = new Date(value);
            // Format the date to include the time component and the correct time zone offset
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            updatedValue = date.toISOString().split("T")[0]; // Ensure date is in yyyy-MM-ddTHH:mm:ss+00:00 format
        }

        setLogFilters({ ...logFilters, [name]: updatedValue });
    };

    const logsContainerRef = useRef(null); // Add this near other state declarations

    const fetchLogs = async () => {
        const { range, date } = logFilters;

        // Validate inputs
        if (!date) {
            setLogsErrorMessage('Please select a date.');
            return;
        }

        setLogsErrorMessage('');

        let start, end;

        if (range === 'month') {
            const startDate = new Date(date);
            startDate.setDate(1);
            start = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-01T00:00:00.000Z`;
            const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
            end = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}T23:59:59.999Z`;
        } else {
            start = calculateStartDate(date, range);
            end = calculateEndDate(date, range);
        }

        const PAGE_SIZE = 100;
        let currentPage = 0;
        let hasMore = true;
        const allData = [];

        while (hasMore) {
            const { data, error } = await supabaseWater
                .from('sensor_data')
                .select('timestamp, pH, temperature, tss, tds_ppm')
                .gte('timestamp', start)
                .lt('timestamp', end)
                .range(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE - 1)
                .order('timestamp', { ascending: true });

            if (error) {
                console.error('Error fetching logs:', error);
                setLogsErrorMessage('An error occurred while fetching logs.');
                return;
            }

            if (!data || data.length === 0) {
                hasMore = false;
                break;
            }

            allData.push(...data);
            hasMore = data.length === PAGE_SIZE;
            currentPage++;
            await new Promise(resolve => setTimeout(resolve, 100)); // Delay to avoid rate limiting
        }

        if (allData.length === 0) {
            setLogsErrorMessage('No logs found for the selected date.');
            return;
        }

        generateLogs(allData);
        toast.success('Logs fetched successfully.');

        if (logsContainerRef.current) {
            logsContainerRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    };

    const generateLogs = (data) => {
        // Define what values are considered critical for each metric
        const isValueCritical = (value, metric) => {
            const metricThresholds = thresholds[metric];
            if (!metricThresholds || value === null || value === undefined || isNaN(value)) {
                return false;
            }

            // For each metric, find if the value is in an unacceptable range
            switch (metric) {
                case 'pH':
                    return value < 6.5 || value > 8.5;
                case 'temperature':
                    return value < 26 || value > 30;
                case 'tss':
                    return value > 50;
                case 'tds_ppm':
                    return value > 500;
                default:
                    return false;
            }
        };

        const getThresholdForValue = (value, metric) => {
            const metricThresholds = thresholds[metric];
            return metricThresholds.find(t => value >= t.min && value <= t.max) || metricThresholds[metricThresholds.length - 1];
        };

        const groupedLogs = {
            pH: [],
            temperature: [],
            tss: [],
            tds_ppm: [],
        };

        data.forEach((entry) => {
            ["pH", "temperature", "tss", "tds_ppm"].forEach((metric) => {
                const value = entry[metric];

                // Only log if the value is in a critical range
                if (isValueCritical(value, metric)) {
                    const threshold = getThresholdForValue(value, metric);
                    const timestamp = new Date(entry.timestamp).toLocaleString("en-US", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                        hour12: true, // Use 12-hour clock with AM/PM
                        timeZone: "UTC"
                    });

                    groupedLogs[metric].push({
                        metric,
                        value: value,
                        threshold: threshold.label,
                        color: threshold.color,
                        timestamp,
                    });
                }
            });
        });

        // Sort logs by timestamp
        Object.keys(groupedLogs).forEach((metric) => {
            groupedLogs[metric].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        });

        setLogs(groupedLogs);
    };

    useEffect(() => {
        // You can call fetchLogs here if you want it to run automatically when filters change
        fetchLogs();
    }, [logFilters]);


    return (
        <div style={styles.body}>
            {/* <Sidebar> */}
            <div style={styles.container}>
                <div style={styles.headerRow}>
                    <h1 style={styles.dashboardTitle}>Water Quality Dashboard</h1>
                    <button
                        style={styles.detailedWaterButton}
                        onMouseEnter={(e) => {
                            e.target.style.boxShadow = '0 0 15px 5px rgba(55, 237, 45, 0.8)'; // Apply glow on hover
                            e.target.style.transform = 'scale(1.05)'; // Slightly enlarge the button
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.boxShadow = ''; // Remove glow
                            e.target.style.transform = ''; // Reset size
                        }}
                        onClick={handleButtonClick} // Trigger navigation on button click
                    >
                        Detailed Data
                    </button>
                </div>
                <h2 style={styles.dashboardTitle2}>Unified Dashboard Analytics</h2>
                <div style={styles.summaryContainer}>


                    {/* SUMMARY AND ALERT LOG CONTAINER */}
                    <div style={styles.filtersContainer}>
                        <div style={styles.summaryFiltersContainer}>
                            {/* Title and Subtitle */}
                            <div style={styles.summaryHeaderRow}>
                                <h2 style={styles.summarySectionTitle}>Summary Log</h2>
                                <p style={styles.summarySectionSubtitle}>Select data range to show and compare summary log</p>
                            </div>
                            {/* Filters */}
                            <div style={styles.filtersRow}>
                                <label style={styles.summaryRangeText}>
                                    Range:
                                    <select
                                        name="range"
                                        value={summaryFilters.range}
                                        onChange={handleSummaryFiltersChange}
                                        style={styles.summaryRangeSelect2}
                                    >
                                        <option value="day">Days</option>
                                        <option value="week">Week</option>
                                        <option value="month">Month</option>
                                    </select>
                                </label>

                                {(summaryFilters.range === 'day') && (
                                    <>
                                        <label style={styles.summaryRangeText}>
                                            1st Date:
                                            <input
                                                type="date"
                                                name="date"
                                                value={summaryFilters.date}
                                                onChange={handleSummaryFiltersChange}
                                                style={styles.summaryRangeSelect}
                                            />
                                        </label>
                                        <label style={styles.summaryRangeText}>
                                            2nd Date:
                                            <input
                                                type="date"
                                                name="comparisonDate"
                                                value={summaryFilters.comparisonDate}
                                                onChange={handleSummaryFiltersChange}
                                                style={styles.summaryRangeSelect}
                                            />
                                        </label>
                                    </>
                                )}

                                {(summaryFilters.range === 'week') && (
                                    <>
                                        <label style={styles.summaryRangeText}>
                                            1st Date:
                                            <input
                                                type="date"
                                                name="date"
                                                value={summaryFilters.date}
                                                onChange={handleSummaryFiltersChange}
                                                style={styles.summaryRangeSelect}
                                            />
                                        </label>
                                        <label style={styles.summaryRangeText}>
                                            2nd Date:
                                            <input
                                                type="date"
                                                name="comparisonDate"
                                                value={summaryFilters.comparisonDate}
                                                onChange={handleSummaryFiltersChange}
                                                style={styles.summaryRangeSelect}
                                            />
                                        </label>
                                    </>
                                )}

                                {summaryFilters.range === 'month' && (
                                    <>
                                        <label style={styles.summaryRangeText}>
                                            1st Date:
                                            <select
                                                name="month"
                                                value={summaryFilters.month}
                                                onChange={handleSummaryFiltersChange}
                                                style={styles.summaryRangeSelect}
                                            >
                                                {monthNames.map((month, index) => (
                                                    <option key={index} value={index + 1}>
                                                        {month}
                                                    </option>
                                                ))}
                                            </select>
                                        </label>
                                        <label style={styles.summaryRangeText}>
                                            2nd Date:
                                            <select
                                                name="comparisonMonth"
                                                value={summaryFilters.comparisonMonth}
                                                onChange={handleSummaryFiltersChange}
                                                style={styles.summaryRangeSelect}
                                            >
                                                {monthNames.map((month, index) => (
                                                    <option key={index} value={index + 1}>
                                                        {month}
                                                    </option>
                                                ))}
                                            </select>
                                        </label>
                                    </>
                                )}

                                <button style={styles.fetchButton} onClick={fetchData}>
                                    Fetch Data
                                </button>
                            </div>

                            {/* Summary */}
                            <div style={styles.summaryMessage}>
                                {summaryErrorMessage ? (
                                    <div style={{ color: "red" }}>{summaryErrorMessage}</div>
                                ) : Object.keys(summary).length > 0 ? (
                                    <div style={{ display: "flex", gap: "20px" }}>
                                        {/* Loop through all available metrics */}
                                        {["pH", "temperature", "tss", "tds_ppm"].map((metric) => {
                                            const metricSummary = summary[metric];
                                            // Render metric summary if needed
                                        })}
                                    </div>
                                ) : (
                                    <p style={styles.paragraph}>No summary available for the selected filters.</p>
                                )}
                            </div>
                        </div>

                        {/* Alert Filters */}
                        <div style={styles.alertFiltersContainer}>
                            {/* Header Row */}
                            <div style={styles.alertHeaderRow}>
                                <h2 style={styles.alertSectionTitle}>Alert Log</h2>
                                <p style={styles.alertSectionSubtitle}>Select data range to show metrics log</p>
                            </div>

                            {/* Filters Row */}
                            <div style={styles.filtersRow}>
                                <label style={styles.alertRangeText}>
                                    Range:
                                    <select
                                        name="range"
                                        value={logFilters.range}
                                        onChange={handleLogFiltersChange}
                                        style={styles.alertRangeSelect2}
                                    >
                                        <option value="day">Days</option>
                                        <option value="week">Week</option>
                                        <option value="month">Month</option>
                                    </select>
                                </label>
                                <label style={styles.alertRangeText}>
                                    Date:
                                    <input
                                        type="date"
                                        name="date"
                                        value={logFilters.date}
                                        onChange={handleLogFiltersChange}
                                        style={styles.alertRangeSelect}
                                    />
                                </label>
                                {/* <label style={styles.alertRangeText}>
                                    Location:
                                    <select
                                        name="locationId"
                                        value={logFilters.locationId || ""}
                                        onChange={handleLogFiltersChange}
                                        style={styles.alertRangeSelect}
                                    >
                                        <option value="" disabled>
                                            Select area
                                        </option>
                                        {locations.map((location) => (
                                            <option key={location.id} value={location.id}>
                                                {location.name}
                                            </option>
                                        ))}
                                    </select>
                                </label> */}
                                <button style={styles.fetchButton} onClick={fetchLogs}>
                                    Fetch Logs
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                <div className={`location-panels ${transitionDirection === 'left' ? 'left' : 'right'}`}
                    onAnimationEnd={() => setIsTransitioning(false)} // Reset isTransitioning after animation ends
                    style={styles.locationPanels}
                >
                    <div style={styles.locationPanel}>
                        <h3 style={styles.locationTitle}>Water Quality Summary</h3>
                        <div style={styles.summaryPanels}>
                            {renderSummaryPanel('pH', 'pH', summary)}
                            {renderSummaryPanel('temperature', 'TEMPERATURE', summary)}
                            {renderSummaryPanel('tss', 'TSS', summary)}
                            {renderSummaryPanel('tds_ppm', 'TDS', summary)}
                        </div>
                    </div>
                </div>
                <div style={styles.comparisonContainer}>
                    {/* Comparison Chart Filters */}
                    <div style={styles.containerFilterBox}>
                        <h3 style={styles.sectionTitle}>Comparison Chart Selection</h3>
                        {/* Location Filter */}
                        {/* <div>
                            <label style={styles.comparisonLabel}>Select Location: </label>
                            <select
                                value={filters.location}
                                onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                                style={styles.rangeSelect}
                            >
                                <option value="">Select a location</option>
                                {filters.range && locations.length > 0
                                    ? locations.map((location) => (
                                        <option key={location.id} value={location.id}>
                                            {location.name}
                                        </option>
                                    ))
                                    : null}
                            </select>
                        </div> */}
                        {/* Range selection */}
                        <div>
                            <label style={styles.comparisonLabel}>Select Filter:</label>
                            <select
                                value={filters.range}
                                onChange={(e) => setFilters({ ...filters, range: e.target.value })}
                                style={styles.rangeSelect}
                            >
                                <option value="hour">Hour</option>
                                <option value="day">Day</option>
                                <option value="week">Week</option>
                                <option value="month">Month</option>
                            </select>
                        </div>


                        {/* Week Range */}
                        {filters.range === 'week' && (
                            <div >
                                <div>
                                    <label style={styles.comparisonLabel}>First Starting Week Date:</label>
                                    <input
                                        type="date"
                                        value={filters.first.weekStart}
                                        onChange={(e) => handleDateChange(e, 'weekStart', 'first')}
                                        style={styles.rangeSelect}

                                    />
                                </div>
                                <div>
                                    <label style={styles.comparisonLabel}>Second Starting Week Date:</label>
                                    <input
                                        type="date"
                                        value={filters.second.weekStart}
                                        onChange={(e) => handleDateChange(e, 'weekStart', 'second')}
                                        style={styles.rangeSelect}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Month Range */}
                        {filters.range === 'month' && (
                            <div>
                                <div>
                                    <label style={styles.comparisonLabel}>First Month:</label>
                                    <select
                                        value={filters.first.month}
                                        onChange={(e) =>
                                            setFilters({
                                                ...filters,
                                                first: { ...filters.first, month: e.target.value },
                                            })
                                        }
                                        style={styles.rangeSelect}
                                    >
                                        <option value="01">January</option>
                                        <option value="02">February</option>
                                        <option value="03">March</option>
                                        <option value="04">April</option>
                                        <option value="05">May</option>
                                        <option value="06">June</option>
                                        <option value="07">July</option>
                                        <option value="08">August</option>
                                        <option value="09">September</option>
                                        <option value="10">October</option>
                                        <option value="11">November</option>
                                        <option value="12">December</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={styles.comparisonLabel}>Second Month:</label>
                                    <select
                                        value={filters.second.month}
                                        onChange={(e) =>
                                            setFilters({
                                                ...filters,
                                                second: { ...filters.second, month: e.target.value },
                                            })
                                        }
                                        style={styles.rangeSelect}
                                    >
                                        <option value="01">January</option>
                                        <option value="02">February</option>
                                        <option value="03">March</option>
                                        <option value="04">April</option>
                                        <option value="05">May</option>
                                        <option value="06">June</option>
                                        <option value="07">July</option>
                                        <option value="08">August</option>
                                        <option value="09">September</option>
                                        <option value="10">October</option>
                                        <option value="11">November</option>
                                        <option value="12">December</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        {/* Day/Hour Range */}
                        {(filters.range === 'hour' || filters.range === 'day') && (
                            <div>
                                <div>
                                    <label style={styles.comparisonLabel} htmlFor="first-date">First Date:</label>
                                    <input
                                        type="date"
                                        id="first-date"
                                        value={filters.first.date}
                                        onChange={(e) =>
                                            handleDateChange(e, 'date', 'first')
                                        }
                                        style={styles.rangeSelect}
                                    />
                                    {filters.range === 'hour' && (
                                        <>
                                            <label style={styles.comparisonLabel} htmlFor="first-hour">First Hour:</label>
                                            <select
                                                id="first-hour"
                                                value={filters.first.hour || ''}
                                                onChange={(e) =>
                                                    setFilters({
                                                        ...filters,
                                                        first: { ...filters.first, hour: e.target.value ? parseInt(e.target.value, 10) : null },
                                                    })
                                                }
                                                style={styles.rangeSelect}
                                            >
                                                <option value="">Select Hour</option>
                                                {Array.from({ length: 24 }, (_, i) => (
                                                    <option key={i} value={i}>
                                                        {i}:00
                                                    </option>
                                                ))}
                                            </select>
                                        </>
                                    )}
                                </div>
                                <div>
                                    <label style={styles.comparisonLabel}>Second Date:</label>
                                    <input
                                        type="date"
                                        id="second-date"
                                        value={filters.second.date}
                                        onChange={(e) =>
                                            handleDateChange(e, 'date', 'second')
                                        }
                                        style={styles.rangeSelect}
                                    />
                                    {filters.range === 'hour' && (
                                        <>
                                            <label style={styles.comparisonLabel} htmlFor="second-hour">Second Hour:</label>
                                            <select
                                                id="second-hour"
                                                value={filters.second.hour || ''}
                                                onChange={(e) =>
                                                    setFilters({
                                                        ...filters,
                                                        second: { ...filters.second, hour: e.target.value ? parseInt(e.target.value, 10) : null },
                                                    })
                                                }
                                                style={styles.rangeSelect}
                                            >
                                                <option value="">Select Hour</option>
                                                {Array.from({ length: 24 }, (_, i) => (
                                                    <option key={i} value={i}>
                                                        {i}:00
                                                    </option>
                                                ))}
                                            </select>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                        {/* Comparison Button */}
                        <button style={styles.button} onClick={fetchComparisonData}>Compare</button>
                    </div>
                    <div style={styles.renderComparisonBox}>
                        {/* Header Title and Subtitle */}
                        <div style={styles.comparisonChartHeader}>
                            <h2 style={styles.comparisonChartTitle}>Comparison Chart</h2>
                            <p style={styles.comparisonChartSubtitle}>
                                This chart displays a comparison between two selected datasets over time
                            </p>
                        </div>

                        {/* Render Comparison Chart */}
                        {renderComparisonChart(comparisonData)}
                    </div>
                </div>
                <div style={styles.thresholdLegendDiv}>
                    <div style={styles.thresholdHeader}>
                        <h3 style={styles.thresholdTitle}>Data Thresholds</h3>
                        <p style={styles.thresholdSubtitle}>
                            Scale of the various data levels for water monitoring
                        </p>
                    </div>
                    {renderLegend()}
                </div>

                {/* Alert Log with Time Log Container */}
                <div
                    ref={logsContainerRef}
                    style={styles.alertLogsContainer}
                >
                    <div style={styles.alertLogHeader}>
                        <h2 style={styles.alertLogTitle}>Alert Logs:</h2>
                        <span style={styles.alertLogSubtitle}>Shows metric log with threshold</span>
                    </div>

                    {/* Logs */}
                    {logsErrorMessage ? (
                        <div
                            style={{
                                color: 'red',
                                fontWeight: 'bold',
                                marginBottom: '15px',
                                marginLeft: '15px',
                            }}
                        >
                            {logsErrorMessage}
                        </div>
                    ) : Object.keys(logs).length > 0 ? (
                        <div style={styles.metricContainer}>
                            {/* Loop through all available metrics, including tds_ppm */}
                            {["pH", "temperature", "tss", "tds_ppm"].map((metric) => {
                                const metricLogs = logs[metric];
                                return (
                                    <div
                                        style={styles.metricBlock}
                                        key={metric}

                                    >
                                        <div style={styles.metricTitle}></div>
                                        <h3>{metric.toUpperCase()}</h3>
                                        {metricLogs?.length > 0 ? (
                                            <div
                                                style={{
                                                    height: "100%",
                                                    maxHeight: "400px",
                                                    overflowY: "auto",
                                                }}
                                            >
                                                <ul style={{ margin: 0, padding: 0, listStyle: 'none', textAlign: 'left' }}>
                                                    {/* Render each log for the metric */}
                                                    {metricLogs.map((log, index) => (
                                                        <li
                                                            key={index}
                                                            style={{
                                                                padding: '10px 0',
                                                                borderBottom: index < metricLogs.length - 1 ? '1px solid #ddd' : 'none'
                                                            }}
                                                        >
                                                            <strong>{log.metric.toUpperCase()}</strong> reached <strong>{log.value.toFixed(2)}</strong>{" "}
                                                            <em
                                                                style={{
                                                                    backgroundColor: log.color,
                                                                    color: 'white',
                                                                    borderRadius: '8px',
                                                                    padding: '2px 6px',
                                                                    fontWeight: 'bolder',
                                                                }}
                                                            >
                                                                {log.threshold}
                                                            </em>{" "}
                                                            at {log.timestamp}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ) : (
                                            <p>No critical levels detected for {metric.toUpperCase()}.</p>
                                        )}
                                    </div >
                                    // </div>
                                );
                            })}
                        </div >
                    ) : (
                        <p>No logs available for the selected filters.</p>
                    )}
                </div >



                <ToastContainer />
            </div >
            {/* </Sidebar > */}
        </div >
    );
};

const styles = {
    body: {
        backgroundColor: '#000000',
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        minHeight: '100vh',
        // padding: '20px',
        boxSizing: 'border-box',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        overflowX: 'hidden', // Prevent horizontal scroll
    },


    // DASHBOARD CONTAINER TRANSPARENT
    container: {
        marginTop: '20px',
        marginLeft: '70px',
        marginRight: 'auto',
        width: '100%',
        maxWidth: '1440px', // Restrict to a maximum width for large screens
        backgroundColor: 'rgba(15, 13, 26, 0)',
        padding: '20px 0 0 20px',
    },

    // WATER DASHBOARD TEXTS
    dashboardTitle: {
        fontSize: '3rem',
        fontWeight: 'bold',
        marginLeft: '10px',
        color: '#fff',
        marginTop: '-20px',
    },
    dashboardTitle2: {
        fontSize: '1.3rem',
        fontWeight: '100',
        marginBottom: '25px',
        marginLeft: '10px',
        color: '#fff',
    },

    // HEADER ROW FOR TITLE AND BUTTON
    headerRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
    },

    // BUTTON STYLE
    detailedWaterButton: {
        padding: '10px 20px',
        background: 'linear-gradient(50deg, #007a74, #04403d)', // Gradient background
        color: '#fff',
        border: 'none',
        borderRadius: '15px',
        cursor: 'pointer',
        fontSize: '1rem',
        marginLeft: '20px', // Space between title and button
        transition: 'box-shadow 0.3s ease, transform 0.3s ease', // Smooth transition for glow and scale
    },
    // BUTTON HOVER STYLE (Glow effect)
    detailedWaterButtonHover: {
        boxShadow: '0 0 15px 5px rgba(0, 198, 255, 0.8)', // Glowing effect
        transform: 'scale(1.05)', // Slightly enlarges the button
    },

    // SUMMARY CONTAINER CONTENT
    filtersContainer: {
        display: 'flex',
        justifyContent: 'space-between',
        gap: '20px',
        marginBottom: '20px',
    },
    summaryFiltersContainer: {
        marginTop: '20px',
        padding: '20px',
        width: '870px',
        height: 'auto', // Adjust to auto height based on content
        backgroundColor: 'rgba(242, 242, 242, 0.1)',
        borderRadius: '15px',
        boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        color: '#fff',
        textAlign: 'center',
    },
    summaryHeaderRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px',
    },
    summarySectionTitle: {
        fontSize: '1.8rem',
        color: '#fff',
        margin: '0',
    },
    summarySectionSubtitle: {
        fontSize: '1rem',
        color: 'rgba(255, 255, 255, 0.8)',
        margin: '0',
    },
    filtersRow: {
        display: 'flex',
        justifyContent: 'left',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '5px',
        flexWrap: 'wrap', // Wrap content on smaller screens
    },
    summaryRangeText: {
        color: '#fff',
        fontSize: '1rem',
        marginRight: '5px',
        // margin: '0 5px',
        // justifyContent: 'left',
    },
    summaryRangeSelect: {
        marginLeft: '5px',
        padding: '10px 5px',
        borderRadius: '5px',
        backgroundColor: 'rgba(6, 68, 69)',
        color: '#fff',
        border: 'none',
        outline: 'none',
        textAlign: 'left',
        justifyContent: 'center',
        width: '110px',
        fontSize: '14px',
        // marginRight: '1px',
    },
    summaryRangeSelect2: {
        marginLeft: '5px',
        marginBottom: '1px',
        fontSize: '14px',
        padding: '10px 0px',
        borderRadius: '5px',
        backgroundColor: 'rgb(6, 68, 69)',
        color: '#fff',
        border: 'none',
        outline: 'none',
        textAlign: 'left',
        justifyContent: 'center',
        width: '65px',
    },
    summaryMessage: {
        marginTop: '20px',
        textAlign: 'center',
    },
    paragraph: {
        fontSize: '1rem',
        color: '#fff',
        marginTop: '15px', // Added margin-top for spacing between the paragraph and the buttons
        textAlign: 'center', // Centered text for the paragraph
    },


    //RENDERED SUMMARY CONTAINER LEFT & RIGHT
    locationPanels: {
        display: 'flex',
        flexWrap: 'wrap', // Wrap panels for smaller screens
        gap: '20px',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0)',
        marginBottom: '30px',
        color: 'black',
    },
    locationPanel: {
        flex: '1 1 calc(33.333% - 20px)', // Three columns on larger screens
        padding: '15px',
        borderRadius: '20px',
        boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)',
        textAlign: 'center',
        transition: 'transform 0.5s ease-in-out',
        backgroundColor: 'rgba(242, 242, 242, 0.1)',
        marginBottom: '20px'
    },
    left: {
        transform: 'translateX(-100%)',
    },
    right: {
        transform: 'translateX(100%)',
    },
    locationPanelHover: {
        transform: 'scale(1.05)', // Hover effect for panels
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
    },
    locationTitle: {
        fontSize: '1.7rem',
        fontWeight: 'bold',
        marginBottom: '20px',
        color: "#fff"
    },
    summaryPanels: {
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '10px',
        color: 'white',
    },
    summaryPanel: {
        flex: '1 1 calc(45% - 10px)', // Two panels per row
        backgroundColor: 'rgb(8, 102, 97, 0.46)',
        padding: '20px',
        paddingLeft: '25px',
        borderRadius: '25px',
        textAlign: 'left', // Align text to the left instead of center
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
    },


    // ALERT LOGS CONTAINER CONTENT
    alertFiltersContainer: {
        marginTop: '20px',
        padding: '20px',
        width: '870px',
        height: 'auto', // Adjust to auto height based on content
        backgroundColor: 'rgba(242, 242, 242, 0.1)', // Semi-transparent background
        borderRadius: '15px',
        boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)', // Slight shadow
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        color: '#fff',
        textAlign: 'center',
    },
    alertHeaderRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px',
    },
    alertSectionTitle: {
        fontSize: '1.8rem',
        color: '#fff',
        margin: '0',
    },
    alertSectionSubtitle: {
        fontSize: '1rem',
        color: 'rgba(255, 255, 255, 0.8)',
        margin: '0',
    },
    alertRangeText: {
        color: '#fff',
        fontSize: '1rem',
        marginRight: '5px',
    },
    alertRangeSelect: {
        marginLeft: '7px',
        padding: '10px 5px',
        borderRadius: '5px',
        backgroundColor: 'rgb(6, 68, 69)',
        color: '#fff',
        border: 'none',
        outline: 'none',
        width: '110px',
        fontSize: '14px',
    },
    alertRangeSelect2: {
        marginLeft: '7px',
        padding: '10px 5px',
        borderRadius: '5px',
        backgroundColor: 'rgb(6, 69, 65)',
        color: '#fff',
        border: 'none',
        outline: 'none',
        width: '75px',
        fontSize: '14px',
    },
    fetchButton: {
        padding: '10px 20px',
        marginLeft: '13px',
        backgroundColor: '#007a74',
        color: '#fff',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        fontSize: '1rem',
    },


    // COMPARISON ROW
    comparisonContainer: {
        display: 'flex',
        flexWrap: 'nowrap', // Keep layout inline
        gap: '20px',
        marginBottom: '20px',
    },
    containerFilterBox: {
        flex: '1 1 calc(30% - 20px)', // Smaller width
        padding: '15px',
        height: '740px',
        backgroundColor: 'rgba(242, 242, 242, 0.1)',
        borderRadius: '20px',
        boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        // justifyContent: 'space-between',
        marginTop: '-30px',
    },
    sectionTitle: {
        fontSize: '1.8rem',
        // fontWeight: 'bold',
        marginBottom: '30px',
        marginTop: '15px',
        marginLeft: '5px',
        color: '#fff',
    },
    comparisonLabel: {
        fontSize: '1rem',
        fontWeight: 'normal',
        color: '#fff', // White text color
        marginTop: '-20px',
        marginBottom: '5px',
        marginRight: '10px',
        marginLeft: '25px',
        display: 'block', // Ensures proper spacing for block labels
        paddingTop: '10px'
    },
    rangeSelect: {
        padding: '15px',
        display: 'block',
        borderRadius: '10px',
        marginBottom: '20px',
        marginLeft: '25px',
        backgroundColor: 'rgb(6, 68, 69)',
        color: "#fff",
        border: 'none',
    },


    // COMPARISON RENDERED CHART 
    renderComparisonBox: {
        flex: '1 1 calc(70% - 20px)', // Larger width
        padding: '15px',
        backgroundColor: 'rgba(242, 242, 242, 0.1)',
        borderRadius: '20px',
        boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        height: '740px',
        flexDirection: 'column',
        // justifyContent: 'space-between',
        marginTop: '-30px',
    },
    comparisonChartHeader: {
        display: 'flex',
        justifyContent: 'space-between', // Ensures title is on the left and subtitle on the right
        alignItems: 'center',
        // marginBottom: '20px',
    },
    comparisonChartTitle: {
        color: '#fff',
        fontSize: '1.8rem',
        // fontWeight: 'bold',
        marginBottom: '20px',
        marginLeft: '15px',
        textAlign: 'left', // Align title to the left
        flex: 1,
    },
    comparisonChartSubtitle: {
        color: '#ddd',
        fontSize: '1rem',
        marginTop: '20px',
        marginRight: '15px',
        textAlign: 'right', // Align subtitle to the right
        flex: 1,
    },


    // DATA THRESHOLD CONTAINER STYLE
    thresholdLegendDiv: {
        backgroundColor: 'rgba(242, 242, 242, 0.1)',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
        padding: '15px 20px', // Adjust padding for better spacing
        borderRadius: '20px',
    },
    thresholdHeader: {
        display: 'flex',
        justifyContent: 'space-between', // Align title and subtitle in a row
        alignItems: 'center', // Center vertically
        marginBottom: '10px', // Space between header and legend
    },
    thresholdTitle: {
        color: '#fff',
        fontSize: '1.8rem',
        // fontWeight: 'bold',  
        margin: 0,
        marginTop: '15px',
        marginLeft: '15px',
    },
    thresholdSubtitle: {
        color: '#ddd',
        fontSize: '1rem',
        margin: 0,
        marginTop: '15px',
        marginRight: '15px',
        paddingLeft: '10px', // Optional spacing between title and subtitle
    },


    // RENDERED ALERT LOG WITH TIME LOG
    alertLogsContainer: {
        marginTop: '20px', // Add space above the container
        padding: '15px', // Internal spacing
        backgroundColor: 'rgba(242, 242, 242, 0.1)', // Semi-transparent light background
        borderRadius: '20px', // Rounded corners for aesthetics
        boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)', // Subtle shadow for depth
    },
    alertLogHeader: {
        display: 'flex', // Align title and subtitle horizontally
        justifyContent: 'space-between', // Space between title and subtitle
        alignItems: 'center', // Vertically align items in the center
        marginBottom: '30px', // Add space between the header and the logs
    },
    alertLogTitle: {
        fontSize: '1.8rem', // Adjust font size for better readability
        color: '#fff', // Set text color to white
        margin: 0, // Remove margin for tighter layout
        marginTop: '15px',
        marginLeft: '15px',
    },
    alertLogSubtitle: {
        fontSize: '1rem', // Adjust subtitle size for readability
        color: '#fff', // Set text color to white
        // fontStyle: 'italic', // Make subtitle italic for distinction
        fontWeight: '100',
        marginTop: '15px',
        marginRight: '15px', // Margin to the right to give spacing
        textAlign: 'right', // Align subtitle to the right
    },
    metricContainer: {
        display: 'grid', // Use grid to arrange metrics in rows
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', // Responsive grid with min width for each metric block
        gap: '20px', // Add space between the grid items
        color: '#000',
        // backgroundColor: 'rgba(, 0.1)',
        textAlign: 'center',
    },
    metricBlock: {
        // border: "1px solid #ccc", 
        padding: "10px",
        borderRadius: '20px',
        backgroundColor: "rgb(39, 92, 88, 0.46)",
        color: "#fff",
        height: "500px", // Set fixed height for each metric block
        overflowY: "auto", // Enable vertical scrolling if content overflows
        textAlign: "center",
    },
    metricTitle: {
        backgroundColor: 'rgb(0, 122, 116)',
        height: '40px',
        width: '235px',
        marginBottom: '-38px',
        marginLeft: '38px',
        borderRadius: '20px',
    },



    button: {
        marginBottom: '15px',
        // marginLeft: '40px',
        display: 'inline-block',
        padding: '10px 20px',
        backgroundColor: '#007a74',
        color: '#ffffff',
        borderRadius: '10px',
        border: 'none',
        fontWeight: 'bold',
        textAlign: 'center',
        cursor: 'pointer',
        transition: 'background-color 0.3s',
        marginLeft: '15px',
        marginRight: '15px'
    },
    buttonHover: {
        backgroundColor: '#0056b3',
    },
    '@media (max-width: 768px)': {
        locationPanel: {
            flex: '1 1 calc(50% - 10px)', // Two columns on tablets
        },
        flexItem: {
            flex: '1 1 100%', // Full-width flex items
        },
    },
    '@media (max-width: 480px)': {
        locationPanel: {
            flex: '1 1 100%', // One column on mobile
        },
        button: {
            fontSize: '14px',
        },
    },
    '@media (min-width: 768px)': {
        comparisonContainer: {
            flexWrap: 'nowrap',
        }
    }
};


export default WaterDashboard;