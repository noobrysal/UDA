import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Table } from 'react-bootstrap';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = 'https://kohjcrdirmvamsjcefew.supabase.co/'; // Replace with your Supabase URL
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvaGpjcmRpcm12YW1zamNlZmV3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyNzMzMDYxMywiZXhwIjoyMDQyOTA2NjEzfQ.dcjFj_XWSg_Zq8BJQSnI_SfqzjtuG98cu3nZSIzgfBo'; // Replace with your Supabase API key
const supabase = createClient(supabaseUrl, supabaseKey);

// Function to fetch air quality data by ID
const getAirQualityById = async (id) => {
    const { data, error } = await supabase
        .from('sensors') // Replace with your table name
        .select('*')
        .eq('id', id) // Assuming 'id' is the primary key
        .single(); // Fetch a single row

    if (error) {
        console.error('Error fetching air quality:', error);
        toast.error(`Error fetching air quality: ${error.message}`);
        throw error;
    }
    return data;
};

// Thresholds for air quality metrics
const thresholds = {
    pm25: { safe: 25, warning: 35, danger: 45 },
    pm10: { safe: 50, warning: 100, danger: 150 },
    humidity: { safe: 60, warning: 70, danger: 80 },
    temperature: { safe: 33, warning: 41, danger: 54 },
    oxygen: { safe: 25, warning: 20, danger: 15 }, // Define thresholds for oxygen
};

// Function to get color based on metric thresholds
const getColor = (value, metric) => {
    const { safe, warning, danger } = thresholds[metric];
    if (value <= safe) return 'lightgreen'; // Safe
    if (value <= warning) return 'orange'; // Warning
    return 'red'; // Danger
};

// Main component to display air quality instance
const AirQualityInstance = () => {
    const { id } = useParams(); // Get the ID from the URL
    const [airData, setAirData] = useState(null); // null until data is fetched

    useEffect(() => {
        let mounted = true;
        getAirQualityById(id)
            .then(data => {
                if (mounted) {
                    setAirData(data);
                }
            })
            .catch(error => {
                console.error('Error fetching air quality:', error);
                toast.error(`Error fetching air quality: ${error.message}`);
            });

        return () => mounted = false;
    }, [id]);

    return (
        <div className="container-fluid">
            <h2>Air Quality Data (ID: {id})</h2>
            {airData ? (
                <div>
                    <p><strong>Recorded at:</strong> {new Date(airData.date).toISOString()}</p> {/* Displaying date in UTC */}

                    {/* Table for air data with color-coded values */}
                    <Table striped bordered hover responsive>
                        <thead>
                            <tr>
                                <th>Metric</th>
                                <th>Value</th>
                                <th>Threshold</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>PM2.5</td>
                                <td style={{ backgroundColor: getColor(airData.pm25, 'pm25') }}>{airData.pm25}</td>
                                <td>Safe ≤ {thresholds.pm25.safe}, Warning {thresholds.pm25.safe + 1}–{thresholds.pm25.warning}, Danger ≥ {thresholds.pm25.danger}</td>
                            </tr>
                            <tr>
                                <td>PM10</td>
                                <td style={{ backgroundColor: getColor(airData.pm10, 'pm10') }}>{airData.pm10}</td>
                                <td>Safe ≤ {thresholds.pm10.safe}, Warning {thresholds.pm10.safe + 1}–{thresholds.pm10.warning}, Danger ≥ {thresholds.pm10.danger}</td>
                            </tr>
                            <tr>
                                <td>Humidity</td>
                                <td style={{ backgroundColor: getColor(airData.humidity, 'humidity') }}>{airData.humidity}</td>
                                <td>Safe {thresholds.humidity.safe}%, Warning {thresholds.humidity.safe + 1}%–{thresholds.humidity.warning}%, Danger ≥ {thresholds.humidity.danger}%</td>
                            </tr>
                            <tr>
                                <td>Temperature</td>
                                <td style={{ backgroundColor: getColor(airData.temperature, 'temperature') }}>{airData.temperature}</td>
                                <td>Safe ≤ {thresholds.temperature.safe}°C, Warning {thresholds.temperature.safe + 1}°C–{thresholds.temperature.warning}°C, Danger ≥ {thresholds.temperature.danger}°C</td>
                            </tr>
                            <tr>
                                <td>Oxygen</td>
                                <td style={{ backgroundColor: getColor(airData.oxygen, 'oxygen') }}>{airData.oxygen}</td>
                                <td>Safe ≤ {thresholds.oxygen.safe}, Warning {thresholds.oxygen.safe + 1}–{thresholds.oxygen.warning}, Danger ≥ {thresholds.oxygen.danger}</td>
                            </tr>
                        </tbody>
                    </Table>

                    {/* Optional: Add charts or sparklines for each metric if needed */}
                </div>
            ) : (
                <p>Loading...</p>
            )}
            <ToastContainer />
        </div>
    );
};

export default AirQualityInstance;
