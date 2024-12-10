import axios from 'axios';

const apiUrl = process.env.REACT_APP_SOIL_QUALITY_URL;
const apiKey = process.env.REACT_APP_SOIL_QUALITY_KEY;

const axiosClient = axios.create({
    baseURL: apiUrl,
    headers: {
        Sensor: `${apiKey}`,
    },
});

export default axiosClient;
