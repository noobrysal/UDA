import React, { useEffect, useState } from "react";
import { useParams } from 'react-router-dom';
import { supabaseAir } from './supabaseClient';
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
    Legend as ChartLegend,
} from "chart.js";
import { IconButton, Tooltip as MuiTooltip } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
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
    ChartLegend,
    plugin
);

const AirQualityByDate = () => {
    const { date, locationId, hour } = useParams();

    // Update state initializers to properly handle date string
    const [selectedDate, setSelectedDate] = useState(() => {
        if (date) {
            // Convert the date string to a Date object
            const parsedDate = new Date(date);
            // Check if it's a valid date
            if (isNaN(parsedDate.getTime())) {
                // If invalid, use tomorrow's date as default
                const today = new Date();
                today.setDate(today.getDate() + 1);
                return today.toISOString().split('T')[0];
            }
            return date; // Keep the date string format for the input element
        }
        // Default to tomorrow if no date provided
        const today = new Date();
        today.setDate(today.getDate());
        return today.toISOString().split('T')[0];
    });

    const [selectedLocation, setSelectedLocation] = useState(
        locationId ? parseInt(locationId) : 3
    );

    const [selectedHour, setSelectedHour] = useState(
        hour ? hour : "00"
    );

    // Add useEffect to switch to hourly view when hour parameter is present
    useEffect(() => {
        if (hour) {
            setViewMode("hourly");
        }
    }, [hour]);

    const [airData, setAirData] = useState([]);
    const [highlightedDates, setHighlightedDates] = useState([]);
    // const navigate = useNavigate(); 
    const [viewMode, setViewMode] = useState("average"); // 'hourly' or 'average'
    const [isCalendarLoading, setIsCalendarLoading] = useState(false); // Add new state
    const [expandedChart, setExpandedChart] = useState(null);
    const [availableHours, setAvailableHours] = useState([]);


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

    const formatDisplayDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatDate = (date) => {
        // Handle both Date objects and date strings
        if (typeof date === 'string') {
            // If it's a string (from URL or input), convert to Date
            const parsedDate = new Date(date);
            const year = parsedDate.getFullYear();
            const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
            const day = String(parsedDate.getDate()).padStart(2, "0");
            return `${year}-${month}-${day}`;
        }
        // If it's already a Date object
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    };

    // Fetch data for the entire month
    const fetchMonthData = async (startDate, endDate) => {
        try {
            setIsCalendarLoading(true);
            setHighlightedDates([]); // Clear existing highlighted dates

            const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
            const end = typeof endDate === 'string' ? new Date(endDate) : endDate;

            // Adjust the date range for the query
            const firstDay = new Date(start.getFullYear(), start.getMonth(), 1);
            const lastDay = new Date(end.getFullYear(), end.getMonth() + 1, 0);

            const startDateTime = `${firstDay.toISOString().split('T')[0]}T00:00:00+08:00`;
            const endDateTime = `${lastDay.toISOString().split('T')[0]}T23:59:59.999+08:00`;

            const { data, error } = await supabaseAir
                .from("sensors")
                .select("date")
                .gte("date", startDateTime)
                .lte("date", endDateTime)
                .eq("locationId", selectedLocation)
                .order('date', { ascending: true });

            if (error) throw error;

            if (data) {
                // Process dates using a Map to ensure unique dates
                const uniqueDates = new Map();

                data.forEach(item => {
                    // Convert to local date string in Asia/Manila timezone
                    const date = new Date(item.date);
                    const localDate = date.toLocaleDateString('en-CA', { // en-CA gives YYYY-MM-DD format
                        timeZone: 'Asia/Manila'
                    });
                    uniqueDates.set(localDate, true);
                });

                const sortedDates = Array.from(uniqueDates.keys()).sort();
                console.log('Available dates for location:', sortedDates);
                setHighlightedDates(sortedDates);
            }

        } catch (error) {
            console.error("Error fetching month data:", error);
            toast.error(`Error fetching data: ${error.message}`);
        } finally {
            setIsCalendarLoading(false);
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
            const nextDay = new Date(date);
            nextDay.setDate(nextDay.getDate() + 1);
            const formattedDate = nextDay.toISOString().split('T')[0];
            if (highlightedDates.includes(formattedDate)) {
                return "highlight-tile"; // Apply custom class for highlighted dates
            }
        }
        return null;
    };

    const tileClassName = ({ date, view }) => {
        if (view === "month") {
            // Format the date to match our highlighted dates format (YYYY-MM-DD)
            const formattedDate = date.toLocaleDateString('en-CA', {
                timeZone: 'Asia/Manila'
            });

            // Check if this date should be highlighted
            const hasDataForLocation = highlightedDates.includes(formattedDate);
            return hasDataForLocation ? 'has-data' : 'no-data';
        }
        return null;
    };

    // Define fetchData function outside of useEffect
    const fetchData = async () => {
        try {
            const formattedDate = formatDate(selectedDate); // Ensure your formatDate function respects local timezone
            const { data, error } = await supabaseAir
                .from("sensors")
                .select("*")
                .gte("date", `${formattedDate}T00:00:00+08:00`)  // Use local timezone for the query
                .lt("date", `${formattedDate}T23:59:59.999+08:00`)  // Adjust as per the local timezone
                .eq("locationId", selectedLocation); // Filter by selectedLocation

            if (error) throw error;
            setAirData(data);
            updateAvailableHours(data); // Add this line
        } catch (error) {
            console.error("Error fetching air quality:", error);
            toast.error(`Error fetching air quality: ${error.message}`);
        }
    };

    // Add this function after fetchData
    const updateAvailableHours = (data) => {
        const hours = new Set();
        data.forEach(item => {
            const hour = new Date(item.date).getHours();
            hours.add(hour);
        });
        const sortedHours = Array.from(hours).sort((a, b) => a - b);
        setAvailableHours(sortedHours);

        // If current selected hour is not in available hours, select the first available hour
        if (sortedHours.length > 0 && !sortedHours.includes(parseInt(selectedHour))) {
            setSelectedHour(sortedHours[0].toString().padStart(2, "0"));
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
        const dateObj = typeof selectedDate === 'string'
            ? new Date(selectedDate)
            : selectedDate;

        const startOfMonth = new Date(
            dateObj.getFullYear(),
            dateObj.getMonth(),
            1
        );
        const endOfMonth = new Date(
            dateObj.getFullYear(),
            dateObj.getMonth() + 1,
            0
        );
        fetchMonthData(startOfMonth, endOfMonth);

    }, []); // Empty dependency array means it only runs once on mount

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
        const hourlyData = data.reduce((acc, item) => {
            const hour = new Date(item.date).getHours();
            if (!acc[hour]) acc[hour] = { sum: 0, count: 0 };
            acc[hour].sum += item[metric];
            acc[hour].count++;
            return acc;
        }, {});

        return Object.keys(hourlyData).map((hour) => {
            const { sum, count } = hourlyData[hour];
            return { hour: parseInt(hour), average: sum / count };
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

    const Legend = ({ thresholds, filteredData, metric, data, isExpanded }) => {
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
                    display: "flex",
                    flexDirection: "column",
                    gap: isExpanded ? "15px" : "10px",
                    width: "100%",
                }}
            >
                {/* Legend Container */}
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                        width: "100%"
                    }}
                >
                    {thresholds.map((threshold, index) => (
                        <div
                            key={index}
                            style={{
                                backgroundColor: threshold.color,
                                padding: "10px",
                                borderRadius: "5px",
                                color: "#f5f5f5",
                                fontSize: isExpanded ? "14px" : "12px",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center"
                            }}
                        >
                            <span style={{ fontWeight: "bold" }}>
                                {threshold.label}
                            </span>
                            <span>
                                {"< " + threshold.max}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Status Display */}
                {isExpanded && (
                    <div style={{
                        marginTop: "20px",
                        padding: "15px",
                        backgroundColor: "rgba(255, 255, 255, 0.1)",
                        borderRadius: "5px",
                        color: "white" // Add this to make all text white by default
                    }}>
                        <h4 style={{
                            margin: "0 0 10px 0",
                            color: "white",
                            fontSize: "14px"
                        }}>
                            Current Status
                        </h4>
                        <div style={{ color: "white" }}> {/* Add container with white text */}
                            <h4>
                                {"Average " + metric.toUpperCase()} level for this hour is{" "}
                                {value !== null && value !== undefined ? (
                                    <>
                                        {value.toFixed(2)}
                                        <br></br>
                                        <span style={{
                                            backgroundColor: backgroundColor,
                                            padding: "2px 5px",
                                            borderRadius: "7px",
                                            color: "#000000", // Make the status text black for better contrast
                                            fontWeight: "bold"
                                        }}>
                                            ({status})
                                        </span>
                                    </>
                                ) : (
                                    "No data"
                                )}
                            </h4>
                        </div>
                        {viewMode === "average" && (
                            <div style={{
                                borderRadius: "5px",
                                color: "white" // Add white color for average view text
                            }}>
                                <h4>
                                    {"Average " + metric.toUpperCase()} level for this day is{" "}
                                    {dailyAverageValue !== null && value !== undefined ? (
                                        <>
                                            {dailyAverageValue.toFixed(2)}
                                            <br></br>
                                            <span style={{
                                                backgroundColor: averagebackgroundColor,
                                                padding: "2px 5px",
                                                borderRadius: "7px",
                                                color: "#000000", // Make the status text black for better contrast
                                                fontWeight: "bold"
                                            }}>
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

    // Add ChartExpandButton component
    const ChartExpandButton = ({ onClick }) => (
        <button
            onClick={onClick}
            style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                border: '1px solid white',
                borderRadius: '4px',
                color: 'white',
                padding: '5px 10px',
                cursor: 'pointer',
                zIndex: 10,
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
            }}
        >
            <span style={{ fontSize: '16px' }}>⤢</span>
            Expand
        </button>
    );

    // Add metric descriptions
    const metricDescriptions = {
        pm25: "Fine particulate matter smaller than 2.5 micrometers. Can penetrate deep into the lungs and affect health. Monitored for pollution levels.",
        pm10: "Coarser particulate matter up to 10 micrometers. Can irritate the respiratory system and is used to assess air quality.",
        humidity: "The amount of moisture in the air. High levels can worsen air pollution impacts, while very low levels can cause dryness.",
        temperature: "Air temperature affects pollutant dispersion and chemical reactions in the atmosphere, influencing air quality.",
        oxygen: "Essential for respiration. Low oxygen levels in the air can indicate poor ventilation or enclosed environments."
    };

    // Add ChartContainer component
    const ChartContainer = ({ children, onExpand, hasData, metricType }) => (
        <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', top: '10px', width: '100%', display: 'flex', justifyContent: 'space-between', zIndex: 10, padding: '0 10px' }}>
                <MuiTooltip title={metricDescriptions[metricType] || ""} arrow placement="top">
                    <IconButton size="small" style={{ color: 'white' }}>
                        <InfoIcon />
                    </IconButton>
                </MuiTooltip>
                {hasData && <ChartExpandButton onClick={onExpand} />}
            </div>
            {children}
        </div>
    );

    // Update the Modal component
    const Modal = ({ isOpen, onClose, children, metric, filteredData, airData }) => {
        if (!isOpen) return null;

        return (
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                justifyContent: 'flex-start',
                alignItems: 'center',
                zIndex: 1000,
                marginLeft: '90px'
            }}>
                <div style={{
                    backgroundColor: 'rgb(0, 31, 88)',
                    padding: '20px',
                    borderRadius: '10px',
                    width: '99%',
                    height: '95%',
                    position: 'relative',
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
                            cursor: 'pointer',
                            zIndex: 2
                        }}
                    >
                        ×
                    </button>
                    {/* Main Container */}
                    <div style={{ 
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        gap: '20px'
                    }}>
                        {/* Chart Container */}
                        <div style={{ 
                            flex: '1',
                            height: '100%',
                            backgroundColor: 'rgba(0, 0, 0, 0.4)',
                            borderRadius: '10px',
                            padding: '15px'
                        }}>
                            {children}
                        </div>
                        {/* Thresholds Container */}
                        <div style={{ 
                            width: '300px',
                            height: '100%',
                            backgroundColor: 'rgba(0, 0, 0, 0.4)',
                            borderRadius: '10px',
                            padding: '20px',
                            overflowY: 'auto'
                        }}>
                            <h3 style={{ 
                                color: 'white',
                                marginTop: 0,
                                marginBottom: '15px',
                                fontSize: '1.2em'
                            }}>
                                Thresholds
                            </h3>
                            <Legend
                                thresholds={thresholds[metric]}
                                filteredData={filteredData}
                                metric={metric}
                                data={airData}
                                isExpanded={true}
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Update calendar onChange to reset data when changing dates
    const handleCalendarChange = (date) => {
        setSelectedDate(date);
        setViewMode("average");
        // Reset data for new date
        setAirData([]);
        setAvailableHours([]);
    };

    // Add this function after other handlers
    const handleAverageChartClick = (event, chartElements) => {
        if (chartElements && chartElements.length > 0) {
            const index = chartElements[0].index;
            const clickedHourData = getFilteredDataForAverage(airData, "pm25")[index];

            if (clickedHourData) {
                const clickedHour = clickedHourData.hour;

                // Check if this hour exists in availableHours
                if (availableHours.includes(clickedHour)) {
                    setViewMode("hourly");
                    setSelectedHour(clickedHour.toString().padStart(2, "0"));
                } else {
                    // Show toast notification if no data exists for this hour
                    toast.info(`No detailed data available for ${clickedHour}:00`);
                }
            }
        }
    };

    const renderChart = (label, metric) => {
        const hasData = viewMode === "hourly" ? filteredData.length > 0 : airData.length > 0;
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
                            getFilteredDataForAverage(airData, metric),
                            metric
                        );

                    const expandedOptions = {
                        ...config.options,
                        scales: {
                            x: {
                                ticks: { 
                                    color: 'white',
                                    font: {
                                        size: 16,  // Increased to 16px to match WaterQualityByDate
                                        weight: 'bold'
                                    }
                                },
                                grid: { color: 'rgba(255, 255, 255, 0.1)' }
                            },
                            y: {
                                ticks: { 
                                    color: 'white',
                                    font: {
                                        size: 16,  // Increased to 16px to match WaterQualityByDate
                                        weight: 'bold'
                                    }
                                },
                                grid: { color: 'rgba(255, 255, 255, 0.1)' }
                            }
                        },
                        plugins: {
                            ...config.options?.plugins,
                            legend: {
                                labels: { color: 'white' }
                            }
                        },
                        maintainAspectRatio: false
                    };

                    setExpandedChart({
                        data: config,
                        options: expandedOptions,
                        metric: metric
                    });
                }}
                metric={metric.toLowerCase()}
            >
                {/* Render Hourly Data Chart */}
                {viewMode === "hourly" && filteredData.length > 0 ? (
                    <Line
                        data={createChartConfig(
                            label,
                            filteredData.map((item) => ({
                                value: item[metric],
                                borderColor: "white", // Line color set to white
                                borderWidth: 2, // Adjust the line thickness
                                id: item.id,
                            })),
                            metric
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
                                            const metricThresholds = thresholds[metric];

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
                                    text: label,
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
                            label,
                            getFilteredDataForAverage(airData, metric), // Use the preprocessed data for hourly averages
                            metric
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
                                            const metricThresholds = thresholds[metric];

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
                                    text: label,
                                    padding: { bottom: 10 },
                                    color: 'white',
                                },
                            },
                            onClick: handleAverageChartClick,
                        }}
                    />
                ) : null}

                {/* Show "No data found for this hour" when there's no data for either chart */}
                {(viewMode === "hourly" && filteredData.length === 0) || (viewMode === "average" && airData.length === 0) ? (
                    <p>No data found for this hour.</p>
                ) : null}
            </ChartContainer>
        );
    };

    return (
        <div style={styles.fullContainer}>
            <header style={styles.header}>
                <h1 style={styles.title}>
                    Air Quality Data for {formatDisplayDate(date || selectedDate)} at {locationName}
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
                                onChange={handleCalendarChange}
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
                        background-color: #007bff !important; /* Ensure the highlight covers the whole tile */
                        color: white !important; /* Make text stand out */
                        border-radius: 10px; /* Optional: Rounded corners */
                    }

                    /* Hover effect for green tile */
                    .react-calendar__tile:hover {
                        background-color: white !important; /* Change to white on hover */
                        color: #ffde59 !important; /* Keep the text color green when hovered */
                    }

                    /* Active (clicked) tile - turn blue */
                    .react-calendar__tile--active {
                        background-color: rgba(255, 222, 89, 0.7) !important; /* Blue tile */
                        color: white;
                        border-radius: 10px; /* Optional: Rounded corners */
                    }

                    /* Active state after clicking */
                    .react-calendar__tile--active:focus {
                        background-color: rgba(255, 222, 89, 0.7) !important; /* Blue when clicked */
                        color: black;
                    }

                    /* "Today" tile style */
                    .react-calendar__tile--now {
                        background-color: rgb(0, 115, 47) !important; /* Highlight today with yellow */
                        color: black !important; /* Make text color black for better contrast */
                        border-radius: 10px; /* Optional: Rounded corners */
                    }

                    /* Make "today" tile turn blue when clicked */
                    .react-calendar__tile--now.react-calendar__tile--active {
                        background-color: rgba(255, 222, 89, 0.7) !important; /* Blue when clicked */
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
                        background-color: rgba(0, 123, 255, 0.6) !important;
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
                        background-color: #007bff !important;
                        color: white !important;
                    }

                    .react-calendar__tile--active.has-data {
                        background-color: rgba(255, 222, 89, 0.7) !important;
                        color: black !important;
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

                {/* Div 2 - PM2.5 */}
                <div style={styles.div2}>
                    {renderChart("PM25", "pm25")}
                </div>

                {/* Div 3 - PM10 */}
                <div style={styles.div3}>
                    {renderChart("PM10", "pm10")}
                </div>

                {/* Div 4 - Humidity */}
                <div style={styles.div4}>
                    {renderChart("Humidity", "humidity")}
                </div>

                {/* Div 5 - Temperature */}
                <div style={styles.div5}>
                    {renderChart("Temperature", "temperature")}
                </div>

                {/* Div 6 - Oxygen */}
                <div style={styles.div6}>
                    {renderChart("Oxygen", "oxygen")}
                </div>
                <ToastContainer />
            </div>
            <Modal
                isOpen={expandedChart !== null}
                onClose={() => setExpandedChart(null)}
                metric={expandedChart?.metric}
                filteredData={filteredData}
                airData={airData}
            >
                <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                    {expandedChart && (
                        <Line
                            data={expandedChart.data}
                            options={{
                                ...expandedChart.options,
                                maintainAspectRatio: false,
                                responsive: true,
                            }}
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
        minHeight: '100vh',
        boxSizing: 'border-box',
        width: '100%',
        overflow: 'hidden',
        color: '#333',
    },
    header: {
        textAlign: 'left',
        marginTop: '2px',
        marginBottom: '20px',
        marginLeft: '70px',
    },
    title: {
        fontWeight: "bold",
        margin: '0',
        fontSize: '2rem',
        color: 'white',

    },

    divGrid: {
        marginLeft: '70px',
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)', // Default for larger screens
        gap: '20px',
        width: '100%',
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
        backgroundColor: "rgba(0, 204, 221)",
        color: "#fff",
        border: "none",
        padding: "10px 20px",
        borderRadius: "5px",
        cursor: "pointer",
        fontWeight: "bold",
        transition: "background-color 0.3s",
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
        backgroundColor: 'rgba(0, 204, 221, 0.46)',
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



export default AirQualityByDate;