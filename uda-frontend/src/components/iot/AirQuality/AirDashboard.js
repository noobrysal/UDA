import React, { useEffect, useState, useRef } from 'react';
import { supabaseAir } from './supabaseClient';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Bar } from 'react-chartjs-2';
import { useNavigate } from 'react-router-dom';
// import Sidebar from '../../Sidebar';
import backgroundImage from '../../../assets/airdash.png';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { color, height, minHeight, width } from '@mui/system';
import IconButton from '@mui/material/IconButton';
import InfoIcon from '@mui/icons-material/Info';

// Register chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);



const AirDashboard = () => {
    const [airData, setAirData] = useState([]);
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
                <h4 style={{ ...styles.tooltipHeader, marginBottom: '20px' }}>Air Quality Thresholds</h4>
                <table style={styles.tooltipTable}>
                    <thead>
                        <tr>
                            <th style={styles.tooltipTableHeader}>Category</th>
                            <th style={{ ...styles.tooltipTableHeader, width: '11%' }}>Particle Matter 10 (PM10)</th>
                            <th style={{ ...styles.tooltipTableHeader, width: '12%' }}>Particle Matter 2.5 (PM2.5)</th>
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

    //BUTTON NAVIGATION TO AIR DETAILED DATA
    const navigate = useNavigate();

    const handleButtonClick = () => {
        // Navigate to the desired route when the button is clicked
        navigate('/air-quality'); // Change '/detailed-data' to the route you want
    };

    const locations = [
        { id: 1, name: 'Lapasan' },
        { id: 2, name: 'Agusan' },
        { id: 3, name: 'USTP-CDO' },
        { id: 4, name: 'El Salvador' },
        { id: 5, name: 'Sports Complex' },
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
                    timeZone: "Asia/Manila" // Respect the timezone from the database
                });
            };

            // Calculate start and end dates for the main date range
            if (range === 'day') {
                start = `${date}T00:00:00+08:00`;
                end = `${date}T23:59:59+08:00`;
            } else if (range === 'week') {
                start = calculateStartDate(date, range);
                end = calculateEndDate(date, range);
            } else if (range === 'month') {
                const startDate = new Date(date);
                startDate.setDate(1);
                start = `${startDate.toISOString().split('T')[0]}T00:00:00+08:00`;
                const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
                end = `${endDate.toISOString().split('T')[0]}T23:59:59.999+08:00`;
            }

            // Calculate start and end dates for the comparison date range using the same range
            if (range === 'day') {
                comparisonStart = `${comparisonDate}T00:00:00+08:00`;
                comparisonEnd = `${comparisonDate}T23:59:59+08:00`;
            } else if (range === 'week') {
                comparisonStart = calculateStartDate(comparisonDate, range);
                comparisonEnd = calculateEndDate(comparisonDate, range);
            } else if (range === 'month') {
                const comparisonStartDate = new Date(comparisonDate);
                comparisonStartDate.setDate(1);
                comparisonStart = `${comparisonStartDate.toISOString().split('T')[0]}T00:00:00+08:00`;
                const comparisonEndDate = new Date(comparisonStartDate.getFullYear(), comparisonStartDate.getMonth() + 1, 0);
                comparisonEnd = `${comparisonEndDate.toISOString().split('T')[0]}T23:59:59.999+08:00`;
            }

            const locationData = [];
            let hasData = false;
            let hasMainData = false;
            let hasComparisonData = false;

            for (const location of locations) {
                const { data, error } = await supabaseAir
                    .from('sensors')
                    .select('*')
                    .gte('date', start)
                    .lt('date', end)
                    .eq('locationId', location.id);

                if (error) throw error;

                const summaryComparisonData = await supabaseAir
                    .from('sensors')
                    .select('*')
                    .gte('date', comparisonStart)
                    .lt('date', comparisonEnd)
                    .eq('locationId', location.id);

                if (summaryComparisonData.error) throw summaryComparisonData.error;

                if (data.length > 0) {
                    hasMainData = true;
                }

                if (summaryComparisonData.data.length > 0) {
                    hasComparisonData = true;
                }

                if (data.length > 0 || summaryComparisonData.data.length > 0) {
                    hasData = true;
                }

                locationData.push({ location: location.name, data, summaryComparisonData: summaryComparisonData.data });
            }

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
            hasData = false;
            hasMainData = false;
            hasComparisonData = false;

            setAirData(locationData);
            calculateSummary(locationData);
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

    const calculateSummary = (locationData) => {
        const summaries = locationData.map(({ location, data, summaryComparisonData }) => {
            const calculateMetric = (metric) => {
                // Helper function to calculate average based on range
                const calculateRangeAverage = (data, range) => {
                    if (!data || data.length === 0) return NaN;

                    // Sort data by date
                    const sortedData = [...data].sort((a, b) => new Date(a.date) - new Date(b.date));

                    switch (range) {
                        case 'hour':
                            // Group by hour and calculate hourly averages
                            return calculateGroupedAverage(sortedData, d =>
                                new Date(d.date).toISOString().split(':')[0]
                            );
                        case 'day':
                            // Group by day and calculate daily averages
                            return calculateGroupedAverage(sortedData, d =>
                                new Date(d.date).toISOString().split('T')[0]
                            );
                        case 'week':
                            // Group by week and calculate weekly averages
                            return calculateGroupedAverage(sortedData, d => {
                                const date = new Date(d.date);
                                const startOfWeek = new Date(date);
                                startOfWeek.setDate(date.getDate() - date.getDay());
                                return startOfWeek.toISOString().split('T')[0];
                            });
                        case 'month':
                            // Group by month and calculate monthly averages
                            return calculateGroupedAverage(sortedData, d =>
                                new Date(d.date).toISOString().slice(0, 7)
                            );
                        default:
                            return NaN;
                    }
                };

                // Helper function to calculate grouped averages
                const calculateGroupedAverage = (data, groupKeyFn) => {
                    const groups = {};
                    data.forEach(item => {
                        const key = groupKeyFn(item);
                        if (!groups[key]) {
                            groups[key] = { sum: 0, count: 0 };
                        }
                        const value = item[metric];
                        if (value != null && !isNaN(value)) {
                            groups[key].sum += value;
                            groups[key].count++;
                        }
                    });

                    // Calculate average of group averages
                    const groupAverages = Object.values(groups)
                        .map(g => g.sum / g.count)
                        .filter(v => !isNaN(v));

                    return groupAverages.length > 0
                        ? groupAverages.reduce((a, b) => a + b) / groupAverages.length
                        : NaN;
                };

                // Calculate averages for both periods
                const avg = calculateRangeAverage(data, summaryFilters.range);
                const comparisonAvg = calculateRangeAverage(summaryComparisonData, summaryFilters.range);

                // Determine trend by comparing averages
                const trend = !isNaN(avg) && !isNaN(comparisonAvg)
                    ? (avg < comparisonAvg ? 'improving' : avg > comparisonAvg ? 'worsening' : 'stable')
                    : '';

                const status = getStatus(avg, metric);

                return { avg, status, trend };
            };

            return {
                location,
                pm25: calculateMetric('pm25'),
                pm10: calculateMetric('pm10'),
                humidity: calculateMetric('humidity'),
                temperature: calculateMetric('temperature'),
                oxygen: calculateMetric('oxygen'),
            };
        });

        setSummary(summaries);
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
            const { range, first, second, location } = filters;

            if (!location) {
                toast.warning('Please select a location.');
                return;
            }

            let firstDate = first.date;
            let secondDate = second.date;

            if (range === 'week') {
                firstDate = first.weekStart;
                secondDate = second.weekStart;
            } else if (range === 'month') {
                const currentYear = new Date().getFullYear();
                firstDate = `${first.year || currentYear}-${first.month}-01`;
                secondDate = `${second.year || currentYear}-${second.month}-01`;
            }

            const firstData = await fetchDataForTimeRange(firstDate, first.hour, range, location);
            const secondData = await fetchDataForTimeRange(secondDate, second.hour, range, location);

            if (!firstData.length || !secondData.length) {
                toast.warning('No data found for one or both ranges.');
                setComparisonData(null); // Clear chart
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

    const fetchDataForTimeRange = async (date, hour, range, location) => {
        if (!date || !location) throw new Error("Date and location are required.");

        let start, end;

        if (range === 'hour' && hour !== null) {
            start = `${date}T${hour}:00:00+00:00`;
            end = `${date}T${hour}:59:59+00:00`;
        } else if (range === 'day') {
            start = `${date}T00:00:00+00:00`;
            end = `${date}T23:59:59+00:00`;
        } else if (range === 'week' || range === 'month') {
            start = calculateStartDate(date, range);
            end = calculateEndDate(date, range);
        }

        const { data, error } = await supabaseAir
            .from('sensors')
            .select('*')
            .eq('locationId', location) // Filter by location
            .gte('date', start)
            .lt('date', end);

        if (error) throw error;

        return data;
    };


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

        const metrics = ['pm25', 'pm10', 'humidity', 'temperature', 'oxygen'];
        const firstResult = {};
        const secondResult = {};

        metrics.forEach((metric) => {
            firstResult[metric] = calculateMetric(firstData, metric);
            secondResult[metric] = calculateMetric(secondData, metric);
        });

        return { first: firstResult, second: secondResult };
    };

    const thresholds1 = {
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
        const metrics = ["pm25", "pm10", "humidity", "temperature", "oxygen"];

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
                    borderColor: "rgb(252, 252, 247)",
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
                    borderColor: "rgb(3, 3, 3)",
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
                    borderSkipped: false, // Ensure all edges of the bar have a border radius
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
        const metrics = ["pm25", "pm10", "humidity", "temperature", "oxygen"];
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
        const { range, date, locationId } = logFilters;

        // Validate inputs
        if (!date || !locationId) {
            setLogsErrorMessage('Please select both a location and a date.');
            return;
        }

        setLogsErrorMessage('');  // Clear any previous error messages

        const start = calculateStartDate(date, range);
        const end = calculateEndDate(date, range);

        const { data, error } = await supabaseAir
            .from('sensors')
            .select('*')
            .eq('locationId', locationId)
            .gte('date', start)
            .lt('date', end);

        if (error) {
            console.error('Error fetching logs:', error);
            setLogsErrorMessage('An error occurred while fetching logs.');
            return;
        }

        // Check if no logs were found
        if (!data || data.length === 0) {
            setLogsErrorMessage('No logs found for the selected date and location.');
            return;
        }

        generateLogs(data);
        toast.success('Logs fetched successfully.');

        // Scroll to logs container after data is loaded
        if (logsContainerRef.current) {
            logsContainerRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    };

    const generateLogs = (data) => {
        console.log('generateLogs called');
        const thresholds = {
            pm25: thresholds1.pm25.slice(2), // Unhealthy to Emergency
            pm10: thresholds1.pm10.slice(2), // Unhealthy to Emergency
            humidity: thresholds1.humidity.filter((t) => t.label === "Poor"),
            temperature: thresholds1.temperature.filter(
                (t) => t.label === "Danger" || t.label === "Extreme Danger"
            ),
            oxygen: [
                { max: 19.5, label: "Poor", color: "rgba(255, 206, 86, 1)" },
            ],  // Added oxygen thresholds
        };

        const groupedLogs = {
            pm25: [],
            pm10: [],
            humidity: [],
            temperature: [],
            oxygen: [],  // Added oxygen grouping
        };

        data.forEach((entry) => {
            ["pm25", "pm10", "humidity", "temperature", "oxygen"].forEach((metric) => {
                const value = entry[metric];
                const timestamp = new Date(entry.date).toLocaleString("en-US", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    hour12: false,
                    timeZone: "Asia/Manila" // Adjust to the desired time zone
                });
                const remark = entry[`${metric}Remarks`];

                // Match threshold for each metric
                const matchingThreshold = thresholds[metric]?.find(
                    (threshold) => (metric === "oxygen" ? value <= threshold.max : threshold.label === remark)
                );

                if (matchingThreshold) {
                    groupedLogs[metric].push({
                        metric,
                        threshold: matchingThreshold.label,
                        color: matchingThreshold.color, // Include the color
                        timestamp,
                    });
                }
            });
        });

        // Sort each metric's logs by descending timestamp
        Object.keys(groupedLogs).forEach((metric) => {
            groupedLogs[metric].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        });

        setLogs(groupedLogs);
    };

    useEffect(() => {
        // You can call fetchLogs here if you want it to run automatically when filters change
        fetchLogs();
    }, [logFilters]);

    const [isAtBottom, setIsAtBottom] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            const scrolledToBottom =
                window.innerHeight + window.pageYOffset >= document.documentElement.scrollHeight - 100;
            setIsAtBottom(scrolledToBottom);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div style={styles.body}>
            {/* <Sidebar> */}
            <div style={styles.container}>
                <div style={styles.headerRow}>
                    <h1 style={styles.dashboardTitle}>Air Quality Dashboard</h1>
                    <button
                        style={styles.detailedAirButton}
                        onMouseEnter={(e) => {
                            e.target.style.boxShadow = '0 0 15px 5px rgba(0, 198, 255, 0.8)'; // Apply glow on hover
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.boxShadow = ''; // Remove glow
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
                                        {["pm25", "pm10", "humidity", "temperature", "oxygen"].map((metric) => {
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
                <div
                    className={`location-panels ${transitionDirection === 'left' ? 'left' : 'right'}`}
                    onAnimationEnd={() => setIsTransitioning(false)} // Reset isTransitioning after animation ends
                    style={styles.locationPanels}
                >
                    {visibleIndices.map((index) => {
                        const { location } = airData[index] || {};
                        const locationSummary = summary[index];
                        return location ? (
                            <div key={index} style={styles.locationPanel}>
                                <h3 style={styles.locationTitle}>{location}</h3> {/* Apply the locationTitle style here */}
                                <div style={styles.summaryPanels}>
                                    {renderSummaryPanel('pm25', 'PM2.5', locationSummary)}
                                    {renderSummaryPanel('pm10', 'PM10', locationSummary)}
                                    {renderSummaryPanel('humidity', 'Humidity', locationSummary)}
                                    {renderSummaryPanel('temperature', 'Temperature', locationSummary)}
                                    {renderSummaryPanel('oxygen', 'Oxygen', locationSummary)}
                                </div>
                            </div>
                        ) : null;
                    })}
                </div>
                <div style={styles.comparisonContainer}>
                    {/* Comparison Chart Filters */}
                    <div style={styles.containerFilterBox}>
                        <h3 style={styles.sectionTitle}>Comparison Chart Selection</h3>
                        {/* Location Filter */}
                        <div>
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
                        </div>
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
                            <button
                                style={{
                                    ...styles.thresholdLevelsButton,
                                    ...(isAtBottom ? styles.thresholdLevelsButtonTop : styles.thresholdLevelsButtonBottom)
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.boxShadow = '0 0 15px 5px rgba(0, 198, 255, 0.8)';
                                    e.target.style.transform = 'scale(1.05)'; // Remove the translateY part
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.boxShadow = '';
                                    e.target.style.transform = ''; // Reset to default
                                }}
                                onClick={handleComparisonTooltipToggle}
                            >
                                Threshold Levels
                            </button>
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
                {/* Remove the data threshold section */}
                {/* <div style={styles.thresholdLegendDiv}>
                    <div style={styles.thresholdHeader}>
                        <h3 style={styles.thresholdTitle}>Data Thresholds</h3>
                        <p style={styles.thresholdSubtitle}>
                            Scale of the various data levels for air monitoring
                        </p>
                    </div>
                    {renderLegend()}
                </div> */}

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
                        <label style={styles.alertRangeText}>
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
                        </label>
                        <button style={styles.fetchButton} onClick={fetchLogs}>
                            Fetch Logs
                        </button>
                    </div>
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
                            {/* Loop through all available metrics, including oxygen */}
                            {["pm25", "pm10", "humidity", "temperature", "oxygen"].map((metric) => {
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
                                                            <strong>{log.metric.toUpperCase()}</strong> reached{" "}
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
                                                            at {new Date(log.timestamp).toLocaleString('en-US', {
                                                                year: 'numeric',
                                                                month: '2-digit',
                                                                day: '2-digit',
                                                                hour12: true,
                                                                hour: '2-digit',
                                                                minute: '2-digit',
                                                                second: '2-digit',
                                                                timeZone: 'Asia/Manila' // Adjust to the desired time zone
                                                            })}
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
        backgroundColor: '#0F0D1A',
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
        // marginTop: '10px',
        marginLeft: '50px',
        // marginRight: '70px',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        // maxWidth: '1440px', // Restrict to a maximum width for large screens
        backgroundColor: 'rgba(15, 13, 26, 0)',
        padding: '0 0 0 20px',
    },

    // AIR DASHBOARD TEXTS
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
    detailedAirButton: {
        padding: '10px 20px',
        background: 'linear-gradient(50deg, #00CCDD, #006E77)', // Gradient background
        color: '#fff',
        border: 'none',
        borderRadius: '15px',
        cursor: 'pointer',
        fontSize: '1rem',
        marginLeft: '20px', // Space between title and button
        transition: 'box-shadow 0.3s ease, transform 0.3s ease', // Smooth transition for glow and scale
    },
    // BUTTON HOVER STYLE (Glow effect)
    detailedAirButtonHover: {
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
        backgroundColor: 'rgba(0, 204, 221, 0.46)',
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
        backgroundColor: 'rgb(0, 204, 221, 0.46)',
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
        backgroundColor: 'rgb(21, 141, 153, 0.46)',
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
        backgroundColor: 'rgb(0, 204, 221, 0.46)',
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
        backgroundColor: 'rgb(0, 204, 221, 0.46)',
        color: '#fff',
        border: 'none',
        outline: 'none',
        width: '75px',
        fontSize: '14px',
    },
    fetchButton: {
        padding: '10px 20px',
        marginLeft: '13px',
        backgroundColor: '#00CCDD',
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
        width: '100%',
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
        backgroundColor: 'rgb(0, 204, 221, 0.46)',
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
        position: 'relative', // Added for floating button positioning
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
    thresholdLevelsButton: {
        padding: '10px 20px',
        background: 'linear-gradient(50deg, #00CCDD, #006E77)',
        color: '#fff',
        border: 'none',
        borderRadius: '15px',
        cursor: 'pointer',
        fontSize: '1rem',
        transition: 'all 0.3s ease',
        position: 'fixed',
        right: '30px',
        zIndex: 1000,
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
    },
    thresholdLevelsButtonBottom: {
        bottom: '30px',
    },
    thresholdLevelsButtonTop: {
        top: '30px',
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
        backgroundColor: "rgb(29, 144, 154, 0.46)",
        color: "#fff",
        height: "500px", // Set fixed height for each metric block
        overflowY: "auto", // Enable vertical scrolling if content overflows
        textAlign: "center",
    },
    metricTitle: {
        backgroundColor: 'rgb(4, 71, 78)',
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
        backgroundColor: '#00CCDD',
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
    // Styles for laptop screens (1920 x 1200 and smaller)
    '@media (max-width: 1920px)': {
        container: {
            marginTop: '20px',
            marginLeft: '40px',
            marginRight: '40px',
            padding: '15px', // Slightly reduced padding for laptops
        },
    },

    // Styles for screens smaller than 1440px
    '@media (max-width: 1440px)': {
        container: {
            marginLeft: '20px',
            marginRight: '20px',
            padding: '10px', // Further reduced padding for smaller screens
        },
    },

    // Styles for screens smaller than 1024px (tablets and small laptops)
    '@media (max-width: 1024px)': {
        container: {
            flexDirection: 'column', // Stack content vertically
            alignItems: 'stretch',  // Stretch items to fit smaller width
            padding: '10px 5px',    // Reduced padding
        },
    },

    // Styles for mobile devices (768px and smaller)
    '@media (max-width: 768px)': {
        container: {
            flexDirection: 'column',
            marginLeft: '10px',
            marginRight: '10px',
            padding: '5px', // Minimal padding for mobile
        },
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


export default AirDashboard;