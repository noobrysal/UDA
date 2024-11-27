import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Bar } from 'react-chartjs-2';
import Sidebar from '../../Sidebar';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Colors,
} from 'chart.js';

// Register chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const AirDashboard = () => {
    const [airData, setAirData] = useState([]);
    const [summary, setSummary] = useState([]);
    const [visibleIndices, setVisibleIndices] = useState([0, 1]); // Tracks visible locations for the carousel
    const [transitionDirection, setTransitionDirection] = useState('left'); // Track slide direction
    const [filters, setFilters] = useState({
        range: 'day',
        first: { date: '', month: '', weekStart: '' },
        second: { date: '', month: '', weekStart: '' }
    });

    const [comparisonData, setComparisonData] = useState(null); // State for comparison chart data

    const locations = [
        { id: 1, name: 'Lapasan' },
        { id: 2, name: 'Agusan' },
        { id: 3, name: 'USTP-CDO' },
        { id: 4, name: 'El Salvador' },
        { id: 5, name: 'Sports Complex' },
    ];

    const thresholds = {
        pm25: [
            { max: 25, status: 'Good' },
            { max: 35, status: 'Fair' },
            { max: 45, status: 'Unhealthy' },
            { max: 55, status: 'Very Unhealthy' },
            { max: 90, status: 'Severely Unhealthy' },
            { max: Infinity, status: 'Emergency' },
        ],
        pm10: [
            { max: 50, status: 'Good' },
            { max: 100, status: 'Fair' },
            { max: 150, status: 'Unhealthy' },
            { max: 200, status: 'Very Unhealthy' },
            { max: 300, status: 'Severely Unhealthy' },
            { max: Infinity, status: 'Emergency' },
        ],
        humidity: [
            { max: 25, status: 'Poor' },
            { max: 30, status: 'Fair' },
            { max: 60, status: 'Good' },
            { max: 70, status: 'Fair' },
            { max: Infinity, status: 'Poor' },
        ],
        temperature: [
            { max: 33, status: 'Good' },
            { max: 41, status: 'Caution' },
            { max: 54, status: 'Danger' },
            { max: Infinity, status: 'Extreme Danger' },
        ],
        oxygen: [
            { max: Infinity, label: "Safe", color: "rgba(75, 192, 192, 1)" },
            { max: 19.5, label: "Poor", color: "rgba(255, 206, 86, 1)" },
        ],
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const startTime = '2024-11-15T00:00:00+00';
                const endTime = '2024-11-15T23:59:59.999+00';

                const locationData = await Promise.all(
                    locations.map(async (location) => {
                        const { data, error } = await supabase
                            .from('sensors')
                            .select('*')
                            .gte('date', startTime)
                            .lt('date', endTime)
                            .eq('locationId', location.id);

                        if (error) throw error;

                        return { location: location.name, data };
                    })
                );

                setAirData(locationData);
                calculateSummary(locationData);
            } catch (error) {
                console.error('Error fetching air quality:', error);
                toast.error(`Error fetching air quality: ${error.message}`);
            }
        };

        fetchData();
    }, [locations]);

    useEffect(() => {
        const timer = setInterval(() => {
            setTransitionDirection(transitionDirection === 'left' ? 'right' : 'left');
            setVisibleIndices((prevIndices) => {
                const nextStart = (prevIndices[1] + 1) % locations.length;
                return [nextStart, (nextStart + 1) % locations.length];
            });
        }, 5000);

        return () => clearInterval(timer);
    }, [locations.length, transitionDirection]);

    const calculateSummary = (locationData) => {
        const summaries = locationData.map(({ location, data }) => {
            const calculateMetric = (metric) => {
                const values = data.map((item) => item[metric]).filter((value) => value != null);
                const avg = values.length > 0 ? values.reduce((acc, val) => acc + val, 0) / values.length : NaN;
                const status = getStatus(avg, metric);
                const trend = getTrend(values);
                return { avg: isNaN(avg) ? null : avg, status, trend };
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
        if (!metricThresholds) return 'Unknown'; // Fallback for undefined metric thresholds

        const threshold = metricThresholds.find((range) => value <= range.max);
        return threshold ? threshold.status : 'Unknown'; // Return the matched status
    };

    const getTrend = (values) => {
        if (values.length < 2) return '';
        const difference = values[values.length - 1] - values[values.length - 2];
        return difference > 0 ? 'worsening' : difference < 0 ? 'improving' : 'stable';
    };

    const renderTrendIndicator = (trend) => {
        if (!trend) return null;
        return (
            <span style={{ fontSize: '16px', color: trend === 'improving' ? 'green' : 'red' }}>
                {trend === 'improving' ? 'Improving ↑' : 'Worsening ↓'}
            </span>
        );
    };

    const renderSummaryPanel = (metric, label, locationSummary) => {
        // Ensure locationSummary and metric are valid
        if (!locationSummary || !locationSummary[metric]) {
            return (
                <div style={styles.summaryPanel}>
                    <h5>{label}</h5>
                    <p>Data for this metric is missing or not available.</p>
                </div>
            );
        }

        // Destructure the metric's data with fallback
        const { avg, status, trend } = locationSummary[metric] || {};

        // Handle missing avg value
        if (avg == null) { // Check for null or undefined
            return (
                <div style={styles.summaryPanel}>
                    <h5>{label}</h5>
                    <p>Data for this date not found / available</p>
                    <p>Status: <span>Missing</span></p>
                </div>
            );
        }

        // Render the summary panel
        return (
            <div style={styles.summaryPanel}>
                <h5>{label}</h5>
                <p>{avg.toFixed(2)} μg/m³</p>
                <p>Status: <span style={styles.status?.[status] || {}}>{status}</span></p>
                {renderTrendIndicator?.(trend)}
            </div>
        );
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

            console.log('First Date:', firstDate);
            console.log('Second Date:', secondDate);
            console.log('Location:', location);

            const firstData = await fetchDataForTimeRange(firstDate, first.hour, range, location);
            const secondData = await fetchDataForTimeRange(secondDate, second.hour, range, location);

            if (!firstData.length || !secondData.length) {
                console.warn('No data found for one or both ranges.');
                toast.warning('No data found for one or both ranges.');
                setComparisonData(null); // Clear chart
                return;
            }

            const comparisonResult = calculateComparison(firstData, secondData);
            setComparisonData(comparisonResult);
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

        console.log('Query range:', { start, end, location });

        const { data, error } = await supabase
            .from('sensors')
            .select('*')
            .eq('locationId', location) // Filter by location
            .gte('date', start)
            .lt('date', end);

        if (error) throw error;

        console.log('Fetched data:', data);
        return data;
    };


    // Helper function for calculating start date for 'month' and 'week'
    const calculateStartDate = (date, range) => {
        const startDate = new Date(date + 'T00:00:00+00:00');
        if (isNaN(startDate)) throw new RangeError('Invalid date value');

        if (range === 'week') {
            const day = startDate.getUTCDay();
            startDate.setUTCDate(startDate.getUTCDate() - day);
        } else if (range === 'month') {
            startDate.setUTCDate(1);
        }

        return startDate.toISOString().split('T')[0] + 'T00:00:00+00:00';
    };

    const calculateEndDate = (date, range) => {
        const endDate = new Date(date + 'T23:59:59+00:00');
        if (isNaN(endDate)) throw new RangeError('Invalid date value');

        if (range === 'week') {
            const day = endDate.getUTCDay();
            endDate.setUTCDate(endDate.getUTCDate() + (6 - day));
        } else if (range === 'month') {
            endDate.setUTCMonth(endDate.getUTCMonth() + 1);
            endDate.setUTCDate(0);
        }

        return endDate.toISOString().split('T')[0] + 'T23:59:59+00:00';
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
            { max: 25, label: "Good", color: "rgba(75, 192, 192, 1)" },
            { max: 35, label: "Fair", color: "rgba(154, 205, 50, 1)" },
            { max: 45, label: "Unhealthy", color: "rgba(255, 206, 86, 1)" },
            { max: 55, label: "Very Unhealthy", color: "rgba(255, 140, 0, 1)" },
            { max: 90, label: "Severely Unhealthy", color: "rgba(255, 99, 132, 1)" },
            { max: Infinity, label: "Emergency", color: "rgba(139, 0, 0, 1)" },
        ],
        pm10: [
            { max: 50, label: "Good", color: "rgba(75, 192, 192, 1)" },
            { max: 100, label: "Fair", color: "rgba(154, 205, 50, 1)" },
            { max: 150, label: "Unhealthy", color: "rgba(255, 206, 86, 1)" },
            { max: 200, label: "Very Unhealthy", color: "rgba(255, 140, 0, 1)" },
            { max: 300, label: "Severely Unhealthy", color: "rgba(255, 99, 132, 1)" },
            { max: Infinity, label: "Emergency", color: "rgba(139, 0, 0, 1)" },
        ],
        humidity: [
            { max: 24, label: "Poor", color: "rgba(139, 0, 0, 1)" },
            { max: 30, label: "Fair", color: "rgba(255, 206, 86, 1)" },
            { max: 60, label: "Good", color: "rgba(75, 192, 192, 1)" },
            { max: 70, label: "Fair", color: "rgba(154, 205, 50, 1)" },
            { max: Infinity, label: "Poor", color: "rgba(255, 99, 132, 1)" },
        ],
        temperature: [
            { max: 33, label: "Good", color: "rgba(75, 192, 192, 1)" },
            { max: 41, label: "Caution", color: "rgba(255, 206, 86, 1)" },
            { max: 54, label: "Danger", color: "rgba(255, 140, 0, 1)" },
            { max: Infinity, label: "Extreme Danger", color: "rgba(139, 0, 0, 1)" },
        ],
        oxygen: [
            { max: Infinity, label: "Safe", color: "rgba(75, 192, 192, 1)" },
            { max: 19.5, label: "Poor", color: "rgba(255, 206, 86, 1)" },
        ],
    };

    const Legend = ({ thresholds, metric }) => (
        <div style={{ display: "flex", flexDirection: "column", marginTop: "20px" }}>
            <h3 style={{ textAlign: "left", marginBottom: "10px" }}>
                {metric.toUpperCase()} Thresholds
            </h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                {thresholds.map((threshold, index) => (
                    <div
                        key={index}
                        style={{
                            backgroundColor: threshold.color,
                            padding: "5px 10px",
                            borderRadius: "5px",
                            color: "white",
                            textAlign: "center",
                            border: 'solid black 0.3px'
                        }}
                    >
                        <strong>{threshold.label}</strong>: ≤ {threshold.max}
                    </div>
                ))}
            </div>
        </div>
    );

    const renderComparisonChart = (comparisonData) => {
        if (!comparisonData) {
            return null;
        }

        const { first, second } = comparisonData;
        const metrics = ["pm25", "pm10", "humidity", "temperature", "oxygen"];

        const getStatus = (value, metric) => {
            const threshold = thresholds1[metric].find((t) => value <= t.max);
            return threshold ? threshold.label : "Unknown";
        };

        const labels = metrics.map((metric) => metric.toUpperCase());
        const firstAverages = metrics.map((metric) => first[metric]?.avg || 0);
        const secondAverages = metrics.map((metric) => second[metric]?.avg || 0);

        const firstDateLabel = formatDateLabel(filters.first);
        const secondDateLabel = formatDateLabel(filters.second);

        const data = {
            labels,
            datasets: [
                {
                    label: `First Range: (${firstDateLabel})`,
                    data: firstAverages,
                    backgroundColor: firstAverages.map((value, index) =>
                        thresholds1[metrics[index]].find((t) => value <= t.max)?.color
                    ),
                    borderColor: "rgb(25, 25, 112)",
                    borderWidth: 3,
                },
                {
                    label: `Second Range: (${secondDateLabel})`,
                    data: secondAverages,
                    backgroundColor: secondAverages.map((value, index) =>
                        thresholds1[metrics[index]].find((t) => value <= t.max)?.color
                    ),
                    borderColor: "rgb(220, 20, 60)",
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
                },
            },
        };

        return (
            <div style={{ display: 'flex', flexDirection: 'column', height: '45vh' }}>
                <div style={{ flex: 1, height: '100%' }}>
                    <Bar data={data} options={options} height={null} />
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
        const date = new Date(value);
        const utcDate = date.toISOString().split("T")[0]; // Convert to UTC date

        setFilters((prevFilters) => ({
            ...prevFilters,
            [rangeType]: { ...prevFilters[rangeType], [field]: utcDate },
        }));
    };

    const [logs, setLogs] = useState([]);
    const [logFilters, setLogFilters] = useState({
        range: 'day',
        date: '',
        locationId: null,
    });

    const [errorMessage, setErrorMessage] = useState('');  // State to manage error messages

    const handleLogFiltersChange = (e) => {
        const { name, value } = e.target;

        let updatedValue = value;

        if (name === "date") {
            const date = new Date(value);
            updatedValue = date.toISOString().split("T")[0]; // Ensure UTC date without time
        }

        setLogFilters({ ...logFilters, [name]: updatedValue });
    };

    const fetchLogs = async () => {
        const { range, date, locationId } = logFilters;

        // Validate inputs
        if (!date || !locationId) {
            setErrorMessage('Please select both a location and a date.');
            return;
        }

        setErrorMessage('');  // Clear any previous error messages

        const start = calculateStartDate(date, range);
        const end = calculateEndDate(date, range);

        const { data, error } = await supabase
            .from('sensors')
            .select('*')
            .eq('locationId', locationId)
            .gte('date', start)
            .lt('date', end);

        if (error) {
            console.error('Error fetching logs:', error);
            setErrorMessage('An error occurred while fetching logs.');
            return;
        }

        // Check if no logs were found
        if (!data || data.length === 0) {
            setErrorMessage('No logs found for the selected date and location.');
            return;
        }

        generateLogs(data);
    };

    const generateLogs = (data) => {
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
                const timestamp = entry.date;
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



    return (
        <div style={styles.body}>
            <Sidebar>
                <div style={styles.container}>
                    <h1 style={styles.dashboardTitle}>Air Quality Dashboard</h1>
                    <div
                        className={`location-panels ${transitionDirection === 'left' ? 'slide-left' : 'slide-right'}`}
                        onAnimationEnd={() => setTransitionDirection('')} // Reset animation after it ends
                        style={styles.locationPanels}
                    >
                        {visibleIndices.map((index) => {
                            const { location } = airData[index] || {};
                            const locationSummary = summary[index];
                            return location ? (
                                <div key={index} style={styles.locationPanel}>
                                    <h3>{location}</h3>
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
                        <div style={styles.flexItem}>
                            <h3 style={styles.sectionTitle}>Comparison Chart</h3>
                            {/* Location Filter */}
                            <div style={styles.datePicker}>
                                <label style={styles.label}>Select Location:</label>
                                <select
                                    value={filters.location}
                                    onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                                    style={styles.rangeSelect}
                                >
                                    {/* Show placeholder option only when no location is selected */}
                                    <option value="">Select a location</option>

                                    {/* Conditionally render locations */}
                                    {filters.range && locations.length > 0 ? (
                                        locations.map((location) => (
                                            <option key={location.id} value={location.id}>
                                                {location.name}
                                            </option>
                                        ))
                                    ) : null}
                                </select>
                            </div>
                            {/* Range selection */}
                            <div style={styles.datePicker}>
                                <label style={styles.label}>Select Filter:</label>
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
                                    <div style={styles.datePicker}>
                                        <label style={styles.label}>First Starting Week Date:</label>
                                        <input
                                            type="date"
                                            value={filters.first.weekStart}
                                            onChange={(e) => handleDateChange(e, 'weekStart', 'first')}
                                            style={styles.datePicker}
                                        />
                                    </div>
                                    <div style={styles.datePicker}>
                                        <label style={styles.label}>Second Starting Week Date:</label>
                                        <input
                                            type="date"
                                            value={filters.second.weekStart}
                                            onChange={(e) => handleDateChange(e, 'weekStart', 'second')}
                                            style={styles.datePicker}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Month Range */}
                            {filters.range === 'month' && (
                                <div>
                                    <div style={styles.datePicker}>
                                        <label style={styles.label}>First Month:</label>
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
                                    <div style={styles.datePicker}>
                                        <label style={styles.label}>Second Month:</label>
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
                                    <div style={styles.datePicker}>
                                        <label htmlFor="first-date">First Date:</label>
                                        <input
                                            type="date"
                                            id="first-date"
                                            value={filters.first.date}
                                            onChange={(e) =>
                                                handleDateChange(e, 'date', 'first')
                                            }
                                        />
                                        {filters.range === 'hour' && (
                                            <>
                                                <label htmlFor="first-hour">First Hour:</label>
                                                <select
                                                    id="first-hour"
                                                    value={filters.first.hour || ''}
                                                    onChange={(e) =>
                                                        setFilters({
                                                            ...filters,
                                                            first: { ...filters.first, hour: e.target.value ? parseInt(e.target.value, 10) : null },
                                                        })
                                                    }
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
                                    <div style={styles.datePicker}>
                                        <label htmlFor="second-date">Second Date:</label>
                                        <input
                                            type="date"
                                            id="second-date"
                                            value={filters.second.date}
                                            onChange={(e) =>
                                                handleDateChange(e, 'date', 'second')
                                            }
                                        />
                                        {filters.range === 'hour' && (
                                            <>
                                                <label htmlFor="second-hour">Second Hour:</label>
                                                <select
                                                    id="second-hour"
                                                    value={filters.second.hour || ''}
                                                    onChange={(e) =>
                                                        setFilters({
                                                            ...filters,
                                                            second: { ...filters.second, hour: e.target.value ? parseInt(e.target.value, 10) : null },
                                                        })
                                                    }
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
                        <div style={styles.flexItem}>
                            {/* Render Comparison Chart */}
                            {renderComparisonChart(comparisonData)}
                        </div>
                    </div>
                    <div style={styles.legendDiv}>
                        {renderLegend()}
                    </div>
                    <div style={styles.alertLogsContainer}>
                        <h2 style={styles.sectionTitle}>Alert Logs</h2>

                        {/* Filters */}
                        <div style={{ marginBottom: "20px" }}>
                            <label>
                                Date:
                                <input
                                    type="date"
                                    name="date"
                                    value={logFilters.date}
                                    onChange={handleLogFiltersChange}
                                />
                            </label>
                            <label>
                                Location:
                                <select
                                    name="locationId"
                                    value={logFilters.locationId || ""}
                                    onChange={handleLogFiltersChange}
                                >
                                    <option value="" disabled>
                                        Select a location
                                    </option>
                                    {locations.map((location) => (
                                        <option key={location.id} value={location.id}>
                                            {location.name}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label>
                                Range:
                                <select
                                    name="range"
                                    value={logFilters.range}
                                    onChange={handleLogFiltersChange}
                                >
                                    <option value="day">Day</option>
                                    <option value="week">Week</option>
                                    <option value="month">Month</option>
                                </select>
                            </label>
                            <button onClick={fetchLogs}>Fetch Logs</button>
                        </div>

                        {/* Logs */}
                        {errorMessage ? (
                            <div style={{ color: 'red' }}>{errorMessage}</div>
                        ) : Object.keys(logs).length > 0 ? (
                            <div style={{ display: "flex", gap: "20px", }}>
                                {/* Loop through all available metrics, including oxygen */}
                                {["pm25", "pm10", "humidity", "temperature", "oxygen"].map((metric) => {
                                    const metricLogs = logs[metric];
                                    return (
                                        <div key={metric} style={{ border: "1px solid #ccc", padding: "10px", flex: 1, borderRadius: '10px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)', }}>
                                            <h3>{metric.toUpperCase()}</h3>
                                            {metricLogs?.length > 0 ? (
                                                <ul>
                                                    {/* Render each log for the metric */}
                                                    {metricLogs.map((log, index) => (
                                                        <li key={index} style={{ padding: '10px 0 10px 0', }}>
                                                            <strong>{log.metric.toUpperCase()}</strong> reached{" "}
                                                            <em
                                                                style={{
                                                                    backgroundColor: log.color,
                                                                    color: 'white',
                                                                    borderRadius: '8px',
                                                                    padding: '2px 6px',
                                                                    fontWeight: 'bolder'
                                                                }}
                                                            >
                                                                {log.threshold}
                                                            </em>{" "}
                                                            at {new Date(log.timestamp).toLocaleString('en-US', { timeZone: 'UTC' })}
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p>No critical levels detected for {metric.toUpperCase()}.</p>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p>No logs available for the selected filters.</p>
                        )}
                    </div>


                    <ToastContainer />
                </div>
            </Sidebar >
        </div >
    );


};
const styles = {
    body: {
        backgroundColor: '#808080', // Soft gray for the dashboard background
        minHeight: '100vh', // Ensure the body spans the full viewport
        padding: '20px', // Padding around the entire content
        boxSizing: 'border-box',
        display: 'flex', // Enable flexbox
        justifyContent: 'center', // Center horizontally
        alignItems: 'center',
    },
    container: {
        maxWidth: '1200px', // Center the dashboard content
        margin: '0 auto',
        backgroundColor: '#cccbca', // White for main content background
        borderRadius: '10px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        padding: '20px',
    },
    dashboardTitle: {
        fontSize: '2rem',
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: '20px',
    },
    locationPanels: {
        display: 'flex',
        flexWrap: 'wrap', // Wrap panels for smaller screens
        gap: '20px',
        marginBottom: '30px',
    },
    locationPanel: {
        flex: '1 1 calc(33.333% - 20px)', // Three columns on larger screens
        backgroundColor: '#ffffff',
        padding: '15px',
        borderRadius: '10px',
        boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)',
        textAlign: 'center',
        transition: 'transform 0.3s, box-shadow 0.3s',
    },
    locationPanelHover: {
        transform: 'scale(1.05)', // Hover effect for panels
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
    },
    locationTitle: {
        fontSize: '1.2rem',
        fontWeight: 'bold',
        marginBottom: '10px',
    },
    summaryPanels: {
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '10px',
    },
    summaryPanel: {
        flex: '1 1 calc(45% - 10px)', // Two panels per row
        backgroundColor: '#fafafa',
        padding: '10px',
        borderRadius: '10px',
        border: 'solid black 1px',
        textAlign: 'center',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
    },
    comparisonContainer: {
        display: 'flex',
        flexWrap: 'wrap', // Responsive flex layout
        gap: '20px',
        marginBottom: '30px',
    },
    legendDiv: {

        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
        padding: '5px 0 40px 30px',
        borderRadius: '10px',
    },
    flexItem: {
        flex: '1 1 calc(50% - 20px)', // Two items per row
        padding: '15px',
        backgroundColor: '#ffffff',
        borderRadius: '10px',
        boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)',
        display: 'flex', // Enable flexbox
        flexDirection: 'column', // Stack children vertically
        justifyContent: 'space-between',
    },
    alertLogsContainer: {
        marginTop: '20px',
        padding: '15px',
        backgroundColor: '#f5f5f5',
        borderRadius: '10px',
        boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)',
    },
    sectionTitle: {
        fontSize: '1.5rem',
        fontWeight: 'bold',
        marginBottom: '10px',
        paddingBottom: '30px'
    },
    datePicker: {
        margin: '20px',
    },
    button: {
        display: 'inline-block',
        padding: '10px 20px',
        backgroundColor: '#007bff',
        color: '#ffffff',
        borderRadius: '5px',
        border: 'none',
        fontWeight: 'bold',
        textAlign: 'center',
        cursor: 'pointer',
        transition: 'background-color 0.3s',
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
};


export default AirDashboard;
