import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Sidebar from '../../Sidebar';

const AirDashboard = () => {
    const [airData, setAirData] = useState([]);
    const [summary, setSummary] = useState({
        pm25: { avg: 0, status: '', trend: '' },
        pm10: { avg: 0, status: '', trend: '' },
        humidity: { avg: 0, status: '', trend: '' },
        temperature: { avg: 0, status: '', trend: '' },
        oxygen: { avg: 0, status: '', trend: '' },
    });

    const [visibleIndices, setVisibleIndices] = useState([0, 1]); // Tracks visible locations for the carousel
    const [transitionDirection, setTransitionDirection] = useState('left'); // Track slide direction

    const locations = [
        { id: 1, name: 'Lapasan' },
        { id: 2, name: 'Agusan' },
        { id: 3, name: 'USTP-CDO' },
        { id: 4, name: 'El Salvador' },
        { id: 5, name: 'Sports Complex' },
    ];

    const thresholds = {
        pm25: { safe: 25, warning: 35, danger: 45 },
        pm10: { safe: 50, warning: 100, danger: 150 },
        humidity: { safe: 60, warning: 70, danger: 80 },
        temperature: { safe: 33, warning: 41, danger: 54 },
        oxygen: { safe: 25, warning: 50, danger: 100 },
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
    }, []);

    useEffect(() => {
        const timer = setInterval(() => {
            setTransitionDirection(transitionDirection === 'left' ? 'right' : 'left'); // Toggle slide direction
            setVisibleIndices((prevIndices) => {
                const nextStart = (prevIndices[1] + 1) % locations.length;
                return [nextStart, (nextStart + 1) % locations.length];
            });
        }, 5000);

        return () => clearInterval(timer); // Cleanup timer on unmount
    }, [locations.length, transitionDirection]);

    const calculateSummary = (locationData) => {
        const calculateMetric = (metric, data) => {
            const values = data.map((item) => item[metric]).filter((value) => value != null);
            const avg = values.length > 0 ? values.reduce((acc, val) => acc + val, 0) / values.length : NaN;
            const status = getStatus(avg, metric);
            const trend = getTrend(values);
            return { avg: isNaN(avg) ? null : avg, status, trend };
        };

        const getStatus = (value, metric) => {
            if (value <= thresholds[metric].safe) return 'Safe';
            if (value <= thresholds[metric].warning) return 'Warning';
            return 'Danger';
        };

        const getTrend = (values) => {
            if (values.length < 2) return '';
            return values[values.length - 1] > values[values.length - 2] ? 'worsening' : 'improving';
        };

        const summaries = locationData.map(({ location, data }) => ({
            location,
            pm25: calculateMetric('pm25', data),
            pm10: calculateMetric('pm10', data),
            humidity: calculateMetric('humidity', data),
            temperature: calculateMetric('temperature', data),
            oxygen: calculateMetric('oxygen', data),
        }));

        setSummary(summaries);
    };

    const renderTrendIndicator = (trend) => {
        if (trend === '') return null;
        return (
            <span style={{ fontSize: '16px', color: trend === 'improving' ? 'green' : 'red' }}>
                {trend === 'improving' ? '↑' : '↓'}
            </span>
        );
    };

    const renderSummaryPanel = (metric, label, locationSummary) => {
        if (!locationSummary) return null;

        const { avg, status, trend } = locationSummary[metric] || {};
        if (avg === null) {
            return (
                <div style={styles.summaryPanel}>
                    <h5>{label}</h5>
                    <p>Data for this date not found / available</p>
                    <p>Status: <span>Missing</span></p>
                </div>
            );
        }

        return (
            <div style={styles.summaryPanel}>
                <h5>{label}</h5>
                <p>{avg.toFixed(2)} μg/m³</p>
                <p>Status: <span style={styles.status[status]}>{status}</span></p>
                {renderTrendIndicator(trend)}
            </div>
        );
    };

    return (
        <Sidebar>
            <div style={styles.container}>
                <h2>Air Quality Dashboard</h2>
                <div
                    className={`location-panels ${transitionDirection === 'left' ? 'slide-left' : 'slide-right'}`}
                    onAnimationEnd={() => setTransitionDirection('')} // Reset animation after it ends
                    style={styles.locationPanels}
                >
                    {visibleIndices.map((index) => {
                        const { location, data } = airData[index] || {};
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
                <ToastContainer />
            </div>
        </Sidebar>
    );
};

const styles = {
    container: {
        padding: '20px',
    },
    locationPanels: {
        display: 'flex',
        transition: 'transform 0.5s ease-in-out',
    },
    locationPanel: {
        marginBottom: '40px', marginRight: '20px',
    },
    summaryPanels: {
        display: 'flex',
        justifyContent: 'space-around',
        flexWrap: 'wrap',
    },
    summaryPanel: {
        backgroundColor: '#f4f4f4',
        padding: '15px',
        borderRadius: '10px',
        boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
        width: '200px',
        textAlign: 'center',
        marginBottom: '20px',
        marginLeft: '20px',
    },
    status: {
        Safe: { color: 'green' },
        Warning: { color: 'orange' },
        Danger: { color: 'red' },
    },
};

export default AirDashboard;