import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { supabase } from './supabaseClient';

const getAirQualityForMonth = async (year, month, locationId) => {
    const startOfMonth = `${year}-${String(month).padStart(2, '0')}-01`;
    const endOfMonth = `${year}-${String(month).padStart(2, '0')}-31`;

    let query = supabase
        .from('sensors')
        .select('*')
        .gte('date', startOfMonth)
        .lte('date', endOfMonth);

    // Apply location filter if locationId is provided
    if (locationId) {
        query = query.eq('locationId', locationId);  // Assuming 'location_id' is the column name for location
    }

    const { data, error } = await query;

    if (error) throw error;

    return data;
};

const AirQuality = () => {
    const [airData, setAirData] = useState([]);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedLocation, setSelectedLocation] = useState(1); // Default location ID is 1 (Lapasan)
    const navigate = useNavigate();

    // Define available locations and their IDs
    const locations = [
        { id: 1, name: 'Lapasan' },
        { id: 2, name: 'Agusan' },
        { id: 3, name: 'USTP-CDO' },
        { id: 4, name: 'El Salvador' },
        { id: 5, name: 'Sports Complex' },
    ];

    useEffect(() => {
        const year = selectedDate.getFullYear();
        const month = selectedDate.getMonth() + 1;

        getAirQualityForMonth(year, month, selectedLocation)
            .then(data => setAirData(data))
            .catch(error => toast.error(`Error fetching air quality: ${error.message}`));
    }, [selectedDate, selectedLocation]);  // Dependency on selectedLocation

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

        // Navigate to the page with the selected date and locationId
        navigate(`/air-quality/date/${formattedDate}/location/${selectedLocation}`);
    };


    return (
        <div className="container-fluid">
            <h2>Air Quality Data</h2>

            {/* Dropdown for location selection */}
            <div className="form-group">
                <label htmlFor="locationSelect">Select Location:</label>
                <select
                    id="locationSelect"
                    className="form-control"
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(parseInt(e.target.value))}
                >
                    {locations.map((location) => (
                        <option key={location.id} value={location.id}>
                            {location.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* Calendar to select date */}
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
