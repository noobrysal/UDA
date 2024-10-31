import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { supabase } from './supabaseClient';


const getAirQualityForMonth = async (year, month) => {
    const startOfMonth = `${year}-${String(month).padStart(2, '0')}-01`;
    const endOfMonth = `${year}-${String(month).padStart(2, '0')}-31`;

    const { data, error } = await supabase
        .from('sensors')
        .select('*')
        .gte('date', startOfMonth)
        .lte('date', endOfMonth);

    if (error) throw error;

    return data;
};

const AirQuality = () => {
    const [airData, setAirData] = useState([]);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const navigate = useNavigate();

    useEffect(() => {
        const year = selectedDate.getFullYear();
        const month = selectedDate.getMonth() + 1;

        getAirQualityForMonth(year, month)
            .then(data => setAirData(data))
            .catch(error => toast.error(`Error fetching air quality: ${error.message}`));
    }, [selectedDate]);

    const airQualityDates = airData.map(item => new Date(item.date));

    const hasAirQualityData = (date) => {
        const dateString = date.toISOString().split('T')[0];  // Convert to UTC date string (YYYY-MM-DD)
        return airQualityDates.includes(dateString);
    };

    const handleDateClick = (value) => {
        const year = value.getFullYear();
        const month = String(value.getMonth() + 1).padStart(2, '0');
        const day = String(value.getDate()).padStart(2, '0');
        const formattedDate = `${year}-${month}-${day}`;
        navigate(`/air-quality/date/${formattedDate}`);
    };

    return (
        <div className="container-fluid">
            <h2>Air Quality Data</h2>
            <Calendar
                value={selectedDate}
                onChange={setSelectedDate}
                tileClassName={({ date }) => hasAirQualityData(date) ? 'has-data' : null}
                onClickDay={handleDateClick}
            />
            <ToastContainer />
        </div>
    );
};

export default AirQuality;
