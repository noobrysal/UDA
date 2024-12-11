import React, { useEffect, useState } from "react";

import { useParams, useNavigate } from 'react-router-dom';
import axiosClient from './axiosClient';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Line } from 'react-chartjs-2';
// import Sidebar from '../../Sidebar';
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
    const [selectedDate, setSelectedDate] = useState(new Date());
    const { } = useParams();
    const [soilData, setSoilData] = useState([]);
    const [selectedHour, setSelectedHour] = useState("00");
    const [highlightedDates, setHighlightedDates] = useState([]);
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState("average");

    const thresholds = {
        soil_moisture: [
            { min: 0, max: 19.99, label: "Dry", color: "rgba(255, 99, 132, 1)" }, // Poor
            { min: 20, max: 39.99, label: "Low Moisture", color: "rgba(255, 206, 86, 1)" }, // Warning
            { min: 40, max: 70.99, label: "Optimal", color: "rgba(75, 192, 192, 1)" }, // Good
            { min: 71, max: 100, label: "Saturated", color: "rgba(154, 205, 50, 1)" }, // Caution
            { min: 101, max: Infinity, label: "Waterlogged", color: "rgba(139, 0, 0, 1)" }, // Emergency
        ],
        temperature: [
            { min: -Infinity, max: 4.99, label: "Cold", color: "rgba(139, 0, 0, 1)" }, // Poor
            { min: 5, max: 14.99, label: "Cool", color: "rgba(255, 206, 86, 1)" }, // Warning
            { min: 15, max: 29.99, label: "Optimal", color: "rgba(75, 192, 192, 1)" }, // Good
            { min: 30, max: 34.99, label: "Warm", color: "rgba(255, 206, 86, 1)" }, // Caution
            { min: 35, max: Infinity, label: "Hot", color: "rgba(255, 99, 132, 1)" }, // Danger
        ],
        humidity: [
            { min: 0, max: 29.99, label: "Dry", color: "rgba(255, 99, 132, 1)" }, // Poor
            { min: 30, max: 49.99, label: "Low Humidity", color: "rgba(255, 206, 86, 1)" }, // Warning
            { min: 50, max: 70.99, label: "Optimal", color: "rgba(75, 192, 192, 1)" }, // Good
            { min: 71, max: 85.99, label: "High Humidity", color: "rgba(154, 205, 50, 1)" }, // Caution
            { min: 86, max: Infinity, label: "Waterlogged", color: "rgba(139, 0, 0, 1)" }, // Emergency
        ],
    };


    const formatDate = (date) => {
        // Adjust the date to local timezone
        const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
        const year = localDate.getFullYear();
        const month = String(localDate.getMonth() + 1).padStart(2, "0");
        const day = String(localDate.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    };

    // Fetch data for the entire month
    const fetchMonthData = async (startDate, endDate) => {
        try {
            // Adjust dates to local timezone
            const startFormatted = new Date(startDate.getTime() - (startDate.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
            const endFormatted = new Date(endDate.getTime() - (endDate.getTimezoneOffset() * 60000)).toISOString().split('T')[0];

            const response = await axiosClient.get('', {
                params: {
                    startDate: startFormatted,
                    endDate: endFormatted
                }
            });

            const uniqueDates = new Set(
                response.data.map(item => {
                    // Convert timestamp to local date
                    const itemDate = new Date(item.timestamp);
                    const localDate = new Date(itemDate.getTime() - (itemDate.getTimezoneOffset() * 60000));
                    return localDate.toISOString().split('T')[0];
                })
            );

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
            // Adjust the date to local timezone
            const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
            const formattedDate = localDate.toISOString().split('T')[0];

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
            // Use the hour directly from the timestamp without timezone conversion
            const itemHour = new Date(item.timestamp).getHours();
            return itemHour === selectedHourUTC;
        });
    };

    const filteredData = getFilteredData(soilData);

    // Function to filter data by each hour for hourly averages
    // Preprocess airData for hourly averages
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
    `   `

    const createChartConfig = (label, data, metric) => {
        const totalValue = filteredData.reduce((acc, item) => acc + parseFloat(item[metric]), 0);
        const averageValue = totalValue / filteredData.length;
        const averageColor = getColor(averageValue, metric);

        // Sort the filtered data chronologically by timestamp
        const sortedData = [...filteredData].sort((a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        return {
            labels: sortedData.map((item) => {
                const date = new Date(item.timestamp);
                return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
            }),
            datasets: [
                {
                    label: label + " Average Level",
                    data: data.map((item) => Number(item.value).toFixed(2)), // Format to 2 decimal places
                    borderColor: "rgba(0, 0, 0, 1)",
                    borderWidth: 1,
                    backgroundColor: averageColor,
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
                    data: data.map((item) => item.average?.toFixed(2)), // Use the average values
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
        // Move getStatus function to the top
        const getStatus = (value, metric) => {
            // Find the first threshold where the value is strictly less than the max
            const level = thresholds.find(
                (threshold) => value >= threshold.min && value <= threshold.max
            );

            // Ensure the status is accurate
            return level ? level.label : "Unknown";
        };

        // Ensure filteredData is defined and has length
        if ((!filteredData || filteredData.length === 0) && (!data || data.length === 0)) {
            return (
                <div style={{ textAlign: "right", padding: "10px", borderRadius: "5px" }}>
                    <h2>No data available for {metric.toUpperCase()}</h2>
                </div>
            );
        }

        // Update how we calculate the hourly value
        const value = filteredData.length > 0
            ? filteredData.reduce((acc, item) => acc + parseFloat(item[metric] || 0), 0) / filteredData.length
            : null;

        // Get status and background color only if we have a valid value
        const status = (value !== null && !isNaN(value)) && metric ? getStatus(value, metric) : "No data";
        const backgroundColor = (value !== null && !isNaN(value)) ? getColor(value, metric) : "transparent";

        const averageData = getFilteredDataForAverage(data, metric);

        // Calculate the daily average
        const dailyAverageValue = averageData.reduce((acc, item) => acc + item.average, 0) / averageData.length;

        const averageStatus =
            (dailyAverageValue !== null && value !== undefined) && dailyAverageValue && metric ? getStatus(dailyAverageValue, metric) : "No data";
        const averagebackgroundColor =
            dailyAverageValue !== null ? getColor(dailyAverageValue, metric) : "transparent";

        // Rest of the Legend component remains the same
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
                            {value !== null && !isNaN(value) ? (
                                <>
                                    {value?.toFixed(2)}
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
                                    {dailyAverageValue?.toFixed(2)}
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

    const handleDateChange = (date) => {
        setSelectedDate(date);
        setViewMode("average");
        // Force immediate data fetch
        fetchData(date);
    };

    return (
        // <Sidebar>

        <div className="container-fluid">
            <h2 style={{ textAlign: "center", marginBottom: "40px" }}>
                Soil Quality Data for {formatDate(selectedDate)}
            </h2>
            <div>
                <h3 style={{ textAlign: "center", marginBottom: "40px" }}>
                    Select Date:
                </h3>
                <Calendar
                    value={selectedDate}
                    onChange={handleDateChange}
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
                {/* Remove Location Dropdown */}
                {/* Keep only Hour Dropdown */}
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
                {["soil_moisture", "humidity", "temperature"].map(
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
                                    soilData.length > 0 ? (
                                        <Line
                                            data={createChartConfigForAverage(
                                                metric.toUpperCase(),
                                                getFilteredDataForAverage(soilData, metric), // Use the preprocessed data for hourly averages
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
                                    data={soilData}
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
        // </Sidebar>
    );
};

export default SoilQualityByDate;