import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';  // Added Link import
import { Table } from 'react-bootstrap';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const getAirQualityByDate = (date) => {
    return axios.get(`http://127.0.0.1:8000/air-quality/?date=${date}`)
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

const AirQualityByDate = () => {
    const { date } = useParams();  // Get the date from the URL
    const [airData, setAirData] = useState([]); // Array to hold the data

    useEffect(() => {
        let mounted = true;
        getAirQualityByDate(date)
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
    }, [date]);

    return (
        <div className="container-fluid">
            <h2>Air Quality Data for {date}</h2>
            {airData.length > 0 ? (
                <Table striped bordered hover responsive>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>PM2.5</th>
                            <th>PM10</th>
                            <th>Humidity</th>
                            <th>Temperature</th>
                            <th>CO2</th>
                            <th>DateTime</th>
                        </tr>
                    </thead>
                    <tbody>
                        {airData.map(item => (
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
                                <td>{item.timestamp.replace("T", " ")}</td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            ) : (
                <p>No data found for this date.</p>
            )}
            <ToastContainer />
        </div>
    );
};

export default AirQualityByDate;
