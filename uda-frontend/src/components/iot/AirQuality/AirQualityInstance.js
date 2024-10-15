import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Table } from 'react-bootstrap';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const getAirQualityById = (id) => {
    return axios.get(`http://127.0.0.1:8000/air-quality/${id}/`)
        .then(response => response.data)
        .catch(error => {
            console.error('Error fetching air quality:', error);
            if (error.response && error.response.status === 404) {
                toast.error('Data not found.');
            } else {
                toast.error(`Error fetching air quality: ${error.message}`);
            }
            throw error;
        });
};

const AirQualityInstance = () => {
    const { id } = useParams();  // Get the ID from the URL
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
                <Table striped bordered hover responsive>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>PM2.5</th>
                            <th>PM10</th>
                            <th>Humidity</th>
                            <th>Temperature</th>
                            <th>CO2</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>{airData.id}</td>
                            <td>{airData.pm2_5}</td>
                            <td>{airData.pm10}</td>
                            <td>{airData.humidity}</td>
                            <td>{airData.temperature}</td>
                            <td>{airData.co2}</td>
                        </tr>
                    </tbody>
                </Table>
            ) : (
                <p>Loading...</p>
            )}
            <ToastContainer />
        </div>
    );
};

export default AirQualityInstance;
