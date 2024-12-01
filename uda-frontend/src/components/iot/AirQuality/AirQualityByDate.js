import React, { useEffect, useState } from "react";

import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Line } from "react-chartjs-2";
import Sidebar from "../../Sidebar";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
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
    const { date, locationId } = useParams(); // Retrieve locationId from the URL
    const [airData, setAirData] = useState([]);
    const [selectedHour, setSelectedHour] = useState("00");
    const [selectedLocation, setSelectedLocation] = useState(3); // Default to locationId from URL or 1
    const [highlightedDates, setHighlightedDates] = useState([]);
    const navigate = useNavigate();
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
            { min: 0, max: 24.99, label: "Good", color: "rgba(75, 192, 192, 1)" },
            { min: 25, max: 34.99, label: "Fair", color: "rgba(154, 205, 50, 1)" },
            { min: 34.9, max: 44.99, label: "Unhealthy", color: "rgba(255, 206, 86, 1)" },
            { min: 45, max: 54.99, label: "Very Unhealthy", color: "rgba(255, 140, 0, 1)" },
            { min: 55, max: 89.99, label: "Severely Unhealthy", color: "rgba(255, 99, 132, 1)" },
            { min: 90, max: Infinity, label: "Emergency", color: "rgba(139, 0, 0, 1)" },
        ],
        pm10: [
            { min: 0, max: 49.99, label: "Good", color: "rgba(75, 192, 192, 1)" },
            { min: 50, max: 99.99, label: "Fair", color: "rgba(154, 205, 50, 1)" },
            { min: 100, max: 149.99, label: "Unhealthy", color: "rgba(255, 206, 86, 1)" },
            { min: 150, max: 199.99, label: "Very Unhealthy", color: "rgba(255, 140, 0, 1)" },
            { min: 200, max: 299.99, label: "Severely Unhealthy", color: "rgba(255, 99, 132, 1)" },
            { min: 300, max: Infinity, label: "Emergency", color: "rgba(139, 0, 0, 1)" },
        ],
        humidity: [
            { min: 0, max: 23.99, label: "Poor", color: "rgba(139, 0, 0, 1)" },
            { min: 24, max: 29.99, label: "Fair", color: "rgba(255, 206, 86, 1)" },
            { min: 30, max: 59.99, label: "Good", color: "rgba(75, 192, 192, 1)" },
            { min: 60, max: 69.99, label: "Fair", color: "rgba(154, 205, 50, 1)" },
            { min: 70, max: Infinity, label: "Poor", color: "rgba(255, 99, 132, 1)" },
        ],
        temperature: [
            { min: 0, max: 32.99, label: "Good", color: "rgba(75, 192, 192, 1)" },
            { min: 33, max: 40.99, label: "Caution", color: "rgba(255, 206, 86, 1)" },
            { min: 41, max: 53.99, label: "Danger", color: "rgba(255, 140, 0, 1)" },
            { min: 54, max: Infinity, label: "Extreme Danger", color: "rgba(139, 0, 0, 1)" },
        ],
        oxygen: [
            { min: 0, max: 19.49, label: "Poor", color: "rgba(255, 206, 86, 1)" },
            { min: 19.5, max: Infinity, label: "Safe", color: "rgba(75, 192, 192, 1)" },
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
                return (
                    <div style={{ backgroundColor: "#4caf50", borderRadius: "50%" }}>
                        &nbsp;
                    </div>
                );
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
                    data: data.map((item) => item.value.toFixed(2)),
                    borderColor: "rgba(0, 0, 0, 1)",
                    borderWidth: 1,
                    backgroundColor: averageColor, // Use the average color for the background
                    pointBackgroundColor: data.map((item) => getColor(item.value, metric)),
                    pointBorderColor: "rgba(0, 0, 0, 1)",
                    fill: false,
                    pointRadius: 8,
                    pointHoverRadius: 10,
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
                    data: data.map((item) => item.average.toFixed(2)), // Use the average values
                    borderColor: "rgba(0, 0, 0, 1)",
                    borderWidth: 1,
                    backgroundColor: averageColor, // Use the average color for the background
                    pointBackgroundColor: data.map((item) => getColor(item.average, metric)),
                    pointBorderColor: "rgba(0, 0, 0, 1)",
                    fill: false,
                    pointRadius: 8,
                    pointHoverRadius: 10,
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
        <Sidebar>
            <div className="container-fluid">
                <h2 style={{ textAlign: "center", marginBottom: "40px" }}>
                    Air Quality Data for {date} at {locationName}
                </h2>
                <div>
                    <h3 style={{ textAlign: "center", marginBottom: "40px" }}>
                        Select Date:
                    </h3>
                    <Calendar
                        value={selectedDate}
                        onChange={(date) => {
                            setSelectedDate(date);
                            setViewMode("average");
                        }}
                        onActiveStartDateChange={handleMonthChange}
                        tileContent={tileContent}
                    />
                </div>
                <div className="view-toggle">
                    <button
                        onClick={() =>
                            setViewMode(viewMode === "hourly" ? "average" : "hourly")
                        }
                    >
                        {viewMode === "hourly"
                            ? "Show Hourly Averages"
                            : "Show Hourly Data"}
                    </button>
                </div>
                <div className="dropdowns-container">
                    {/* Location Dropdown */}
                    <div className="form-group">
                        <label htmlFor="locationSelect">Select Location:</label>
                        <select
                            id="locationSelect"
                            className="form-control"
                            value={selectedLocation}
                            onChange={(e) => setSelectedLocation(e.target.value)}
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
                        <div className="form-group">
                            <label htmlFor="hourSelect">Select Hour:</label>
                            <select
                                id="hourSelect"
                                className="form-control"
                                value={selectedHour}
                                onChange={(e) => setSelectedHour(e.target.value)}
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

                <div className="charts-flex-container">
                    {["pm25", "pm10", "humidity", "temperature", "oxygen"].map(
                        (metric, index) => (
                            <div key={index} className="chart-item">
                                <div className="chart-container">
                                    {/* Render Hourly Data Chart */}
                                    {viewMode === "hourly" && (
                                        filteredData.length > 0 ? (
                                            <Line
                                                data={createChartConfig(
                                                    metric.toUpperCase(),
                                                    filteredData.map((item) => ({
                                                        value: item[metric],
                                                        id: item.id,
                                                    })),
                                                    metric
                                                )}
                                                options={{
                                                    responsive: true,
                                                    spanGaps: true,
                                                    plugins: {
                                                        legend: { position: "top", backgroundColor: calculateAverageColor(filteredData, metric) },
                                                        tooltip: {
                                                            callbacks: {
                                                                label: function (tooltipItem) {
                                                                    const value = tooltipItem.raw;
                                                                    const metricThresholds = thresholds[metric];

                                                                    // Find the appropriate threshold for the current value
                                                                    const matchedThreshold =
                                                                        metricThresholds.find(
                                                                            (threshold) => value <= threshold.max
                                                                        );

                                                                    // Get the label or fallback to "Emergency" if no match is found
                                                                    const thresholdRemark = matchedThreshold
                                                                        ? matchedThreshold.label
                                                                        : "Emergency";

                                                                    return [
                                                                        `Value: ${value}`,
                                                                        `Status: ${thresholdRemark}`,
                                                                    ];
                                                                },
                                                            },
                                                        },
                                                        title: {
                                                            display: true,
                                                            text: `${metric.toUpperCase()} Levels`,
                                                            padding: { bottom: 10 },
                                                        },
                                                    },
                                                    onClick: handlePointClick,
                                                }}
                                            />
                                        ) : (
                                            <p>No data found for this hour.</p>
                                        )
                                    )}

                                    {/* Render Average Data Chart */}
                                    {viewMode === "average" && (
                                        airData.length > 0 ? (
                                            <Line
                                                data={createChartConfigForAverage(
                                                    metric.toUpperCase(),
                                                    getFilteredDataForAverage(airData, metric), // Use the preprocessed data for hourly averages
                                                    metric
                                                )}
                                                options={{
                                                    responsive: true,
                                                    spanGaps: true,
                                                    plugins: {
                                                        legend: { position: "top" },
                                                        tooltip: {
                                                            callbacks: {
                                                                label: function (tooltipItem) {
                                                                    const value = tooltipItem.raw;
                                                                    const metricThresholds = thresholds[metric];

                                                                    const matchedThreshold =
                                                                        metricThresholds.find(
                                                                            (threshold) => value <= threshold.max
                                                                        );
                                                                    const thresholdRemark = matchedThreshold
                                                                        ? matchedThreshold.label
                                                                        : "Emergency";

                                                                    return [
                                                                        `Value: ${value}`,
                                                                        `Status: ${thresholdRemark}`,
                                                                    ];
                                                                },
                                                            },
                                                        },
                                                        title: {
                                                            display: true,
                                                            text: `${metric.toUpperCase()} Hourly Averages`,
                                                            padding: { bottom: 10 },
                                                        },
                                                    },
                                                    onClick: handlePointClick,
                                                }}
                                            />
                                        )
                                            : (
                                                <p>No data found for this day.</p>
                                            )

                                    )}
                                    <Legend
                                        thresholds={thresholds[metric]}
                                        filteredData={filteredData}
                                        metric={metric}
                                        data={airData}
                                    />
                                </div>
                            </div>
                        )
                    )}
                </div>


                <ToastContainer />
                <style jsx>{`

                .react-calendar {
                width: 100%;
                max-width: 500px;
                margin: auto;
                border: 1px solid #ddd;
                border-radius: 10px;
                padding: 10px;
                }

                .react-calendar__tile--active {
                background: #007bff;
                color: white;
                 },
    
                .h2 {
                    width: 50%;
                }
                .dropdowns-container {
                    display: flex;
                    gap: 20px;
                    align-items: flex-end;
                    margin-bottom: 20px;
                    flex-wrap: wrap;
                }
                    
                .charts-flex-container {
                    display: flex;
                    flex-wrap: wrap;
                    justify-content: space-around;
                    gap: 20px;
                }

                .chart-item {
                    width: 100%;
                    max-width: 500px;
                    margin: 20px 0;
                    border-radius: 10px;
                    
                }

                .chart-container {
                    padding: 20px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.5);
                    border-radius: 10px;
                    background-color: #fff;
                }

                .legend-container {
                    display: 'flex'
                    margin-top: 10px;
                    font-size: 14px;
                    color: #333;
                }
                .container-fluid {
                background-color:#808080;
                }
            `}</style>
            </div>
        </Sidebar>
    );
};

export default AirQualityByDate;