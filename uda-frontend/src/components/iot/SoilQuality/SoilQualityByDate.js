import React, { useEffect, useState } from "react";
import { useParams } from 'react-router-dom';
import axiosClient from './axiosClient';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Line } from 'react-chartjs-2';
import backgroundImage from '../../../assets/soildash.png';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from "chart.js";
import { IconButton, Tooltip as MuiTooltip } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';

const plugin = {
    id: "increase-legend-spacing",
    beforeInit(chart) {
        const originalFit = chart.legend.fit;
        chart.legend.fit = function () {
            originalFit.call(chart.legend);
            this.height += 35;
        };
    },
};

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    plugin
);

const SoilQualityByDate = () => {
    const { date, hour } = useParams();

    // Update initial states to handle date properly
    const [selectedDate, setSelectedDate] = useState(() => {
        if (date) {
            return date; // Keep as string for input value
        }
        return new Date().toISOString().split('T')[0];
    });

    const [selectedHour, setSelectedHour] = useState(() => {
        return hour || "00";
    });

    // Add effect to handle URL parameters
    useEffect(() => {
        if (date) {
            setSelectedDate(date);
        }
        if (hour) {
            setSelectedHour(hour);
        }
    }, [date, hour]);

    const [soilData, setSoilData] = useState([]);
    const [highlightedDates, setHighlightedDates] = useState([]);
    const [viewMode, setViewMode] = useState(() => hour ? "hourly" : "average");
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [isCalendarLoading, setIsCalendarLoading] = useState(false);
    const [expandedChart, setExpandedChart] = useState(null);
    const [availableHours, setAvailableHours] = useState([]);


    useEffect(() => {
    }, [viewMode]);

    const thresholds = {
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

    const formatDate = (date) => {
        // Handle both Date objects and date strings
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        const localDate = new Date(dateObj.getTime() - (dateObj.getTimezoneOffset() * 60000));
        const year = localDate.getFullYear();
        const month = String(localDate.getMonth() + 1).padStart(2, "0");
        const day = String(localDate.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    };

    // Fetch data for the entire month
    const fetchMonthData = async (startDate, endDate) => {
        try {
            setIsCalendarLoading(true); // Start loading
            // Create an array of dates between start and end
            const dates = [];
            const currentDate = new Date(startDate);
            while (currentDate <= endDate) {
                const formattedDate = currentDate.toISOString().split('T')[0];
                dates.push(formattedDate);
                currentDate.setDate(currentDate.getDate() + 1);
            }

            // Fetch data for each date in parallel
            const responses = await Promise.all(
                dates.map(date =>
                    axiosClient.get('', {
                        params: { date }
                    })
                )
            );

            // Combine all responses and extract unique dates
            const uniqueDates = new Set(
                responses.flatMap(response =>
                    response.data.map(item =>
                        new Date(item.timestamp).toISOString().split('T')[0]
                    )
                )
            );

            const highlightedDatesArray = Array.from(uniqueDates);
            console.log('Dates with data:', highlightedDatesArray);
            setHighlightedDates(highlightedDatesArray);
        } catch (error) {
            console.error("Error fetching month data:", error);
            toast.error(`Error fetching data: ${error.message}`);
        } finally {
            setIsCalendarLoading(false); // End loading
        }
    };

    const handleMonthChange = ({ activeStartDate }) => {
        setCurrentMonth(activeStartDate);
        const startOfMonth = new Date(
            activeStartDate.getFullYear(),
            activeStartDate.getMonth(),
            1
        );
        const endOfMonth = new Date(
            activeStartDate.getFullYear(),
            activeStartDate.getMonth() + 1,
            0
        );
        fetchMonthData(startOfMonth, endOfMonth);
    };

    const tileClassName = ({ date, view }) => {
        if (view === "month") {
            const adjustedDate = new Date(date);
            adjustedDate.setDate(adjustedDate.getDate() + 1);
            const formattedDate = adjustedDate.toISOString().split('T')[0];
            return highlightedDates.includes(formattedDate) ? 'has-data' : 'no-data';
        }
        return null;
    };

    // Define fetchData function outside of useEffect
    const fetchData = async (date = selectedDate) => {
        try {
            const formattedDate = formatDate(date);

            const response = await axiosClient.get('', {
                params: {
                    date: formattedDate
                }
            });

            console.log('Data for date:', formattedDate, response.data);
            setSoilData(response.data);
            updateAvailableHours(response.data); // Add this line
        } catch (error) {
            console.error("Error fetching soil quality:", error);
            toast.error(`Error fetching soil quality: ${error.message}`);
        }
    };

    // Use useEffect to call fetchData when selectedDate or selectedLocation changes
    useEffect(() => {
        if (selectedDate) {
            fetchData();
        }
    }, [selectedDate]);

    // Now fetchData is public and can be called from elsewhere in your component


    useEffect(() => {
        const startOfMonth = new Date(
            currentMonth.getFullYear(),
            currentMonth.getMonth(),
            1
        );
        const endOfMonth = new Date(
            currentMonth.getFullYear(),
            currentMonth.getMonth() + 1,
            0
        );
        fetchMonthData(startOfMonth, endOfMonth);

    }, [currentMonth]);

    const getFilteredData = (data) => {
        const selectedHourUTC = parseInt(selectedHour);

        return data.filter((item) => {
            // Use the hour directly from the timestamp without timezone conversion
            const itemHour = new Date(item.timestamp).getHours();
            return itemHour === selectedHourUTC;
        });
    };

    const filteredData = getFilteredData(soilData);

    // Function to filter data by each hour for hourly averages
    // Preprocess soilData for hourly averages
    const getFilteredDataForAverage = (data, metric) => {
        // Create an accumulator to group data by hour in the local time zone
        const hourlyData = data.reduce((acc, item) => {
            // Use hour directly from timestamp
            const hour = new Date(item.timestamp).getHours();
            if (!acc[hour]) acc[hour] = { sum: 0, count: 0 };
            acc[hour].sum += parseFloat(item[metric]);
            acc[hour].count++;
            return acc;
        }, {});

        // Calculate averages for each hour and return an array
        return Object.keys(hourlyData).map((hour) => {
            const { sum, count } = hourlyData[hour];
            return { hour: parseInt(hour), average: sum / count }; // Return average per hour
        });
    };
    const getColor = (value, metric) => {
        // Access the metric-specific thresholds
        const metricThresholds = thresholds[metric];

        if (!metricThresholds) {
            console.error(`Thresholds for metric ${metric} not found!`);
            return "rgba(0, 0, 0, 1)"; // Default to black color for unknown thresholds
        }

        // Find the threshold level for the given value
        const level = metricThresholds.find(
            (threshold) => value >= threshold.min && value <= threshold.max
        );

        // Return the corresponding color or a default color
        return level ? level.color : "rgba(0, 0, 0, 1)";
    };


    const createChartConfig = (label, data, metric) => {
        const totalValue = filteredData.reduce((acc, item) => acc + parseFloat(item[metric]), 0);
        const averageValue = totalValue / filteredData.length;
        const averageColor = getColor(averageValue, metric);

        // Sort the filtered data chronologically by timestamp
        const sortedData = [...filteredData].sort((a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        // Create arrays for labels, data points, and colors in the same order
        const chartData = sortedData.map(item => {
            const date = new Date(item.timestamp);
            const hours = date.getHours();
            const minutes = date.getMinutes();
            const seconds = date.getSeconds();
            const ampm = hours >= 12 ? 'PM' : 'AM';
            const displayHours = hours % 12 || 12;

            return {
                label: `${displayHours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')} ${ampm}`,
                value: Number(item[metric]).toFixed(2),
                color: getColor(item[metric], metric),
                id: item.id // Keep track of the id
            };
        });

        return {
            labels: chartData.map(item => item.label),
            datasets: [{
                label: label + " Average Level",
                data: chartData.map(item => item.value),
                borderColor: "white",
                borderWidth: 1,
                backgroundColor: averageColor,
                pointBackgroundColor: chartData.map(item => item.color),
                pointBorderColor: "white",
                fill: false,
                pointRadius: 8,
                pointHoverRadius: 10,
                tension: 0.4,
                // Store the ids in the dataset for reference
                ids: chartData.map(item => item.id)
            }],
        };
    };

    // Move this code block inside the SoilQualityByDate component
    const createChartConfigForAverage = (label, data, metric) => {
        // Calculate the average value of the total data inside data
        const totalValue = data.reduce((acc, item) => acc + item.average, 0);
        const averageValue = totalValue / data.length;
        const averageColor = getColor(averageValue, metric);

        return {
            labels: data.map((item) => {
                // Format the hour as "6 AM", "7 AM", etc.
                const hour = item.hour;
                const ampm = hour < 12 ? "AM" : "PM";
                const displayHour = hour % 12 === 0 ? 12 : hour % 12;
                return `${displayHour} ${ampm}`;
            }),
            datasets: [
                {
                    label: `${label} Hourly Average Level`,
                    data: data.map((item) => item.average?.toFixed(2)), // Use the average values
                    borderColor: "white",
                    borderWidth: 1,
                    backgroundColor: averageColor, // Use the average color for the background
                    pointBackgroundColor: data.map((item) => getColor(item.average, metric)),
                    pointBorderColor: "white",
                    fill: false,
                    pointRadius: 8,
                    pointHoverRadius: 10,
                    tension: 0.4,
                },
            ],
        };
    };

    const Legend = ({ thresholds, filteredData, metric, data }) => {
        // Ensure filteredData is defined and has length
        if ((!filteredData || filteredData.length === 0) && (!data || data.length === 0)) {
            return (
                <div style={{ textAlign: "right", padding: "10px", borderRadius: "5px" }}>
                    <h2>No data available for {metric.toUpperCase()}</h2>
                </div>
            );
        }

        let value, status, backgroundColor;

        // Calculate hourly average for the selected hour
        if (viewMode === "hourly") {
            const values = filteredData.map(item => parseFloat(item[metric])).filter(val => !isNaN(val));
            value = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : null;
        } else {
            // Calculate daily average
            const averageData = getFilteredDataForAverage(data, metric);
            value = averageData.length > 0
                ? averageData.reduce((acc, item) => acc + item.average, 0) / averageData.length
                : null;
        }

        // Get status based on value
        if (value !== null && !isNaN(value)) {
            const matchedThreshold = thresholds.find(
                threshold => value >= threshold.min && value <= threshold.max
            );
            status = matchedThreshold ? matchedThreshold.label : "Unknown";
            backgroundColor = matchedThreshold ? matchedThreshold.color : "transparent";
        } else {
            status = "No data";
            backgroundColor = "transparent";
        }

        return (
            <div style={{
                display: "inline-flex",
                justifyContent: "space-between",
                alignItems: "center",
                width: "100%",
                marginTop: "20px",
            }}>
                {/* Legend Container */}
                <div className="legend-container" style={{ marginRight: "20px", width: "50%" }}>
                    {thresholds.map((threshold, index) => (
                        <div
                            key={index}
                            style={{
                                backgroundColor: threshold.color,
                                padding: "5px",
                                borderRadius: "5px",
                                display: "block",
                                marginBottom: "3px",
                                color: "#f5f5f5",
                            }}
                        >
                            <span style={{ fontWeight: "bold" }}>
                                {threshold.label + ": <"}
                            </span>{" "}
                            {threshold.max}
                        </div>
                    ))}
                </div>

                {/* Status Display */}
                <div style={{
                    textAlign: "right",
                    padding: "10px",
                    borderRadius: "5px",
                    width: "50%",
                }}>
                    <h4>
                        {`Average ${metric.toUpperCase()} level for this ${viewMode === "hourly" ? "hour" : "day"} is `}
                        {value !== null && !isNaN(value) ? (
                            <>
                                {value.toFixed(2)}
                                <br />
                                <span style={{
                                    backgroundColor: backgroundColor,
                                    padding: "2px 5px",
                                    borderRadius: "7px",
                                    color: "#fff",
                                }}>
                                    ({status})
                                </span>
                            </>
                        ) : (
                            "No data"
                        )}
                    </h4>
                </div>
            </div>
        );
    };

    const handlePointClick = (event, chartElement) => {
        if (chartElement && chartElement.length > 0) {
            const index = chartElement[0].index;
            const selectedId = event.chart.data.datasets[0].ids[index];
            if (selectedId) {
                const url = `${window.location.origin}/soil-quality/id/${selectedId}`;
                window.open(url, '_blank');
            }
        }
    };

    const calculateAverageColor = (data, metric) => {
        if (data.length === 0) return "rgba(0, 0, 0, 1)"; // Default for no data

        const averageValue =
            data.reduce((acc, item) => acc + item.value, 0) / data.length;

        return getColor(averageValue, metric);
    };

    const renderCharts = () => {
        return (
            <>
                <div style={styles.div2}>
                    {/* Soil Moisture Chart */}
                    <div className="chart-container">
                        {renderChart("Soil Moisture", "soil_moisture")}
                        <Legend
                            thresholds={thresholds.soil_moisture}
                            filteredData={filteredData}
                            metric="soil_moisture"
                            data={soilData}
                        />
                    </div>
                </div>
                <div style={styles.div3}>
                    {/* Temperature Chart */}
                    <div className="chart-container">
                        {renderChart("Temperature", "temperature")}
                        <Legend
                            thresholds={thresholds.temperature}
                            filteredData={filteredData}
                            metric="temperature"
                            data={soilData}
                        />
                    </div>
                </div>
                <div style={styles.div4}>
                    {/* Humidity Chart */}
                    <div className="chart-container">
                        {renderChart("Humidity", "humidity")}
                        <Legend
                            thresholds={thresholds.humidity}
                            filteredData={filteredData}
                            metric="humidity"
                            data={soilData}
                        />
                    </div>
                </div>
            </>
        );
    };

    const chartDescriptions = {
        soil_moisture: "Indicates the amount of water present in the soil. Critical for plant growth and nutrient absorption, and helps assess irrigation needs.",
        humidity: "Reflects the moisture in the air around the soil, which can influence soil evaporation rates and overall water retention.",
        temperature: "Affects soil microbial activity, nutrient availability, and plant root development. Critical for understanding soil health and crop growth conditions."
    };

    const ChartHeader = ({ title, onExpand, hasData, metric }) => (
        <div style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            left: '10px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            zIndex: 10
        }}>
            <MuiTooltip title={chartDescriptions[metric]} arrow placement="top">
                <IconButton size="small" style={{ color: 'white' }}>
                    <InfoIcon />
                </IconButton>
            </MuiTooltip>
            {hasData && (
                <button
                    onClick={onExpand}
                    style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        border: '1px solid white',
                        borderRadius: '4px',
                        color: 'white',
                        padding: '5px 10px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                    }}
                >
                    <span style={{ fontSize: '16px' }}>⤢</span>
                    Expand
                </button>
            )}
        </div>
    );

    const ChartContainer = ({ children, onExpand, hasData, metric }) => (
        <div style={{ position: 'relative' }}>
            <ChartHeader
                onExpand={onExpand}
                hasData={hasData}
                metric={metric}
            />
            {children}
        </div>
    );

    const Modal = ({ isOpen, onClose, children }) => {
        if (!isOpen) return null;

        return (
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 1000
            }}>
                <div style={{
                    backgroundColor: 'rgba(98, 103, 108, 0.95)',
                    padding: '20px',
                    borderRadius: '10px',
                    width: '90%',
                    height: '90%',
                    position: 'relative'
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            position: 'absolute',
                            right: '10px',
                            top: '10px',
                            background: 'none',
                            border: 'none',
                            color: 'white',
                            fontSize: '24px',
                            cursor: 'pointer'
                        }}
                    >
                        ×
                    </button>
                    {children}
                </div>
            </div>
        );
    };

    const renderChart = (label, metric) => {
        const hasData = viewMode === "hourly" ? filteredData.length > 0 : soilData.length > 0;

        return (
            <ChartContainer
                hasData={hasData}
                onExpand={() => {
                    const config = viewMode === "hourly"
                        ? createChartConfig(
                            label,
                            filteredData.map(item => ({
                                value: item[metric],
                                id: item.id
                            })),
                            metric
                        )
                        : createChartConfigForAverage(
                            label,
                            getFilteredDataForAverage(soilData, metric),
                            metric
                        );

                    const expandedOptions = {
                        ...getChartOptions(label, metric),
                        scales: {
                            x: {
                                ticks: { color: 'white' },
                                grid: { color: 'rgba(255, 255, 255, 0.1)' }
                            },
                            y: {
                                ticks: { color: 'white' },
                                grid: { color: 'rgba(255, 255, 255, 0.1)' }
                            }
                        },
                        plugins: {
                            ...getChartOptions(label, metric).plugins,
                            legend: {
                                labels: { color: 'white' }
                            }
                        },
                        maintainAspectRatio: false
                    };

                    setExpandedChart({
                        data: config,
                        options: expandedOptions
                    });
                }}
                metric={metric.toLowerCase()}
            >
                {hasData ? (
                    <Line
                        data={viewMode === "hourly"
                            ? createChartConfig(
                                label,
                                filteredData.map((item) => ({
                                    value: item[metric],
                                    id: item.id,
                                })),
                                metric
                            )
                            : createChartConfigForAverage(
                                label,
                                getFilteredDataForAverage(soilData, metric),
                                metric
                            )}
                        height={250}
                        options={getChartOptions(label, metric)}
                    />
                ) : (
                    <div style={{
                        height: '250px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '1.2rem'
                    }}>
                        No Data found at this hour.
                    </div>
                )}
            </ChartContainer>
        );
    };

    const getChartOptions = (title, metric) => ({
        responsive: true,
        spanGaps: true,
        scales: {
            x: {
                ticks: { color: 'white' },
                title: { color: 'white' },
            },
            y: {
                ticks: { color: 'white' },
                title: { color: 'white' },
            },
        },
        plugins: {
            legend: { position: "top", labels: { color: 'white' } },
            tooltip: {
                callbacks: {
                    label: function (tooltipItem) {
                        const value = tooltipItem.raw;
                        const metricThresholds = thresholds[metric];
                        const matchedThreshold = metricThresholds.find(
                            (threshold) => value <= threshold.max
                        );
                        const thresholdRemark = matchedThreshold?.label || "Unknown";
                        return [`Value: ${value}`, `Status: ${thresholdRemark}`];
                    },
                },
            },
            title: {
                display: true,
                text: title.toUpperCase(),
                padding: { bottom: 10 },
                color: 'white',
            },
        },
        // Only add onClick handler for hourly view
        onClick: viewMode === "hourly" ? handlePointClick : undefined,
    });

    const updateAvailableHours = (data) => {
        const hours = new Set();
        data.forEach(item => {
            const hour = new Date(item.timestamp).getHours();
            hours.add(hour);
        });
        const sortedHours = Array.from(hours).sort((a, b) => a - b);
        setAvailableHours(sortedHours);

        // If current selected hour is not in available hours, select the first available hour
        if (sortedHours.length > 0 && !sortedHours.includes(parseInt(selectedHour))) {
            setSelectedHour(sortedHours[0].toString().padStart(2, "0"));
        }
    };

    return (
        <div style={styles.fullContainer}>
            <header style={styles.header}>
                <h1 style={styles.title}>
                    Soil Quality Data for {new Date(selectedDate).toLocaleDateString()}
                </h1>
            </header>

            <div style={styles.divGrid}>

                {/* DIV 1 - CALENDAR CONTAINER */}
                <div style={styles.div1}>
                    <div style={styles.calendarHeader}>
                        <h3 style={styles.selectDateTitle}>Select Date:</h3>
                        <p style={styles.selectRangeSubtitle}>Select Range to Show Data</p>
                    </div>
                    <div style={styles.calendarContainer}>
                        <div style={{ position: 'relative', width: '100%' }}>
                            <Calendar
                                value={selectedDate}
                                onChange={(date) => {
                                    setSelectedDate(date);
                                }}
                                onActiveStartDateChange={handleMonthChange}
                                tileClassName={tileClassName} // Use tileClassName for custom styles
                            />
                            {isCalendarLoading && (
                                <div style={styles.calendarLoadingOverlay}>
                                    <div style={styles.loadingSpinner}></div>
                                </div>
                            )}
                        </div>
                    </div>
                    {/* Custom styles using Styled JSX */}
                    <style jsx>{`
                    .react-calendar {
                        width: 100%;
                        max-width: 500px;
                        margin: auto;
                        border-radius: 20px;
                        padding: 10px;
                        background-color: rgba(255, 255, 255, 0.6); /* Semi-transparent grey */
                    }

                    .react-calendar__tile {
                        border-radius: 10px; /* Optional: Rounded corners */
                        position: relative;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 60px; /* Set a consistent height */
                        width: 60px; /* Set a consistent width */
                        transition: background-color 0.3s ease, color 0.3s ease; /* Smooth transition for background and text color */
                    }

                    .highlight-tile {
                        background-color: #ffde59 !important; /* Ensure the highlight covers the whole tile */
                        color: black !important; /* Make text stand out */
                        border-radius: 10px; /* Optional: Rounded corners */
                    }

                    /* Hover effect for green tile */
                    .react-calendar__tile:hover {
                        background-color: white !important; /* Change to white on hover */
                        color: #00732f !important; /* Keep the text color green when hovered */
                    }

                    /* Active (clicked) tile - turn blue */
                    .react-calendar__tile--active {
                        background-color: rgba(0, 115, 47, 0.7) !important; /* Blue tile */
                        color: white;
                        border-radius: 10px; /* Optional: Rounded corners */
                    }

                    /* Active state after clicking */
                    .react-calendar__tile--active:focus {
                        background-color: rgba(0, 115, 47, 0.7) !important; /* Blue when clicked */
                        color: white;
                    }

                    /* "Today" tile style */
                    .react-calendar__tile--now {
                        background-color: rgb(0, 123, 255) !important; /* Highlight today with yellow */
                        color: white !important; /* Make text color black for better contrast */
                        border-radius: 10px; /* Optional: Rounded corners */
                    }

                    /* Make "today" tile turn blue when clicked */
                    .react-calendar__tile--now.react-calendar__tile--active {
                        background-color: rgba(0, 115, 47, 0.7) !important; /* Blue when clicked */
                        color: white;
                    }

                    .react-calendar__navigation button {
                        background: rgba(167, 181, 189, 0.5);
                        color: black;
                        border: none; /* Remove border for a cleaner look */
                        border-radius: 5px; /* Optional rounded corners */
                        font-weight: bold; /* Enhance button text */
                        padding: 5px 10px; /* Adjust button padding */
                        transition: background-color 0.3s; /* Smooth hover transition */
                    }

                    .react-calendar__navigation button:hover {
                        background: rgba(5, 218, 255, 0.8); /* Darker blue when hovering */
                    }

                    .has-data {
                        background-color: rgba(255, 255, 255, 0.6) !important;
                        color: black !important;
                        cursor: pointer !important;
                    }

                    .no-data {
                        background-color: rgba(128, 128, 128, 0.3) !important;
                        color: #666 !important;
                        cursor: not-allowed !important;
                        pointer-events: none;
                    }

                    .react-calendar__tile:hover.has-data {
                        background-color: #ffde59 !important;
                        color: black !important;
                    }

                    .react-calendar__tile--active.has-data {
                        background-color: rgba(0, 115, 47, 0.7) !important;
                        color: white !important;
                    }
                `}</style>

                    {/* Added Button and Dropdowns Below */}
                    <div style={styles.controlsContainer}>
                        <div className="view-toggle">
                            <button
                                style={styles.controlButton}
                                onClick={() =>
                                    setViewMode(viewMode === "hourly" ? "average" : "hourly")
                                }
                            >
                                {viewMode === "hourly"
                                    ? "Show Hourly Averages"
                                    : "Show Hourly Data"}
                            </button>
                        </div>
                        <div className="dropdowns-container" style={styles.dropdownContainer}>
                            {/* Only show hour dropdown for hourly view */}
                            {viewMode === "hourly" && (
                                <div className="form-group" style={styles.dropdownGroup}>
                                    <label htmlFor="hourSelect" style={styles.selectButtonLabel}>
                                        Select Hour:
                                    </label>
                                    <select
                                        id="hourSelect"
                                        className="form-control"
                                        value={selectedHour}
                                        onChange={(e) => setSelectedHour(e.target.value)}
                                        style={styles.calendarSelect}
                                    >
                                        {availableHours.map((hour) => {
                                            const date = new Date();
                                            date.setHours(hour, 0, 0, 0);
                                            return (
                                                <option
                                                    key={hour}
                                                    value={hour.toString().padStart(2, "0")}
                                                >
                                                    {date.toLocaleString("en-US", {
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                        hour12: true,
                                                    })}
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {renderCharts()}
                <ToastContainer />
            </div>
            <Modal
                isOpen={expandedChart !== null}
                onClose={() => setExpandedChart(null)}
            >
                <div style={{ width: '100%', height: '100%' }}>
                    {expandedChart && (
                        <Line
                            data={expandedChart.data}
                            options={expandedChart.options}
                            style={{ width: '100%', height: '100%' }}
                        />
                    )}
                </div>
            </Modal>
        </div>
    );
};

const styles = {
    fullContainer: {
        padding: '20px',
        backgroundImage: `url(${backgroundImage})`, // Set the background image
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed', // Prevent background from scrolling with content
        minHeight: '100vh', // Ensures full height
        height: '100%', // Ensures it covers the viewport height
        boxSizing: 'border-box',
        overflow: 'hidden',
        color: '#333',
        width: '100%',
    },
    header: {
        textAlign: 'left',
        marginTop: '15px',
        marginBottom: '50px',
        marginLeft: '70px',
    },
    title: {
        margin: '0',
        fontSize: '2rem',
        color: 'white',

    },

    divGrid: {
        marginLeft: '70px',
        display: 'grid',
        width: '100%',
        gridTemplateColumns: 'repeat(3, 1fr)', // Default for larger screens
        gap: '20px',
        // maxWidth: '1600px',
        margin: '0 auto',
        overflow: 'hidden',
        // backgroundColor: 'rgba(255, 255, 255, 0.9)',
        paddingLeft: '70px',
    },

    // DIV 1CALENDAR CONTAINER CONTENT
    div1: {
        backgroundColor: 'rgba(98, 103, 108, 0.3)',
        borderRadius: '20px',
        fontSize: '1rem',
        fontWeight: 'bold',
        boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)',
        transition: 'transform 0.2s',
        overflowWrap: 'break-word',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column', // Stack the header and calendar vertically
    },
    calendarHeader: {
        display: 'flex',
        justifyContent: 'space-between', // Spread the title and subtitle apart
        alignItems: 'center', // Vertically align the title and subtitle
        width: '100%', // Ensures the header takes the full width
    },
    selectDateTitle: {
        color: "#fff",
        fontSize: "1.8rem",
        marginBottom: "10px", // Space between title and subtitle
        textAlign: "left", // Align title to the left
    },
    selectRangeSubtitle: {
        color: "#ddd",
        fontSize: "1rem",
        textAlign: "right", // Align subtitle to the right
        // marginTop: "15px",
    },
    calendarContainer: {
        marginTop: '20px', // Adds spacing between the subtitle and calendar
        width: '100%', // Ensures the calendar takes up the full width available
        display: 'flex',
        justifyContent: 'center', // Centers the calendar horizontally
    },
    controlsContainer: {
        marginTop: "20px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "15px",
    },
    controlButton: {
        backgroundColor: "rgba(196, 185, 51, 0.7)",
        color: "#fff",
        border: "none",
        padding: "10px 20px",
        borderRadius: "5px",
        cursor: "pointer",
        fontWeight: "bold",
        transition: "background-color 0.3s",
    },
    controlButtonHover: {
        backgroundColor: "rgba(5, 218, 255, 0.8)",
    },
    dropdownContainer: {
        display: "flex",
        gap: "20px",
        flexWrap: "wrap",
        justifyContent: "center",
    },
    dropdownGroup: {
        display: "flex",
        flexDirection: "column",
        gap: "5px",
    },
    selectButtonLabel: {
        color: "#fff",
        fontSize: "1rem",
    },
    calendarSelect: {
        padding: '8px',
        borderRadius: '5px',
        backgroundColor: 'rgba(145, 137, 39, 0.46)',
        color: '#fff',
        border: 'none',
        outline: 'none',
    },

    // DIV 2
    div2: {
        backgroundColor: 'rgba(98, 103, 108, 0.3)',
        // border: '1px solid #ccc',
        borderRadius: '20px',
        textAlign: 'center',
        padding: '20px',
        fontSize: '1rem',
        fontWeight: 'bold',
        color: 'white',
        boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)',
        transition: 'transform 0.2s',
        overflowWrap: 'break-word',
    },

    // DIV 3
    div3: {
        backgroundColor: 'rgba(98, 103, 108, 0.3)',
        // border: '1px solid #ccc',
        borderRadius: '20px',
        textAlign: 'center',
        padding: '20px',
        fontSize: '1rem',
        fontWeight: 'bold',
        color: 'white',
        boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)',
        transition: 'transform 0.2s',
        overflowWrap: 'break-word',
    },

    // DIV 4
    div4: {
        backgroundColor: 'rgba(98, 103, 108, 0.3)',
        // border: '1px solid #ccc',
        borderRadius: '20px',
        textAlign: 'center',
        padding: '20px',
        fontSize: '1rem',
        fontWeight: 'bold',
        color: 'white',
        boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)',
        transition: 'transform 0.2s',
        overflowWrap: 'break-word',
    },

    // DIV 5
    div5: {
        backgroundColor: 'rgba(98, 103, 108, 0.3)',
        // border: '1px solid #ccc',
        borderRadius: '20px',
        textAlign: 'center',
        padding: '20px',
        fontSize: '1rem',
        fontWeight: 'bold',
        color: 'white',
        boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)',
        transition: 'transform 0.2s',
        overflowWrap: 'break-word',
    },

    // DIV 6
    div6: {
        backgroundColor: 'rgba(98, 103, 108, 0.3)',
        // border: '1px solid #ccc',
        borderRadius: '20px',
        textAlign: 'center',
        padding: '20px',
        fontSize: '1rem',
        fontWeight: 'bold',
        color: 'white',
        boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)',
        transition: 'transform 0.2s',
        overflowWrap: 'break-word',
    },

    calendarLoadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: '20px',
    },
    loadingSpinner: {
        width: '40px',
        height: '40px',
        border: '4px solid #f3f3f3',
        borderTop: '4px solid #3498db',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
    },
    '@keyframes spin': {
        '0%': { transform: 'rotate(0deg)' },
        '100%': { transform: 'rotate(360deg)' },
    },

    // box: {
    //     backgroundColor: 'rgba(255, 255, 255, 0.8)',
    //     border: '1px solid #ccc',
    //     borderRadius: '5px',
    //     textAlign: 'center',
    //     padding: '20px',
    //     fontSize: '1rem',
    //     fontWeight: 'bold',
    //     boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)',
    //     transition: 'transform 0.2s',
    //     overflowWrap: 'break-word',
    // },

    // Responsive styles
    '@media (max-width: 1600px)': { // For smaller laptops
        grid: {
            gridTemplateColumns: 'repeat(2, 1fr)', // Two columns
        },
    },
    '@media (max-width: 1024px)': { // For tablets or small laptops
        grid: {
            gridTemplateColumns: 'repeat(1, 1fr)', // Single column
        },
        header: {
            marginLeft: '0', // Align header to center
        },
        fullContainer: {
            padding: '20px', // Adjust padding for smaller screens
        },
    },
};



export default SoilQualityByDate;