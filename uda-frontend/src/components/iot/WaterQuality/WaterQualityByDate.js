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

const WaterQualityByDate = () => {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const { date } = useParams(); // Retrieve locationId from the URL  !!!!!{ date, locationId }!!!!!!
    const [WaterData, setWaterData] = useState([]);
    const [selectedHour, setSelectedHour] = useState("00");
    //    const [selectedLocation, setSelectedLocation] = useState(3);  Default to locationId from URL or 1
    const [highlightedDates, setHighlightedDates] = useState([]);
    // const navigate = useNavigate(); 
    const [viewMode, setViewMode] = useState("average"); // 'hourly' or 'average'
    const [isCalendarLoading, setIsCalendarLoading] = useState(false); // Add new state


    useEffect(() => {
    }, [viewMode]);


    const thresholds = {
        pH: [
            { min: 0, max: 6.49, label: "Too Acidic", color: "rgba(254, 0, 0)" },
            { min: 6.5, max: 8.5, label: "Acceptable", color: "rgba(22, 186, 1)" },
            { min: 8.51, max: Infinity, label: "Too Alkaline", color: "rgba(255, 140, 0)" },
        ],
        temperature: [
            { min: 0, max: 25.99, label: "Too Cold", color: "rgba(255, 140, 0)" },
            { min: 26, max: 30, label: "Acceptable", color: "rgba(22, 186, 1)" },
            { min: 30.01, max: Infinity, label: "Too Hot", color: "rgba(254, 0, 0)" },
        ],
        tss: [
            { min: 0, max: 50, label: "Acceptable", color: "rgba(22, 186, 1)" },
            { min: 50.01, max: Infinity, label: "Too Cloudy", color: "rgba(254, 0, 0)" },
        ],
        tds_ppm: [
            { min: 0, max: 500, label: "Acceptable", color: "rgba(22, 186, 1)" },
            { min: 500.01, max: Infinity, label: "High Dissolved Substances", color: "rgba(254, 0, 0)" },
        ],
    };

    const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    };

    // Add this helper function to format the date for display
    const formatDisplayDate = (date) => {
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // Fetch data for the entire month
    const fetchMonthData = async (startDate, endDate) => {
        try {
            setIsCalendarLoading(true); // Start loading
            // Set start date to 00:00 UTC
            const startDateTime = new Date(Date.UTC(
                startDate.getFullYear(),
                startDate.getMonth(),
                1,
                0, 0, 0, 0
            ));

            // Set end date to 23:59:59.999 UTC
            const endDateTime = new Date(Date.UTC(
                endDate.getFullYear(),
                endDate.getMonth() + 1,

                0,
                23, 59, 59, 999
            ));

            const PAGE_SIZE = 100;
            let currentPage = 0;
            let hasMore = true;
            const allDates = new Set();

            while (hasMore) {
                const { data, error } = await supabase
                    .from("sensor_data")
                    .select("timestamp")
                    .gte("timestamp", startDateTime.toISOString())
                    .lte("timestamp", endDateTime.toISOString())
                    .range(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE - 1)
                    .order('timestamp', { ascending: true });

                if (error) throw error;

                if (!data || data.length === 0) {
                    hasMore = false;
                    break;
                }

                // Process dates in UTC
                data.forEach(item => {
                    const utcDate = new Date(item.timestamp);
                    allDates.add(utcDate.toISOString().split('T')[0]);
                });

                hasMore = data.length === PAGE_SIZE;
                currentPage++;
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            const sortedDates = Array.from(allDates).sort();
            console.log('Water Quality dates in UTC:', sortedDates);
            setHighlightedDates(sortedDates);

        } catch (error) {
            console.error("Error fetching month data:", error);
            toast.error(`Error fetching data: ${error.message}`);
        } finally {
            setIsCalendarLoading(false); // End loading
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

    const tileClassName = ({ date, view }) => {
        if (view === "month") {
            const tileDate = new Date(Date.UTC(
                date.getFullYear(),
                date.getMonth(),
                date.getDate()
            )).toISOString().split('T')[0];

            if (highlightedDates.includes(tileDate)) {
                return "highlight-tile";
            }
        }
        return null;
    };

    // Define fetchData function outside of useEffect
    const fetchData = async () => {
        try {
            const formattedDate = formatDate(selectedDate);
            const startOfDay = new Date(formattedDate);
            const endOfDay = new Date(formattedDate);
            endOfDay.setDate(endOfDay.getDate() + 1);

            const { data, error } = await supabase
                .from("sensor_data")
                .select("*")
                .gte("timestamp", startOfDay.toISOString())
                .lt("timestamp", endOfDay.toISOString());

            if (error) throw error;
            setWaterData(data);
        } catch (error) {
            console.error("Error fetching data:", error);
            toast.error(`Error fetching data: ${error.message}`);
        }
    };

    // Use useEffect to call fetchData when selectedDate changes
    useEffect(() => {
        if (selectedDate) {
            fetchData();
        }
    }, [selectedDate]);

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

    }, [selectedDate]);

    const getFilteredData = (data) => {
        const selectedHourUTC = parseInt(selectedHour);

        return data.filter((item) => {
            const itemDate = new Date(item.timestamp);
            // Use UTC hours to match database timezone
            return itemDate.getUTCHours() === selectedHourUTC;
        });
    };

    const filteredData = getFilteredData(WaterData);

    // Function to filter data by each hour for hourly averages
    // Preprocess WaterData for hourly averages
    const getFilteredDataForAverage = (data, metric) => {
        const hourlyData = data.reduce((acc, item) => {
            // Use UTC hours to match database timezone
            const hour = new Date(item.timestamp).getUTCHours();
            if (!acc[hour]) acc[hour] = { sum: 0, count: 0 };
            if (item[metric] !== null) {  // Check for null values
                acc[hour].sum += item[metric];
                acc[hour].count++;
            }
            return acc;
        }, {});

        return Object.keys(hourlyData).map((hour) => {
            const { sum, count } = hourlyData[hour];
            return {
                hour: parseInt(hour),
                average: count > 0 ? sum / count : 0  // Handle division by zero
            };
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
                // Use UTC time to match database timezone
                const time = new Date(item.timestamp).toLocaleString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    hour12: true,
                    timeZone: "UTC"  // Explicitly use UTC timezone
                });
                return time;
            }),
            datasets: [
                {
                    label: label + " Level",  // Removed "Average" since this is for hourly data
                    data: filteredData.map((item) => Number(item[metric].toFixed(2))),  // Changed data mapping to use direct metric access
                    borderColor: "white",
                    borderWidth: 2,
                    backgroundColor: averageColor,
                    pointBackgroundColor: filteredData.map((item) => getColor(item[metric], metric)),  // Changed to use direct metric access
                    pointBorderColor: "white",
                    fill: false,
                    pointRadius: 8,
                    pointHoverRadius: 10,
                    tension: 0.4,
                },
            ],
            options: {
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                const value = context.parsed.y;
                                const status = thresholds[metric].find(
                                    (threshold) => value >= threshold.min && value <= threshold.max
                                )?.label || "Unknown";
                                return [`${label}: ${value}`, `Status: ${status}`];
                            }
                        }
                    }
                }
            }
        };
    };

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
            options: {
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                const value = context.parsed.y;
                                const status = thresholds[metric].find(
                                    (threshold) => value >= threshold.min && value <= threshold.max
                                )?.label || "Unknown";
                                return [`${label} Average: ${value}`, `Status: ${status}`];
                            }
                        }
                    }
                }
            }
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
            (dailyAverageValue !== null && value !== undefined) && metric ? getStatus(dailyAverageValue, metric) : "No data";
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
                            {value !== null && value !== undefined && filteredData.length > 0 ? (
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
                                <>
                                    No Data
                                    <br></br>
                                    <span
                                        style={{
                                            backgroundColor: "transparent",
                                            padding: "2px 5px",
                                            borderRadius: "7px",
                                            color: "white",
                                        }}
                                    >
                                        (No Data)
                                    </span>
                                </>
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
                const url = `${window.location.origin}/water-quality/id/${selectedInstance.id}`;
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
                    Water Quality Data for {formatDisplayDate(selectedDate)}
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
                                    setViewMode("average");
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
                            {/* Location Dropdown 
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
                            */}
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

                {/* Div 2 - pH */}
                <div style={styles.div2}>
                    <div className="chart-container">
                        {viewMode === "hourly" ? (
                            filteredData.length > 0 ? (
                                <Line
                                    data={createChartConfig(
                                        "pH",
                                        filteredData.map((item) => ({
                                            value: item.pH,
                                            id: item.id,
                                        })),
                                        "pH"
                                    )}
                                    height={250}
                                    options={{
                                        ...createChartConfig(
                                            "pH",
                                            filteredData.map((item) => ({
                                                value: item.pH,
                                                id: item.id,
                                            })),
                                            "pH"
                                        ).options,
                                        onClick: handlePointClick
                                    }}
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
                            )
                        ) : null}

                        {viewMode === "average" && WaterData.length > 0 ? (
                            <Line
                                data={createChartConfigForAverage(
                                    "pH",
                                    getFilteredDataForAverage(WaterData, "pH"),
                                    "pH"
                                )}
                                height={250}
                                options={{
                                    ...createChartConfigForAverage(
                                        "pH",
                                        getFilteredDataForAverage(WaterData, "pH"),
                                        "pH"
                                    ).options,
                                    onClick: handlePointClick
                                }}
                            />
                        ) : null}

                        {/* Legend Component */}
                        <Legend
                            thresholds={thresholds.pH}
                            filteredData={filteredData}
                            metric="pH"
                            data={WaterData}
                        />
                    </div>
                </div>

                {/* Div 3 - Temperature */}
                <div style={styles.div3}>
                    <div className="chart-container">
                        {viewMode === "hourly" ? (
                            filteredData.length > 0 ? (
                                <Line
                                    data={createChartConfig(
                                        "Temperature",
                                        filteredData.map((item) => ({
                                            value: item.temperature,
                                            id: item.id,
                                        })),
                                        "temperature"
                                    )}
                                    height={250}
                                    options={{
                                        ...createChartConfig(
                                            "Temperature",
                                            filteredData.map((item) => ({
                                                value: item.temperature,
                                                id: item.id,
                                            })),
                                            "temperature"
                                        ).options,
                                        onClick: handlePointClick
                                    }}
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
                            )
                        ) : null}

                        {viewMode === "average" && WaterData.length > 0 ? (
                            <Line
                                data={createChartConfigForAverage(
                                    "Temperature",
                                    getFilteredDataForAverage(WaterData, "temperature"),
                                    "temperature"
                                )}
                                height={250}
                                options={{
                                    ...createChartConfigForAverage(
                                        "Temperature",
                                        getFilteredDataForAverage(WaterData, "temperature"),
                                        "temperature"
                                    ).options,
                                    onClick: handlePointClick
                                }}
                            />
                        ) : null}

                        {/* Legend Component */}
                        <Legend
                            thresholds={thresholds.temperature}
                            filteredData={filteredData}
                            metric="temperature"
                            data={WaterData}
                        />
                    </div>
                </div>

                {/* Div 4 - TSS */}
                <div style={styles.div4}>
                    <div className="chart-container">
                        {viewMode === "hourly" ? (
                            filteredData.length > 0 ? (
                                <Line
                                    data={createChartConfig(
                                        "TSS",
                                        filteredData.map((item) => ({
                                            value: item.tss,
                                            id: item.id,
                                        })),
                                        "tss"
                                    )}
                                    height={250}
                                    options={{
                                        ...createChartConfig(
                                            "TSS",
                                            filteredData.map((item) => ({
                                                value: item.tss,
                                                id: item.id,
                                            })),
                                            "tss"
                                        ).options,
                                        onClick: handlePointClick
                                    }}
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
                            )
                        ) : null}

                        {viewMode === "average" && WaterData.length > 0 ? (
                            <Line
                                data={createChartConfigForAverage(
                                    "TSS",
                                    getFilteredDataForAverage(WaterData, "tss"),
                                    "tss"
                                )}
                                height={250}
                                options={{
                                    ...createChartConfigForAverage(
                                        "TSS",
                                        getFilteredDataForAverage(WaterData, "tss"),
                                        "tss"
                                    ).options,
                                    onClick: handlePointClick
                                }}
                            />
                        ) : null}

                        {/* Legend Component */}
                        <Legend
                            thresholds={thresholds.tss}
                            filteredData={filteredData}
                            metric="tss"
                            data={WaterData}
                        />
                    </div>
                </div>

                {/* Div 5 - TDS */}
                <div style={styles.div5}>
                    <div className="chart-container">
                        {viewMode === "hourly" ? (
                            filteredData.length > 0 ? (
                                <Line
                                    data={createChartConfig(
                                        "TDS",
                                        filteredData.map((item) => ({
                                            value: item.tds_ppm,
                                            id: item.id,
                                        })),
                                        "tds_ppm"
                                    )}
                                    height={250}
                                    options={{
                                        ...createChartConfig(
                                            "TDS",
                                            filteredData.map((item) => ({
                                                value: item.tds_ppm,
                                                id: item.id,
                                            })),
                                            "tds_ppm"
                                        ).options,
                                        onClick: handlePointClick
                                    }}
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
                            )
                        ) : null}

                        {viewMode === "average" && WaterData.length > 0 ? (
                            <Line
                                data={createChartConfigForAverage(
                                    "TDS",
                                    getFilteredDataForAverage(WaterData, "tds_ppm"),
                                    "tds_ppm"
                                )}
                                height={250}
                                options={{
                                    ...createChartConfigForAverage(
                                        "TDS",
                                        getFilteredDataForAverage(WaterData, "tds_ppm"),
                                        "tds_ppm"
                                    ).options,
                                    onClick: handlePointClick
                                }}
                            />
                        ) : null}

                        {/* Legend Component */}
                        <Legend
                            thresholds={thresholds.tds_ppm}
                            filteredData={filteredData}
                            metric="tds_ppm"
                            data={WaterData}
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



export default WaterQualityByDate;
