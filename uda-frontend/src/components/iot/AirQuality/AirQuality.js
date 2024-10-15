import React, { useEffect, useState } from 'react';
import { Table } from 'react-bootstrap';
import { Link } from 'react-router-dom'; // Import Link from react-router-dom
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const getAirQuality = () => {
    return axios.get('http://127.0.0.1:8000/air-quality/')
        .then(response => response.data)
        .catch(error => {
            console.error('Error fetching air quality:', error);
            if (error.response && error.response.status === 401) {
                toast.error('Please login to continue.');
            } else {
                toast.error(`Error fetching air quality: ${error.message}`);
            }
            throw error;
        });
};

const AirQuality = () => {
    const [airData, setAirData] = useState([]);

    useEffect(() => {
        let mounted = true;
        getAirQuality()
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
    }, []);

    return (
        <div className="container-fluid">
            <h2>Air Quality Data</h2>
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
                    {airData.map((item) => (
                        <tr key={item.id}>
                            <td>
                                <Link to={`/air-quality/${item.id}`}>
                                    {item.id}
                                </Link>
                            </td>
                            <td>{item.pm2_5}</td>
                            <td>{item.pm10}</td>
                            <td>{item.humidity}</td>
                            <td>{item.temperature}</td>
                            <td>{item.co2}</td>
                        </tr>
                    ))}
                </tbody>
            </Table>
            <ToastContainer />
        </div>
    );
};

export default AirQuality;
