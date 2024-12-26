import React, { useEffect, useState, useRef } from 'react';
import axiosClient from './axiosClient';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Bar } from 'react-chartjs-2';
import { useNavigate } from 'react-router-dom';
// import Sidebar from '../../Sidebar';
import backgroundImage from '../../../assets/soildash.png';
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
import InfoIcon from '@mui/icons-material/Info';

// Register chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);



const SoilDashboard = () => {
    const [soilData, setSoilData] = useState([]);
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
    const [showComparisonTooltip, setShowComparisonTooltip] = useState(false);

    const handleComparisonTooltipToggle = () => {
        setShowComparisonTooltip(!showComparisonTooltip);
    };

    const renderComparisonTooltipContent = () => {
        return (
            <div>
                <h4 style={{...styles.tooltipHeader, marginBottom: '20px'}}>Soil Quality Thresholds</h4>
                <table style={styles.tooltipTable}>
                    <thead>
                        <tr>
                            <th style={styles.tooltipTableHeader}>Category</th>
                            <th style={{ ...styles.tooltipTableHeader, width: '11%'}}>Soil Moisture</th>
                            <th style={{ ...styles.tooltipTableHeader, width: '12%'}}>Temperature</th>
                            <th style={styles.tooltipTableHeader}>Humidity</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style={{ ...styles.tooltipTableCell, backgroundColor: "rgba(232, 44, 4, 1)", color: "#fff" }}>Dry</td>
                            <td style={styles.tooltipTableCell}>0 - 19.99</td>
                            <td style={styles.tooltipTableCell}>-∞ - 4.99</td>
                            <td style={styles.tooltipTableCell}>0 - 29.99</td>
                        </tr>
                        <tr>
                            <td style={{ ...styles.tooltipTableCell, backgroundColor: "rgba(250, 196, 62, 1)", color: "#fff" }}>Low Moisture</td>
                            <td style={styles.tooltipTableCell}>20 - 39.99</td>
                            <td style={styles.tooltipTableCell}>5 - 14.99</td>
                            <td style={styles.tooltipTableCell}>30 - 49.99</td>
                        </tr>
                        <tr>
                            <td style={{ ...styles.tooltipTableCell, backgroundColor: "rgba(154, 205, 50, 1)", color: "#fff" }}>Optimal</td>
                            <td style={styles.tooltipTableCell}>40 - 70.99</td>
                            <td style={styles.tooltipTableCell}>15 - 29.99</td>
                            <td style={styles.tooltipTableCell}>50 - 70.99</td>
                        </tr>
                        <tr>
                            <td style={{ ...styles.tooltipTableCell, backgroundColor: "rgba(230, 126, 14, 1)", color: "#fff" }}>Saturated</td>
                            <td style={styles.tooltipTableCell}>71 - 100</td>
                            <td style={styles.tooltipTableCell}>30 - 34.99</td>
                            <td style={styles.tooltipTableCell}>71 - 85.99</td>
                        </tr>
                        <tr>
                            <td style={{ ...styles.tooltipTableCell, backgroundColor: "rgba(140, 1, 4, 1)", color: "#fff" }}>Waterlogged</td>
                            <td style={styles.tooltipTableCell}>101 - ∞</td>
                            <td style={styles.tooltipTableCell}>35 - ∞</td>
                            <td style={styles.tooltipTableCell}>86 - ∞</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        );
    };

    //BUTTON NAVIGATION TO SOIL DETAILED DATA
    const navigate = useNavigate();

    const handleButtonClick = () => {
        // Navigate to the desired route when the button is clicked
        navigate('/soil-quality'); // Change '/detailed-data' to the route you want
    };

    const locations = [
        { id: 1, name: 'Lapasan' },
        { id: 2, name: 'Agusan' },
        { id: 3, name: 'USTP-CDO' },
        { id: 4, name: 'El Salvador' },
        { id: 5, name: 'Sports Complex' },
    ];

    const thresholds = {
        soil_moisture: [
            { min: 0, max: 19.99, label: "Dry", color: "rgba(159, 109, 199, 1)" }, // Poor
            { min: 20, max: 39.99, label: "Low Moisture", color: "rgba(250, 196, 62, 1)" }, // Warning
            { min: 40, max: 70.99, label: "Optimal", color: "rgba(154, 205, 50, 1)" }, // Good
            { min: 71, max: 100, label: "Saturated", color: "rgba(230, 126, 14, 1)" }, // Caution
            { min: 101, max: Infinity, label: "Waterlogged", color: "rgba(199, 46, 46, 1)" }, // Emergency
        ],
        temperature: [
            { min: -Infinity, max: 4.99, label: "Cold", color: "rgba(199, 46, 46, 1)" }, // Poor
            { min: 5, max: 14.99, label: "Cool", color: "rgba(250, 196, 62, 1)" }, // Warning
            { min: 15, max: 29.99, label: "Optimal", color: "rgba(154, 205, 50, 1)" }, // Good
            { min: 30, max: 34.99, label: "Warm", color: "rgba(250, 196, 62, 1)" }, // Caution
            { min: 35, max: Infinity, label: "Hot", color: "rgba(159, 109, 199, 1)" }, // Danger
        ],
        humidity: [
            { min: 0, max: 29.99, label: "Dry", color: "rgba(159, 109, 199, 1)" }, // Poor
            { min: 30, max: 49.99, label: "Low Humidity", color: "rgba(250, 196, 62, 1)" }, // Warning
            { min: 50, max: 70.99, label: "Optimal", color: "rgba(154, 205, 50, 1)" }, // Good
            { min: 71, max: 85.99, label: "High Humidity", color: "rgba(230, 126, 14, 1)" }, // Caution
            { min: 86, max: Infinity, label: "Waterlogged", color: "rgba(199, 46, 46, 1)" }, // Emergency
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

    const getDatesInRange = (startDate, endDate) => {
        const dates = [];
        let currentDate = new Date(startDate);
        const lastDate = new Date(endDate);

        while (currentDate <= lastDate) {
            dates.push(currentDate.toISOString().split('T')[0]);
            currentDate.setDate(currentDate.getDate() + 1);
        }
        return dates;
    };

    const fetchPaginatedData = async (date) => {
        let allData = [];
        let offset = 0;
        const limit = 350;
        let hasMore = true;

        while (hasMore) {
            try {
                const response = await axiosClient.get('', {
                    params: {
                        date,
                        limit,
                        offset
                    }
                });

                const data = response.data;
                if (!data || data.length === 0) {
                    hasMore = false;
                    break;
                }

                allData = [...allData, ...data];
                offset += limit;

                // If we got fewer records than the limit, we've reached the end
                if (data.length < limit) {
                    hasMore = false;
                }
            } catch (error) {
                console.error(`Error fetching data for date ${date}, offset ${offset}:`, error);
                throw error;
            }
        }

        return allData;
    };

    const fetchData = async () => {
        try {
            const { date, comparisonDate, range } = summaryFilters;

            if (date === comparisonDate) {
                toast.error('Main date range and comparison date range should be different.');
                return;
            }

            let mainData = [], comparisonData = [];

            if (range === 'day') {
                // Fetch all data for both dates with pagination
                [mainData, comparisonData] = await Promise.all([
                    fetchPaginatedData(date),
                    fetchPaginatedData(comparisonDate)
                ]);

            } else if (range === 'week') {
                // For week range, fetch 7 days worth of data for both ranges
                const mainStartDate = new Date(date);
                const mainEndDate = new Date(mainStartDate);
                mainEndDate.setDate(mainEndDate.getDate() + 6);

                const compStartDate = new Date(comparisonDate);
                const compEndDate = new Date(compStartDate);
                compEndDate.setDate(compEndDate.getDate() + 6);

                const mainDates = getDatesInRange(mainStartDate, mainEndDate);
                const compDates = getDatesInRange(compStartDate, compEndDate);

                // Fetch data for each date in both ranges
                const [mainResults, compResults] = await Promise.all([
                    Promise.all(mainDates.map(d => fetchPaginatedData(d))),
                    Promise.all(compDates.map(d => fetchPaginatedData(d)))
                ]);

                mainData = mainResults.flat();
                comparisonData = compResults.flat();

            } else if (range === 'month') {
                // For month range, fetch entire month's data
                const mainMonth = new Date(date);
                const compMonth = new Date(comparisonDate);

                const mainStartDate = new Date(mainMonth.getFullYear(), mainMonth.getMonth(), 1);
                const mainEndDate = new Date(mainMonth.getFullYear(), mainMonth.getMonth() + 1, 0);

                const compStartDate = new Date(compMonth.getFullYear(), compMonth.getMonth(), 1);
                const compEndDate = new Date(compMonth.getFullYear(), compMonth.getMonth() + 1, 0);

                const mainDates = getDatesInRange(mainStartDate, mainEndDate);
                const compDates = getDatesInRange(compStartDate, compEndDate);

                const [mainResults, compResults] = await Promise.all([
                    Promise.all(mainDates.map(d => fetchPaginatedData(d))),
                    Promise.all(compDates.map(d => fetchPaginatedData(d)))
                ]);

                mainData = mainResults.flat();
                comparisonData = compResults.flat();
            }

            if (!mainData.length || !comparisonData.length) {
                toast.error('No data found for one or both selected periods');
                return;
            }

            const soilData = [{
                data: mainData,
                summaryComparisonData: comparisonData
            }];

            setSoilData(soilData);
            calculateSummary(soilData);
            toast.success('Summary data fetched successfully.');
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error(`Error fetching data: ${error.message}`);
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

    const calculateSummary = (soilData) => {
        if (!soilData || !soilData[0]) return;

        const { data, summaryComparisonData } = soilData[0];

        // Calculate metrics
        const calculateMetric = (metric) => {
            const values = data.map(item => parseFloat(item[metric])).filter(v => !isNaN(v));
            const compValues = summaryComparisonData.map(item => parseFloat(item[metric])).filter(v => !isNaN(v));

            const avg = values.length > 0 ? values.reduce((a, b) => a + b) / values.length : NaN;
            const compAvg = compValues.length > 0 ? compValues.reduce((a, b) => a + b) / compValues.length : NaN;

            const trend = !isNaN(avg) && !isNaN(compAvg)
                ? (avg < compAvg ? 'improving' : avg > compAvg ? 'worsening' : 'stable')
                : '';

            return {
                avg,
                status: getStatus(avg, metric),
                trend
            };
        };

        const summaryData = {
            soil_moisture: calculateMetric('soil_moisture'),
            temperature: calculateMetric('temperature'),
            humidity: calculateMetric('humidity')
        };

        setSummary(summaryData);
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
        setComparisonData(null);
        try {
            const { range, first, second } = filters;
            let firstData = [], secondData = [];

            if (range === 'day') {
                [firstData, secondData] = await Promise.all([
                    fetchPaginatedData(first.date),
                    fetchPaginatedData(second.date)
                ]);

            } else if (range === 'week') {
                const firstStartDate = new Date(first.weekStart);
                const firstEndDate = new Date(firstStartDate);
                firstEndDate.setDate(firstEndDate.getDate() + 6);

                const secondStartDate = new Date(second.weekStart);
                const secondEndDate = new Date(secondStartDate);
                secondEndDate.setDate(secondEndDate.getDate() + 6);

                const firstDates = getDatesInRange(firstStartDate, firstEndDate);
                const secondDates = getDatesInRange(secondStartDate, secondEndDate);

                const [firstResults, secondResults] = await Promise.all([
                    Promise.all(firstDates.map(d => fetchPaginatedData(d))),
                    Promise.all(secondDates.map(d => fetchPaginatedData(d)))
                ]);

                firstData = firstResults.flat();
                secondData = secondResults.flat();

            } else if (range === 'month') {
                const firstMonth = new Date(first.date);
                const secondMonth = new Date(second.date);

                const firstStartDate = new Date(firstMonth.getFullYear(), parseInt(first.month) - 1, 1);
                const firstEndDate = new Date(firstMonth.getFullYear(), parseInt(first.month), 0);

                const secondStartDate = new Date(secondMonth.getFullYear(), parseInt(second.month) - 1, 1);
                const secondEndDate = new Date(secondMonth.getFullYear(), parseInt(second.month), 0);

                const firstDates = getDatesInRange(firstStartDate, firstEndDate);
                const secondDates = getDatesInRange(secondStartDate, secondEndDate);

                const [firstResults, secondResults] = await Promise.all([
                    Promise.all(firstDates.map(d => fetchPaginatedData(d))),
                    Promise.all(secondDates.map(d => fetchPaginatedData(d)))
                ]);

                firstData = firstResults.flat();
                secondData = secondResults.flat();
            }

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
            toast.error(`Error fetching comparison data: ${error.message}`);
        }
    };

    const fetchLogs = async () => {
        const { range, date } = logFilters;

        if (!date) {
            setLogsErrorMessage('Please select a date.');
            return;
        }

        setLogsErrorMessage('');

        try {
            let logData = [];

            if (range === 'day') {
                logData = await fetchPaginatedData(date);

            } else if (range === 'week') {
                const startDate = new Date(date);
                const endDate = new Date(startDate);
                endDate.setDate(endDate.getDate() + 6);

                const dates = getDatesInRange(startDate, endDate);
                const results = await Promise.all(dates.map(d => fetchPaginatedData(d)));
                logData = results.flat();

            } else if (range === 'month') {
                const startDate = new Date(date);
                const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);

                const dates = getDatesInRange(startDate, endDate);
                const results = await Promise.all(dates.map(d => fetchPaginatedData(d)));
                logData = results.flat();
            }

            if (!logData.length) {
                setLogsErrorMessage('No logs found for the selected date range.');
                return;
            }

            generateLogs(logData);
            toast.success('Logs fetched successfully.');

            if (logsContainerRef.current) {
                logsContainerRef.current.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        } catch (error) {
            console.error('Error fetching logs:', error);
            setLogsErrorMessage(`Error fetching logs: ${error.message}`);
        }
    };

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
        const calculateMetricAvg = (data, metric) => {
            const values = data
                .map(item => parseFloat(item[metric]))
                .filter(v => !isNaN(v));

            const avg = values.length > 0 ? values.reduce((a, b) => a + b) / values.length : 0;
            return {
                avg,
                status: getStatus(avg, metric)
            };
        };

        const metrics = ['soil_moisture', 'temperature', 'humidity'];
        const first = {};
        const second = {};

        metrics.forEach(metric => {
            first[metric] = calculateMetricAvg(firstData, metric);
            second[metric] = calculateMetricAvg(secondData, metric);
        });

        return { first, second };
    };

    const thresholds1 = {
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
        const metrics = ["soil_moisture", "temperature", "humidity"];

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

        const createStripedPattern = (baseColor, stripeColor = "rgba(0, 0, 0, 0.3)", angle = 45) => {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            canvas.width = 10; // Adjust for stripe density
            canvas.height = 10;
        
            // Fill the background with the base color
            ctx.fillStyle = baseColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        
            // Add stripes
            ctx.strokeStyle = stripeColor;
            ctx.lineWidth = 3; // Adjust stripe thickness
            ctx.beginPath();
            ctx.moveTo(0, canvas.height);
            ctx.lineTo(canvas.width, 0);
            ctx.stroke();
        
            return ctx.createPattern(canvas, "repeat");
        };
        
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
                    backgroundColor: secondAverages.map((value, index) => {
                        const baseColor =
                            thresholds1[metrics[index]]?.find((t) => value <= t.max)?.color || "rgba(192, 192, 192, 0.5)";
                        return createStripedPattern(baseColor); // Keep the base color and add stripes
                    }),
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
        const metrics = ["soil_moisture", "temperature", "humidity"];
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

    useEffect(() => {
        // You can call fetchLogs here if you want it to run automatically when filters change
        fetchLogs();
    }, [logFilters]);

    const generateLogs = (data) => {
        const isValueCritical = (value, metric) => {
            if (metric === 'remarks') {
                return value === 'water the plants';
            }

            if (!value || isNaN(value)) return false;

            switch (metric) {
                case 'soil_moisture':
                    return value <= 19.99 || value >= 101; // Only Dry and Waterlogged
                case 'temperature':
                    return value <= 4.99 || value >= 35; // Only Cold and Hot
                case 'humidity':
                    return value <= 29.99 || value >= 86; // Only Dry and Waterlogged
                default:
                    return false;
            }
        };

        const getThresholdForValue = (value, metric) => {
            if (metric === 'remarks') {
                return {
                    label: value,
                    color: value === 'water the plants' ? 'rgba(255, 99, 132, 1)' : 'rgba(75, 192, 192, 1)'
                };
            }

            const metricThresholds = thresholds[metric];
            return metricThresholds.find(t => value >= t.min && value <= t.max) || metricThresholds[metricThresholds.length - 1];
        };

        const groupedLogs = {
            soil_moisture: [],
            temperature: [],
            humidity: [],
            remarks: []
        };

        data.forEach((entry) => {
            Object.keys(groupedLogs).forEach((metric) => {
                const value = metric === 'remarks' ? entry[metric] : parseFloat(entry[metric]);

                if (isValueCritical(value, metric)) {
                    const threshold = getThresholdForValue(value, metric);
                    const timestamp = new Date(entry.timestamp).toLocaleString("en-US", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                        hour12: true,
                        timeZone: "UTC"
                    });

                    groupedLogs[metric].push({
                        metric,
                        value: metric === 'remarks' ? value : value.toFixed(2),
                        threshold: threshold.label,
                        color: threshold.color,
                        timestamp
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

    const renderLogItem = (log, index, totalLogs) => {
        return (
            <li
                key={index}
                style={{
                    padding: '10px 0',
                    borderBottom: index < totalLogs - 1 ? '1px solid #ddd' : 'none'
                }}
            >
                <strong>{log.metric === 'remarks' ? 'ACTION' : log.metric.toUpperCase()}</strong>
                {log.metric === 'remarks' ? (
                    <span>: <strong>{log.value}</strong></span>
                ) : (
                    <span> reached <strong>{log.value}</strong></span>
                )}
                <em
                    style={{
                        backgroundColor: log.color,
                        color: 'white',
                        borderRadius: '8px',
                        padding: '2px 6px',
                        fontWeight: 'bolder',
                        marginLeft: '5px'
                    }}
                >
                    {log.threshold}
                </em>
                {" at "}{log.timestamp}
            </li>
        );
    };

    const AlertFilters = () => (
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
            <button style={styles.fetchButton} onClick={fetchLogs}>
                Fetch Logs
            </button>
        </div>
    );

    return (
        <div style={styles.body}>
            {/* <Sidebar> */}
            <div style={styles.container}>
                <div style={styles.headerRow}>
                    <h1 style={styles.dashboardTitle}>Soil Quality Dashboard</h1>
                    <button
                        style={styles.detailedSoilButton}
                        onMouseEnter={(e) => {
                            e.target.style.boxShadow = '0 0 15px 5px rgba(255, 247, 0, 0.8)'; // Apply glow on hover
                            e.target.style.transform = 'scale(1.05)'; // Slightly enlarge the button
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.boxShadow = ''; // Remove glow
                            e.target.style.transform = ''; // Reset size
                        }}
                        onClick={handleButtonClick} // Trigger navigation on button click
                    >
                        Calendar Data Tracker
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
                                        {["soil_moisture", "temperature", "humidity"].map((metric) => {
                                            const metricSummary = summary[metric];
                                            // Render metric summary if needed
                                        })}
                                    </div>
                                ) : (
                                    <p style={styles.paragraph}>No summary available for the selected filters.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                <div className={`location-panels ${transitionDirection === 'left' ? 'left' : 'right'}`}
                    onAnimationEnd={() => setIsTransitioning(false)} // Reset isTransitioning after animation ends
                    style={styles.locationPanels}
                >
                    <div style={styles.locationPanel}>
                        <h3 style={styles.locationTitle}>Soil Quality Summary</h3>
                        <div style={styles.summaryPanels}>
                            {renderSummaryPanel('soil_moisture', 'SOIL MOISTURE', summary)}
                            {renderSummaryPanel('temperature', 'TEMPERATURE', summary)}
                            {renderSummaryPanel('humidity', 'HUMIDITY', summary)}
                        </div>
                    </div>
                </div>
                <div style={styles.comparisonContainer}>
                    {/* Comparison Chart Filters */}
                    <div style={styles.containerFilterBox}>
                        <h3 style={styles.sectionTitle}>Comparison Chart Selection</h3>
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
                        {/* ...rest of comparison filters remain the same... */}
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
                            <h2 style={styles.comparisonChartTitle}>Comparison Chart
                            <InfoIcon style={styles.tooltipIcon} onClick={handleComparisonTooltipToggle} /></h2>                   
                            <p style={styles.comparisonChartSubtitle}>
                                This chart displays a comparison between two selected datasets over time
                            </p>
                            
                        </div>

                        {/* Render Comparison Chart */}
                        {renderComparisonChart(comparisonData)}
                    </div>
                </div>
                {showComparisonTooltip && (
                    <div style={styles.tooltipOverlay} onClick={handleComparisonTooltipToggle}>
                        <div style={styles.tooltipContent} onClick={(e) => e.stopPropagation()}>
                            {renderComparisonTooltipContent()}
                        </div>
                    </div>
                )}
                <div style={styles.alertFiltersContainer}>
                    {/* Header Row */}
                    <div style={styles.alertHeaderRow}>
                        <h2 style={styles.alertSectionTitle}>Alert Log</h2>
                        <p style={styles.alertSectionSubtitle}>Select data range to show metrics log</p>
                    </div>

                    {/* Filters Row */}
                    <AlertFilters />
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
                            {["soil_moisture", "temperature", "humidity", "remarks"].map((metric) => {
                                const metricLogs = logs[metric];
                                return (
                                    <div
                                        style={styles.metricBlock}
                                        key={metric}

                                    >
                                        <div style={styles.metricTitle}></div>
                                        <h3>{metric === 'remarks' ? 'REQUIRED ACTIONS' : metric.toUpperCase()}</h3>
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
                                                    {metricLogs.map((log, index) =>
                                                        renderLogItem(log, index, metricLogs.length)
                                                    )}
                                                </ul>
                                            </div>
                                        ) : (
                                            <p>No {metric === 'remarks' ? 'actions' : 'critical levels'} detected for {metric === 'remarks' ? 'this period' : metric.toUpperCase()}.</p>
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
        width: '100%',
        padding: '20px',
        boxSizing: 'border-box',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        overflowX: 'hidden', // Prevent horizontal scroll
    },


    // DASHBOARD CONTAINER TRANSPARENT
    container: {
        // marginTop: '20px',
        marginLeft: '50px',
        marginRight: 'auto',
        width: '100%',
        // maxWidth: '1440px', // Restrict to a maximum width for large screens
        backgroundColor: 'rgba(15, 13, 26, 0)',
        padding: '0 0 0 20px',
    },

    // SOIL DASHBOARD TEXTS
    dashboardTitle: {
        fontSize: "28px",
        fontWeight: "bold",
        margin: 0,
        color: "#fff",
    },
    dashboardTitle2: {
        fontSize: "15px",
        margin: 0,
        color: "#fff",
    },

    // HEADER ROW FOR TITLE AND BUTTON
    headerRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
    },

    // BUTTON STYLE
    detailedSoilButton: {
        padding: '10px 20px',
        background: 'linear-gradient(50deg, #d3c740, #524d18)', // Gradient background
        color: '#fff',
        border: 'none',
        borderRadius: '15px',
        cursor: 'pointer',
        fontSize: '1rem',
        marginLeft: '20px', // Space between title and button
        transition: 'box-shadow 0.3s ease, transform 0.3s ease', // Smooth transition for glow and scale
    },
    // BUTTON HOVER STYLE (Glow effect)
    detailedSoilButtonHover: {
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
        width: '100%',
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
        gap: '10px',
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
        backgroundColor: 'rgba(145, 137, 39, 0.5)',
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
        backgroundColor: 'rgb(145, 137, 39, 0.5)',
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
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)', // Change to 3 equal columns
        gap: '20px',
        color: 'white',
        width: '100%',
    },
    summaryPanel: {
        backgroundColor: 'rgb(157, 146, 24, 0.46)',
        padding: '20px',
        paddingLeft: '25px',
        borderRadius: '25px',
        textAlign: 'left',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
        width: '100%', // Take full width of grid cell
    },


    // ALERT LOGS CONTAINER CONTENT
    alertFiltersContainer: {
        marginTop: '20px',
        padding: '20px',
        width: '100%',
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
        backgroundColor: 'rgb(145, 137, 39, 0.5)',
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
        backgroundColor: 'rgb(145, 137, 39, 0.5)',
        color: '#fff',
        border: 'none',
        outline: 'none',
        width: '75px',
        fontSize: '14px',
    },
    fetchButton: {
        padding: '10px 20px',
        marginLeft: '13px',
        backgroundColor: '#c4b933',
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
        backgroundColor: 'rgb(145, 137, 39, 0.5)',
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
        backgroundColor: "rgb(71, 67, 21, 0.46)",
        color: "#fff",
        height: "500px", // Set fixed height for each metric block
        overflowY: "auto", // Enable vertical scrolling if content overflows
        textAlign: "center",
    },
    metricTitle: {
        backgroundColor: 'rgb(120, 113, 37)',
        height: '40px',
        width: '100%', // Change from fixed width to 100%
        marginBottom: '-38px',
        borderRadius: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    },



    button: {
        marginBottom: '15px',
        // marginLeft: '40px',
        display: 'inline-block',
        padding: '10px 20px',
        backgroundColor: '#d3c740',
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
    },
    tooltipIcon: {
        color: '#fff',
        cursor: 'pointer',
        fontSize: '1.5rem',
        marginLeft: '10px',
        // borderRadius: '50%',
        // backgroundColor: 'rgba(0, 0, 0, 0.5)',
        // padding: '5px',
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
};


export default SoilDashboard;