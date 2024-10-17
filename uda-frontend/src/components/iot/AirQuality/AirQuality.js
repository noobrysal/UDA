import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

const getAirQualityForMonth = (year, month) => {
    return axios.get(`http://127.0.0.1:8000/air-quality/?month=${year}-${month}`)
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
    const [selectedDate, setSelectedDate] = useState(new Date());
    const navigate = useNavigate();

    useEffect(() => {
        const year = selectedDate.getFullYear();
        const month = selectedDate.getMonth() + 1; // getMonth() returns 0-indexed month

        getAirQualityForMonth(year, month)
            .then(data => {
                setAirData(data);
            })
            .catch(error => {
                console.error('Error fetching air quality:', error);
                toast.error(`Error fetching air quality: ${error.message}`);
            });
    }, [selectedDate]);

    const airQualityDates = airData.map(item => new Date(item.timestamp));

    const hasAirQualityData = (date) => {
        return airQualityDates.some(d => d.toDateString() === date.toDateString());
    };

    const handleDateClick = (value) => {
        const year = value.getFullYear();
        const month = String(value.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed, pad to 2 digits
        const day = String(value.getDate()).padStart(2, '0'); // Pad day to 2 digits
        const formattedDate = `${year}-${month}-${day}`; // Format date as YYYY-MM-DD
        navigate(`/air-quality/date/${formattedDate}`); // Navigate to the date-specific page
    };

    return (
        <div className="container-fluid">
            <h2>Air Quality Data</h2>
            <Calendar
                value={selectedDate}
                onChange={setSelectedDate}
                tileClassName={({ date }) => hasAirQualityData(date) ? 'has-data' : null}
                onClickDay={handleDateClick} // Click handler remains the same
            />
            <ToastContainer />
        </div>
    );
};

export default AirQuality;
