import React, { useEffect, useState } from "react";

import { useParams } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Line } from 'react-chartjs-2';
import backgroundImage from '../../../assets/airdash.png';
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
// import { colors } from "@mui/material";

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

const AirQualityByDate = () => {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const { date } = useParams(); // Retrieve locationId from the URL  !!!!!{ date, locationId }!!!!!!
    const [airData, setAirData] = useState([]);
    const [selectedHour, setSelectedHour] = useState("00");
    const [selectedLocation, setSelectedLocation] = useState(3); // Default to locationId from URL or 1
    const [highlightedDates, setHighlightedDates] = useState([]);
    // const navigate = useNavigate(); 
    const [viewMode, setViewMode] = useState("average"); // 'hourly' or 'average'


    useEffect(() => {
    }, [viewMode]);
    const locations = [
        { id: 1, name: "Lapasan" },
        { id: 2, name: "Agusan" },
        { id: 3, name: "USTP-CDO" },
        { id: 4, name: "El Salvador" },
        { id: 5, name: "Sports Complex" },
    ];

    const location = locations.find(
        (loc) => loc.id === parseInt(selectedLocation)
    );

    const locationName = location ? location.name : "Unknown Location";

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

    const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    };

    // Fetch data for the entire month
    const fetchMonthData = async (startDate, endDate) => {
        try {
            const startFormattedDate = startDate.toISOString().split('T')[0];
            const endFormattedDate = endDate.toISOString().split('T')[0];

            const { data, error } = await supabase
                .from("sensors")
                .select("id, date")
                .gte("date", `${startFormattedDate}T00:00:00+08:00`)  // Use local timezone for the query
                .lte("date", `${endFormattedDate}T23:59:59.999+08:00`)  // Adjust as per the local timezone
                .eq("locationId", selectedLocation);

            if (error) throw error;

            // Create a Set to ensure no duplicate dates
            const uniqueDates = new Set();

            // Format and add dates to the Set
            data.forEach((item) => {
                const localDate = new Date(item.date);
                localDate.setHours(0, 0, 0, 0); // Strip time portion
                uniqueDates.add(localDate.toISOString().split('T')[0]); // Add formatted date
            });

            // Convert the Set back to an array
            setHighlightedDates(Array.from(uniqueDates));
        } catch (error) {
            console.error("Error fetching month data:", error);
            toast.error(`Error fetching data: ${error.message}`);
        }
    };

    const handleMonthChange = ({ activeStartDate }) => {
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

    const tileContent = ({ date, view }) => {
        if (view === "month") {
            const formattedDate = date.toISOString().split('T')[0];
            if (highlightedDates.includes(formattedDate)) {
                return "highlight-tile"; // Apply custom class for highlighted dates
            }
        }
        return null;
    };

    // Define fetchData function outside of useEffect
    const fetchData = async () => {
        try {
            const formattedDate = formatDate(selectedDate); // Ensure your formatDate function respects local timezone
            const { data, error } = await supabase
                .from("sensors")
                .select("*")
                .gte("date", `${formattedDate}T00:00:00+08:00`)  // Use local timezone for the query
                .lt("date", `${formattedDate}T23:59:59.999+08:00`)  // Adjust as per the local timezone
                .eq("locationId", selectedLocation); // Filter by selectedLocation

            if (error) throw error;
            setAirData(data);
        } catch (error) {
            console.error("Error fetching air quality:", error);
            toast.error(`Error fetching air quality: ${error.message}`);
        }
    };

    // Use useEffect to call fetchData when selectedDate or selectedLocation changes
    useEffect(() => {
        if (selectedLocation || selectedDate) {
            fetchData();
        }
    }, [selectedDate, selectedLocation]);

    // Now fetchData is public and can be called from elsewhere in your component


    useEffect(() => {
        const startOfMonth = new Date(
            selectedDate.getFullYear(),
            selectedDate.getMonth(),
            1
        );
        const endOfMonth = new Date(
            selectedDate.getFullYear(),
            selectedDate.getMonth() + 1,
            0
        );
        fetchMonthData(startOfMonth, endOfMonth);

    }, [selectedDate, selectedLocation]);

    const getFilteredData = (data) => {
        const selectedHourUTC = new Date();
        selectedHourUTC.setHours(parseInt(selectedHour), 0, 0, 0);
        const selectedHourUTCString = selectedHourUTC.getUTCHours().toString().padStart(2, "0");

        return data.filter((item) => {
            const itemHour = new Date(item.date)
                .getUTCHours()
                .toString()
                .padStart(2, "0");
            return itemHour === selectedHourUTCString;
        });
    };

    const filteredData = getFilteredData(airData);

    // Function to filter data by each hour for hourly averages
    // Preprocess airData for hourly averages
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
            return { hour: parseInt(hour), average: sum / count }; // Return average per hour
        });
    };
    // Calculate averages from full filtered data
    // Calculate hourly averages based on the entire day

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
        // Calculate the average value of the total data inside filteredData
        const totalValue = filteredData.reduce((acc, item) => acc + item[metric], 0);
        const averageValue = totalValue / filteredData.length;
        const averageColor = getColor(averageValue, metric);

        return {
            labels: filteredData.map((item) => {
                const time = new Date(item.date).toLocaleString("en-US", {
                    timeZone: "Asia/Manila", // Set local time zone
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    hour12: true,
                });
                return time; // Time will be shown in the local timezone
            }),
            datasets: [
                {
                    label: label + " Average Level",
                    data: data.map((item) => Number(item.value.toFixed(2))),
                    borderColor: "white",
                    borderWidth: 2,
                    backgroundColor: averageColor, // Use the average color for the background
                    pointBackgroundColor: data.map((item) => getColor(item.value, metric)),
                    pointBorderColor: "white",
                    fill: false,
                    pointRadius: 8,
                    pointHoverRadius: 10,
                    tension: 0.4,
                },
            ],
        };
    };


    // Create the chart config for hourly averages (for the 'average' view mode)
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
                    data: data.map((item) => Number(item.average.toFixed(2))), // Use the average values
                    borderColor: "white",
                    borderWidth: 2,
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
                <div
                    style={{ textAlign: "right", padding: "10px", borderRadius: "5px" }}
                >
                    <h2>No data available for {metric.toUpperCase()}</h2>
                </div>
            );
        }

        // Get the latest value for the metric
        const totalData = filteredData.reduce((acc, item) => acc + item[metric], 0);
        const latestData = totalData / filteredData.length;

        const value = latestData;

        const averageData = getFilteredDataForAverage(data, metric);

        // Calculate the daily average
        const dailyAverageValue = averageData.reduce((acc, item) => acc + item.average, 0) / averageData.length;

        // Determine the status based on thresholds
        const getStatus = (value, metric) => {
            // Find the first threshold where the value is strictly less than the max
            const level = thresholds.find(
                (threshold) => value >= threshold.min && value <= threshold.max
            );

            // Ensure the status is accurate
            return level ? level.label : "Unknown";
        };

        const status = (value !== null && value !== undefined) && metric ? getStatus(value, metric) : "No data";
        const backgroundColor =
            value !== null ? getColor(value, metric) : "transparent";

        const averageStatus =
            (dailyAverageValue !== null && value !== undefined) && dailyAverageValue && metric ? getStatus(dailyAverageValue, metric) : "No data";
        const averagebackgroundColor =
            dailyAverageValue !== null ? getColor(dailyAverageValue, metric) : "transparent";

        return (
            <div
                style={{
                    display: "inline-flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    width: "100%",
                    marginTop: "20px",
                }}
            >
                {/* Legend Container */}
                <div
                    className="legend-container"
                    style={{ marginRight: "20px", width: "50%" }}
                >
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

                {/* Narrative Report Container */}

                {viewMode === "hourly" && (
                    <div
                        style={{
                            textAlign: "right",
                            padding: "10px",
                            borderRadius: "5px",
                            width: "50%",
                        }}
                    >
                        <h4>
                            {"Average " + metric.toUpperCase()} level for this hour is{" "}
                            {value !== null && value !== undefined ? (
                                <>
                                    {value.toFixed(2)}
                                    <br></br>
                                    <span
                                        style={{
                                            backgroundColor: backgroundColor,
                                            padding: "2px 5px",
                                            borderRadius: "7px",
                                            color: "colors.Black",
                                        }}
                                    >
                                        ({status})
                                    </span>
                                </>
                            ) : (
                                "No data"
                            )}
                        </h4>
                    </div>
                )}
                {viewMode === "average" && (
                    <div
                        style={{
                            textAlign: "right",
                            padding: "10px",
                            borderRadius: "5px",
                            width: "50%",
                        }}
                    >
                        <h4>
                            {"Average " + metric.toUpperCase()} level for this day is{" "}
                            {dailyAverageValue !== null && value !== undefined ? (
                                <>
                                    {dailyAverageValue.toFixed(2)}
                                    <br></br>
                                    <span
                                        style={{
                                            backgroundColor: averagebackgroundColor,
                                            padding: "2px 5px",
                                            borderRadius: "7px",
                                            color: "colors.Black",
                                        }}
                                    >
                                        ({averageStatus})
                                    </span>
                                </>
                            ) : (
                                "No data"
                            )}
                        </h4>
                    </div>
                )}
            </div>
        );
    };

    const handlePointClick = (event, chartElement) => {
        if (chartElement && chartElement.length > 0) {
            const index = chartElement[0].index;
            const selectedInstance = filteredData[index];
            if (selectedInstance) {
                const url = `${window.location.origin}/air-quality/id/${selectedInstance.id}`;
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


    return (
        <div style={styles.fullContainer}>
            <header style={styles.header}>
                <h1 style={styles.title}>
                    Air Quality Data for {date} at {locationName}
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
                        <Calendar
                            value={selectedDate}
                            onChange={(date) => {
                                setSelectedDate(date);
                                setViewMode("average");
                            }}
                            onActiveStartDateChange={handleMonthChange}
                            tileClassName={tileContent} // Use tileClassName for custom styles
                        />
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
                        background-color: #00732f !important; /* Ensure the highlight covers the whole tile */
                        color: white !important; /* Make text stand out */
                        border-radius: 10px; /* Optional: Rounded corners */
                    }

                    /* Hover effect for green tile */
                    .react-calendar__tile:hover {
                        background-color: white !important; /* Change to white on hover */
                        color: #00732f !important; /* Keep the text color green when hovered */
                    }

                    /* Active (clicked) tile - turn blue */
                    .react-calendar__tile--active {
                        background-color: rgba(0, 123, 255, 0.7) !important; /* Blue tile */
                        color: white;
                        border-radius: 10px; /* Optional: Rounded corners */
                    }

                    /* Active state after clicking */
                    .react-calendar__tile--active:focus {
                        background-color: rgba(0, 123, 255, 0.7) !important; /* Blue when clicked */
                        color: white;
                    }

                    /* "Today" tile style */
                    .react-calendar__tile--now {
                        background-color: rgb(255, 222, 89) !important; /* Highlight today with yellow */
                        color: black !important; /* Make text color black for better contrast */
                        border-radius: 10px; /* Optional: Rounded corners */
                    }

                    /* Make "today" tile turn blue when clicked */
                    .react-calendar__tile--now.react-calendar__tile--active {
                        background-color: rgba(0, 123, 255, 0.7) !important; /* Blue when clicked */
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
                            {/* Location Dropdown */}
                            <div className="form-group" style={styles.dropdownGroup}>
                                <label htmlFor="locationSelect" style={styles.selectButtonLabel}>
                                    Select Location:
                                </label>
                                <select
                                    id="locationSelect"
                                    className="form-control"
                                    value={selectedLocation}
                                    onChange={(e) => setSelectedLocation(e.target.value)}
                                    style={styles.calendarSelect}
                                >
                                    {locations.map((location) => (
                                        <option key={location.id} value={location.id}>
                                            {location.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {/* Hour Dropdown */}
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
                                        {Array.from({ length: 24 }, (_, i) => {
                                            const date = new Date();
                                            date.setHours(i, 0, 0, 0);
                                            return (
                                                <option key={i} value={i.toString().padStart(2, "0")}>
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

                {/* Div 2 - PM2.5 */}
                <div style={styles.div2}>
                    <div className="chart-container">
                        {/* Render Hourly Data Chart */}
                        {viewMode === "hourly" && filteredData.length > 0 ? (
                            <Line
                                data={createChartConfig(
                                    "PM25",
                                    filteredData.map((item) => ({
                                        value: item.pm25,
                                        borderColor: "white", // Line color set to white
                                        borderWidth: 2, // Adjust the line thickness
                                        id: item.id,
                                    })),
                                    "pm25"
                                )}
                                height={250} // Adjust the height of the chart in pixels
                                options={{
                                    responsive: true,
                                    spanGaps: true,
                                    scales: {
                                        x: {
                                            ticks: {
                                                color: 'white', // Set X axis tick text color to white
                                            },
                                            title: {
                                                color: 'white', // Set X axis title color to white
                                            },
                                        },
                                        y: {
                                            ticks: {
                                                color: 'white', // Set Y axis tick text color to white
                                            },
                                            title: {
                                                color: 'white', // Set Y axis title color to white
                                            },
                                        },
                                    },
                                    plugins: {
                                        legend: { position: "top", labels: { color: 'white' } }, // Set legend text color to white
                                        tooltip: {
                                            callbacks: {
                                                label: function (tooltipItem) {
                                                    const value = tooltipItem.raw;
                                                    const metricThresholds = thresholds.pm25;

                                                    const matchedThreshold = metricThresholds.find(
                                                        (threshold) => value <= threshold.max
                                                    );
                                                    const thresholdRemark = matchedThreshold
                                                        ? matchedThreshold.label
                                                        : "Emergency";

                                                    return [`Value: ${value}`, `Status: ${thresholdRemark}`];
                                                },
                                            },
                                        },
                                        title: {
                                            display: true,
                                            text: "PM2.5",
                                            padding: { bottom: 10 },
                                            color: 'white',
                                            fontSize: 20,
                                        },
                                    },
                                    onClick: handlePointClick,
                                }}
                            />
                        ) : null}

                        {/* Render Average Data Chart */}
                        {viewMode === "average" && airData.length > 0 ? (
                            <Line
                                data={createChartConfigForAverage(
                                    "PM25",
                                    getFilteredDataForAverage(airData, "pm25"), // Use the preprocessed data for hourly averages
                                    "pm25"
                                )}
                                height={250} // Adjust the height of the chart in pixels
                                options={{
                                    responsive: true,
                                    spanGaps: true,
                                    scales: {
                                        x: {
                                            ticks: {
                                                color: 'white', // Set X axis tick text color to white
                                            },
                                            title: {
                                                color: 'white', // Set X axis title color to white
                                            },
                                        },
                                        y: {
                                            ticks: {
                                                color: 'white', // Set Y axis tick text color to white
                                            },
                                            title: {
                                                color: 'white', // Set Y axis title color to white
                                            },
                                        },
                                    },
                                    plugins: {
                                        legend: { position: "top", labels: { color: 'white' } }, // Set legend text color to white
                                        tooltip: {
                                            callbacks: {
                                                label: function (tooltipItem) {
                                                    const value = tooltipItem.raw;
                                                    const metricThresholds = thresholds.pm25;

                                                    const matchedThreshold = metricThresholds.find(
                                                        (threshold) => value <= threshold.max
                                                    );
                                                    const thresholdRemark = matchedThreshold
                                                        ? matchedThreshold.label
                                                        : "Emergency";

                                                    return [`Value: ${value}`, `Status: ${thresholdRemark}`];
                                                },
                                            },
                                        },
                                        title: {
                                            display: true,
                                            text: "PM2.5",
                                            padding: { bottom: 10 },
                                            color: 'white',
                                        },
                                    },
                                    onClick: handlePointClick,
                                }}
                            />
                        ) : null}

                        {/* Show "No data found for this hour" when there's no data for either chart */}
                        {(viewMode === "hourly" && filteredData.length === 0) || (viewMode === "average" && airData.length === 0) ? (
                            <p>No data found for this hour.</p>
                        ) : null}

                        {/* Legend Component */}
                        <Legend
                            thresholds={thresholds.pm25}
                            filteredData={filteredData}
                            metric="pm25"
                            data={airData}
                        />
                    </div>
                </div>

                {/* Div 3 - PM10 */}
                <div style={styles.div3}>
                    <div className="chart-container">
                        {/* Render Hourly Data Chart for PM10 */}
                        {viewMode === "hourly" && filteredData.length > 0 ? (
                            <Line
                                data={createChartConfig(
                                    "PM10",
                                    filteredData.map((item) => ({
                                        value: item.pm10,
                                        id: item.id,
                                    })),
                                    "pm10"
                                )}
                                height={250} // Adjust the height of the chart in pixels
                                options={{
                                    responsive: true,
                                    spanGaps: true,
                                    plugins: {
                                        legend: { position: "top", labels: { color: 'white' } },
                                        tooltip: {
                                            callbacks: {
                                                label: function (tooltipItem) {
                                                    const value = tooltipItem.raw;
                                                    const metricThresholds = thresholds.pm10;

                                                    const matchedThreshold = metricThresholds.find(
                                                        (threshold) => value <= threshold.max
                                                    );
                                                    const thresholdRemark = matchedThreshold
                                                        ? matchedThreshold.label
                                                        : "Emergency";

                                                    return [`Value: ${value}`, `Status: ${thresholdRemark}`];
                                                },
                                            },
                                        },
                                        title: {
                                            display: true,
                                            text: "PM10",
                                            padding: { bottom: 10 },
                                            color: 'white',
                                        },
                                    },
                                    scales: {
                                        x: {
                                            ticks: {
                                                color: 'white', // Set X axis tick text color to white
                                            },
                                            title: {
                                                color: 'white', // Set X axis title color to white
                                            },
                                        },
                                        y: {
                                            ticks: {
                                                color: 'white', // Set Y axis tick text color to white
                                            },
                                            title: {
                                                color: 'white', // Set Y axis title color to white
                                            },
                                        },
                                    },
                                    onClick: handlePointClick,
                                }}
                            />
                        ) : null}

                        {/* Render Average Data Chart for PM10 */}
                        {viewMode === "average" && airData.length > 0 ? (
                            <Line
                                data={createChartConfigForAverage(
                                    "PM10",
                                    getFilteredDataForAverage(airData, "pm10"), // Use the preprocessed data for hourly averages
                                    "pm10"
                                )}
                                height={250} // Adjust the height of the chart in pixels
                                options={{
                                    responsive: true,
                                    spanGaps: true,
                                    plugins: {
                                        legend: { position: "top", labels: { color: 'white' } },
                                        tooltip: {
                                            callbacks: {
                                                label: function (tooltipItem) {
                                                    const value = tooltipItem.raw;
                                                    const metricThresholds = thresholds.pm10;

                                                    const matchedThreshold = metricThresholds.find(
                                                        (threshold) => value <= threshold.max
                                                    );
                                                    const thresholdRemark = matchedThreshold
                                                        ? matchedThreshold.label
                                                        : "Emergency";

                                                    return [`Value: ${value}`, `Status: ${thresholdRemark}`];
                                                },
                                            },
                                        },
                                        title: {
                                            display: true,
                                            text: "PM10",
                                            padding: { bottom: 10 },
                                            color: 'white',
                                        },
                                    },
                                    scales: {
                                        x: {
                                            ticks: {
                                                color: 'white', // Set X axis tick text color to white
                                            },
                                            title: {
                                                color: 'white', // Set X axis title color to white
                                            },
                                        },
                                        y: {
                                            ticks: {
                                                color: 'white', // Set Y axis tick text color to white
                                            },
                                            title: {
                                                color: 'white', // Set Y axis title color to white
                                            },
                                        },
                                    },
                                    onClick: handlePointClick,
                                }}
                            />
                        ) : null}

                        {/* Show "No data found for this hour" when there's no data for either chart */}
                        {(viewMode === "hourly" && filteredData.length === 0) || (viewMode === "average" && airData.length === 0) ? (
                            <p>No data found for this hour.</p>
                        ) : null}

                        {/* Legend Component */}
                        <Legend
                            thresholds={thresholds.pm10}
                            filteredData={filteredData}
                            metric="pm10"
                            data={airData}
                        />
                    </div>
                </div>

                {/* Div 4 - Humidity */}
                <div style={styles.div4}>
                    <div className="chart-container">
                        {/* Render Hourly Data Chart for Humidity */}
                        {viewMode === "hourly" && filteredData.length > 0 ? (
                            <Line
                                data={createChartConfig(
                                    "Humidity",
                                    filteredData.map((item) => ({
                                        value: item.humidity,
                                        id: item.id,
                                    })),
                                    "humidity"
                                )}
                                height={250} // Adjust the height of the chart in pixels
                                options={{
                                    responsive: true,
                                    spanGaps: true,
                                    plugins: {
                                        legend: { position: "top", labels: { color: 'white' } },
                                        tooltip: {
                                            callbacks: {
                                                label: function (tooltipItem) {
                                                    const value = tooltipItem.raw;
                                                    const metricThresholds = thresholds.humidity;

                                                    const matchedThreshold = metricThresholds.find(
                                                        (threshold) => value <= threshold.max
                                                    );
                                                    const thresholdRemark = matchedThreshold
                                                        ? matchedThreshold.label
                                                        : "Emergency";

                                                    return [`Value: ${value}`, `Status: ${thresholdRemark}`];
                                                },
                                            },
                                        },
                                        title: {
                                            display: true,
                                            text: "HUMIDITY",
                                            padding: { bottom: 10 },
                                            color: 'white',
                                        },
                                    },
                                    scales: {
                                        x: {
                                            ticks: {
                                                color: 'white', // Set X axis tick text color to white
                                            },
                                            title: {
                                                color: 'white', // Set X axis title color to white
                                            },
                                        },
                                        y: {
                                            ticks: {
                                                color: 'white', // Set Y axis tick text color to white
                                            },
                                            title: {
                                                color: 'white', // Set Y axis title color to white
                                            },
                                        },
                                    },
                                    onClick: handlePointClick,
                                }}
                            />
                        ) : null}

                        {/* Render Average Data Chart for Humidity */}
                        {viewMode === "average" && airData.length > 0 ? (
                            <Line
                                data={createChartConfigForAverage(
                                    "Humidity",
                                    getFilteredDataForAverage(airData, "humidity"), // Use the preprocessed data for hourly averages
                                    "humidity"
                                )}
                                height={250} // Adjust the height of the chart in pixels
                                options={{
                                    responsive: true,
                                    spanGaps: true,
                                    plugins: {
                                        legend: { position: "top", labels: { color: 'white' } },
                                        tooltip: {
                                            callbacks: {
                                                label: function (tooltipItem) {
                                                    const value = tooltipItem.raw;
                                                    const metricThresholds = thresholds.humidity;

                                                    const matchedThreshold = metricThresholds.find(
                                                        (threshold) => value <= threshold.max
                                                    );
                                                    const thresholdRemark = matchedThreshold
                                                        ? matchedThreshold.label
                                                        : "Emergency";

                                                    return [`Value: ${value}`, `Status: ${thresholdRemark}`];
                                                },
                                            },
                                        },
                                        title: {
                                            display: true,
                                            text: "HUMIDITY",
                                            padding: { bottom: 10 },
                                            color: 'white',
                                        },
                                    },
                                    scales: {
                                        x: {
                                            ticks: {
                                                color: 'white', // Set X axis tick text color to white
                                            },
                                            title: {
                                                color: 'white', // Set X axis title color to white
                                            },
                                        },
                                        y: {
                                            ticks: {
                                                color: 'white', // Set Y axis tick text color to white
                                            },
                                            title: {
                                                color: 'white', // Set Y axis title color to white
                                            },
                                        },
                                    },
                                    onClick: handlePointClick,
                                }}
                            />
                        ) : null}

                        {/* Show "No data found for this hour" when there's no data for either chart */}
                        {(viewMode === "hourly" && filteredData.length === 0) || (viewMode === "average" && airData.length === 0) ? (
                            <p>No data found for this hour.</p>
                        ) : null}

                        {/* Legend Component */}
                        <Legend
                            thresholds={thresholds.humidity}
                            filteredData={filteredData}
                            metric="humidity"
                            data={airData}
                        />
                    </div>
                </div>

                {/* Div 5 - Temperature */}
                <div style={styles.div5}>
                    <div className="chart-container">
                        {/* Render Hourly Data Chart for Temperature */}
                        {viewMode === "hourly" && filteredData.length > 0 ? (
                            <Line
                                data={createChartConfig(
                                    "Temperature",
                                    filteredData.map((item) => ({
                                        value: item.temperature,
                                        id: item.id,
                                    })),
                                    "temperature"
                                )}
                                height={250} // Adjust the height of the chart in pixels
                                options={{
                                    responsive: true,
                                    spanGaps: true,
                                    plugins: {
                                        legend: { position: "top", labels: { color: 'white' } },
                                        tooltip: {
                                            callbacks: {
                                                label: function (tooltipItem) {
                                                    const value = tooltipItem.raw;
                                                    const metricThresholds = thresholds.temperature;

                                                    const matchedThreshold = metricThresholds.find(
                                                        (threshold) => value <= threshold.max
                                                    );
                                                    const thresholdRemark = matchedThreshold
                                                        ? matchedThreshold.label
                                                        : "Emergency";

                                                    return [`Value: ${value}`, `Status: ${thresholdRemark}`];
                                                },
                                            },
                                        },
                                        title: {
                                            display: true,
                                            text: "TEMPERATURE",
                                            padding: { bottom: 10 },
                                            color: 'white',
                                        },
                                    },
                                    scales: {
                                        x: {
                                            ticks: {
                                                color: 'white', // Set X axis tick text color to white
                                            },
                                            title: {
                                                color: 'white', // Set X axis title color to white
                                            },
                                        },
                                        y: {
                                            ticks: {
                                                color: 'white', // Set Y axis tick text color to white
                                            },
                                            title: {
                                                color: 'white', // Set Y axis title color to white
                                            },
                                        },
                                    },
                                    onClick: handlePointClick,
                                }}
                            />
                        ) : null}

                        {/* Render Average Data Chart for Temperature */}
                        {viewMode === "average" && airData.length > 0 ? (
                            <Line
                                data={createChartConfigForAverage(
                                    "Temperature",
                                    getFilteredDataForAverage(airData, "temperature"), // Use the preprocessed data for hourly averages
                                    "temperature"
                                )}
                                height={250} // Adjust the height of the chart in pixels
                                options={{
                                    responsive: true,
                                    spanGaps: true,
                                    plugins: {
                                        legend: { position: "top", labels: { color: 'white' } },
                                        tooltip: {
                                            callbacks: {
                                                label: function (tooltipItem) {
                                                    const value = tooltipItem.raw;
                                                    const metricThresholds = thresholds.temperature;

                                                    const matchedThreshold = metricThresholds.find(
                                                        (threshold) => value <= threshold.max
                                                    );
                                                    const thresholdRemark = matchedThreshold
                                                        ? matchedThreshold.label
                                                        : "Emergency";

                                                    return [`Value: ${value}`, `Status: ${thresholdRemark}`];
                                                },
                                            },
                                        },
                                        title: {
                                            display: true,
                                            text: "TEMPERATURE",
                                            padding: { bottom: 10 },
                                            color: 'white',
                                        },
                                    },
                                    scales: {
                                        x: {
                                            ticks: {
                                                color: 'white', // Set X axis tick text color to white
                                            },
                                            title: {
                                                color: 'white', // Set X axis title color to white
                                            },
                                        },
                                        y: {
                                            ticks: {
                                                color: 'white', // Set Y axis tick text color to white
                                            },
                                            title: {
                                                color: 'white', // Set Y axis title color to white
                                            },
                                        },
                                    },
                                    onClick: handlePointClick,
                                }}
                            />
                        ) : null}

                        {/* Show "No data found for this hour" when there's no data for either chart */}
                        {(viewMode === "hourly" && filteredData.length === 0) || (viewMode === "average" && airData.length === 0) ? (
                            <p>No data found for this hour.</p>
                        ) : null}

                        {/* Legend Component */}
                        <Legend
                            thresholds={thresholds.temperature}
                            filteredData={filteredData}
                            metric="temperature"
                            data={airData}
                        />
                    </div>
                </div>

                {/* Div 6 - Oxygen */}
                <div style={styles.div6}>
                    <div className="chart-container">
                        {/* Render Hourly Data Chart for Oxygen */}
                        {viewMode === "hourly" && filteredData.length > 0 ? (
                            <Line
                                data={createChartConfig(
                                    "Oxygen",
                                    filteredData.map((item) => ({
                                        value: item.oxygen,
                                        id: item.id,
                                    })),
                                    "oxygen"
                                )}
                                height={250} // Adjust the height of the chart in pixels
                                options={{
                                    responsive: true,
                                    spanGaps: true,
                                    plugins: {
                                        legend: { position: "top", labels: { color: 'white' } },
                                        tooltip: {
                                            callbacks: {
                                                label: function (tooltipItem) {
                                                    const value = tooltipItem.raw;
                                                    const metricThresholds = thresholds.oxygen;

                                                    const matchedThreshold = metricThresholds.find(
                                                        (threshold) => value <= threshold.max
                                                    );
                                                    const thresholdRemark = matchedThreshold
                                                        ? matchedThreshold.label
                                                        : "Emergency";

                                                    return [`Value: ${value}`, `Status: ${thresholdRemark}`];
                                                },
                                            },
                                        },
                                        title: {
                                            display: true,
                                            text: "OXYGEN",
                                            padding: { bottom: 10 },
                                            color: 'white',
                                        },
                                    },
                                    scales: {
                                        x: {
                                            ticks: {
                                                color: 'white', // Set X axis tick text color to white
                                            },
                                            title: {
                                                color: 'white', // Set X axis title color to white
                                            },
                                        },
                                        y: {
                                            ticks: {
                                                color: 'white', // Set Y axis tick text color to white
                                            },
                                            title: {
                                                color: 'white', // Set Y axis title color to white
                                            },
                                        },
                                    },
                                    onClick: handlePointClick,
                                }}
                            />
                        ) : null}

                        {/* Render Average Data Chart for Oxygen */}
                        {viewMode === "average" && airData.length > 0 ? (
                            <Line
                                data={createChartConfigForAverage(
                                    "Oxygen",
                                    getFilteredDataForAverage(airData, "oxygen"), // Use the preprocessed data for hourly averages
                                    "oxygen"
                                )}
                                height={250} // Adjust the height of the chart in pixels
                                options={{
                                    responsive: true,
                                    spanGaps: true,
                                    plugins: {
                                        legend: { position: "top", labels: { color: 'white' } },
                                        tooltip: {
                                            callbacks: {
                                                label: function (tooltipItem) {
                                                    const value = tooltipItem.raw;
                                                    const metricThresholds = thresholds.oxygen;

                                                    const matchedThreshold = metricThresholds.find(
                                                        (threshold) => value <= threshold.max
                                                    );
                                                    const thresholdRemark = matchedThreshold
                                                        ? matchedThreshold.label
                                                        : "Emergency";

                                                    return [`Value: ${value}`, `Status: ${thresholdRemark}`];
                                                },
                                            },
                                        },
                                        title: {
                                            display: true,
                                            text: "OXYGEN",
                                            padding: { bottom: 10 },
                                            color: 'white',
                                        },
                                    },
                                    scales: {
                                        x: {
                                            ticks: {
                                                color: 'white', // Set X axis tick text color to white
                                            },
                                            title: {
                                                color: 'white', // Set X axis title color to white
                                            },
                                        },
                                        y: {
                                            ticks: {
                                                color: 'white', // Set Y axis tick text color to white
                                            },
                                            title: {
                                                color: 'white', // Set Y axis title color to white
                                            },
                                        },
                                    },
                                    onClick: handlePointClick,
                                }}
                            />
                        ) : null}

                        {/* Show "No data found for this hour" when there's no data for either chart */}
                        {(viewMode === "hourly" && filteredData.length === 0) || (viewMode === "average" && airData.length === 0) ? (
                            <p>No data found for this hour.</p>
                        ) : null}

                        {/* Legend Component */}
                        <Legend
                            thresholds={thresholds.oxygen}
                            filteredData={filteredData}
                            metric="oxygen"
                            data={airData}
                        />
                    </div>
                </div>
                <ToastContainer />
            </div>
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
        gridTemplateColumns: 'repeat(3, 1fr)', // Default for larger screens
        gap: '20px',
        maxWidth: '1600px',
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
        backgroundColor: "rgba(0, 123, 255, 0.7)",
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
        backgroundColor: 'rgba(27, 119, 211, 0.46)',
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



export default AirQualityByDate;