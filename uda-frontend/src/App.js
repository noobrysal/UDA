import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import RegisterForm from './components/RegisterForm';
import LoginForm from './components/LoginForm';
import Activation from './components/Activation';
import Home from './components/Home';
import AirQuality from './components/iot/AirQuality/AirQuality';
import AirQualityInstance from './components/iot/AirQuality/AirQualityInstance';
import AirQualityByDate from './components/iot/AirQuality/AirQualityByDate';

function App() {
  return (
    <div>
      <Routes>
        <Route path="/register" element={<RegisterForm />} />
        <Route path="/login" element={<LoginForm />} />
        <Route path="/auth/activate/:uidb64/:token" element={<Activation />} />
        <Route path="/" element={<Home />} />
        <Route path="/air-quality" element={<AirQuality />} />
        <Route path="/air-quality/:id" element={<AirQualityInstance />} />
        <Route path="/air-quality/date/:date" element={<AirQualityByDate />} />



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
