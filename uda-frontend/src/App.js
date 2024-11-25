import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import RegisterForm from './components/RegisterForm';
import LoginForm from './components/LoginForm';
import AirQuality from './components/iot/AirQuality/AirQuality';
import AirDashboard from './components/iot/AirQuality/AirDashboard';
import AirQualityInstance from './components/iot/AirQuality/AirQualityInstance';
import AirQualityByDate from './components/iot/AirQuality/AirQualityByDate';
import LandingPage from './components/LandingPage';


function App() {
  return (
    <div>
      <Routes>
        <Route path="/register" element={<RegisterForm />} />
        <Route path="/login" element={<LoginForm />} />
        <Route path="/" element={<LandingPage />} />
        <Route path="/air-dashboard" element={<AirDashboard />} />
        <Route path="/air-quality" element={<AirQuality />} />
        <Route path="/air-quality/date/:date/location/:locationId" element={<AirQualityByDate />} />
        <Route path="/air-quality/id/:id" element={<AirQualityInstance />} />
      </Routes>
    </div>
  );
}

export default function AppWrapper() {
  return (
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
}
