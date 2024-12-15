import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { createGlobalStyle } from 'styled-components'; // <-- Import createGlobalStyle
import RegisterForm from './components/RegisterForm';
import LoginForm from './components/LoginForm';
import AirSolo from './components/GeneralScreen/AirSolo';
import AirDashboard from './components/iot/AirQuality/AirDashboard';
import AirQualityInstance from './components/iot/AirQuality/AirQualityInstance';
import AirQualityByDate from './components/iot/AirQuality/AirQualityByDate';
import LandingPage from './components/LandingPage';
import SidebarComponent from './components/global/Sidebar'; // Adjust the import path as needed
import SoilQualityByDate from './components/iot/SoilQuality/SoilQualityByDate';
import SoilQualityInstance from './components/iot/SoilQuality/SoilQualityInstance';
import SoilSolo from './components/GeneralScreen/SoilSolo';
import SoilDashboard from './components/iot/SoilQuality/SoilDashboard';
import WaterSolo from './components/GeneralScreen/WaterSolo';
import WaterQualityByDate from './components/iot/WaterQuality/WaterQualityByDate';
import WaterQualityInstance from './components/iot/WaterQuality/WaterQualityInstance';
import WaterDashboard from './components/iot/WaterQuality/WaterDashboard';
import GeneralScreen from './components/GeneralScreen/GeneralScreen';
import Carousel from './components/GeneralScreen/Carousel';
import ProfilePage from './components/Profile';


// Define global styles for scrollbar
const GlobalStyle = createGlobalStyle`
    /* Custom Scrollbar Styling */
    ::-webkit-scrollbar {
        width: 12px; /* Width of the scrollbar */
    }

    ::-webkit-scrollbar-track {
        background-color: rgba(0, 0, 0, 0.1); /* Light background for the track */
        border-radius: 10px; /* Rounded corners for the track */
    }

    ::-webkit-scrollbar-thumb {
        background-color: black; /* Set the color of the scrollbar thumb */
        border-radius: 10px; /* Rounded corners for the thumb */
        border: 3px solid rgba(0, 0, 0, 0.1); /* Optional: Adds a border around the thumb */
    }

    /* Optionally, uncomment to style the thumb on hover */
    /* ::-webkit-scrollbar-thumb:hover {
        background-color: #F7EEDD;
    } */

    ::-webkit-scrollbar-button {
        display: none; /* Hide the arrows */
    }
`;

const AppContent = () => {
  const location = useLocation();

  // Define paths that require the Sidebar
  const sidebarPaths = [
    '/air-dashboard',
    '/air-quality',
    '/air-quality/id/:id',
    '/air',
    '/water',
    '/soil',
    '/water-dashboard',
    '/water-quality',
    '/water-quality/',
    '/water-quality/id/:id',
    '/soil-quality',
    '/soil-dashboard',
    '/general-screen',
    '/carousel',
    '/profile',
  ];

  // Check if the current route is in the sidebarPaths array
  const showSidebar = sidebarPaths.includes(location.pathname);

  return (
    <div className="app-layout" style={{ display: 'flex' }}>
      {showSidebar && <SidebarComponent />} {/* Conditionally render Sidebar */}
      <div className="main-content" style={{ flex: 1 }}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/register" element={<RegisterForm />} />
          <Route path="/login" element={<LoginForm />} />

          {/* General Screen with Solo IOTs */}
          <Route path="/general-screen" element={<GeneralScreen />} />
          <Route path="/carousel" element={<Carousel />} />
          <Route path="/profile" element={<ProfilePage />} />


          {/* Routes with Sidebar */}
          <Route path="/air" element={<AirSolo />} />
          <Route path="/air-dashboard" element={<AirDashboard />} />
          <Route path="/air-quality" element={<AirQualityByDate />} />
          <Route path="/air-quality/id/:id" element={<AirQualityInstance />} />
          <Route path="/soil" element={<SoilSolo />} />
          <Route path="/soil-quality" element={<SoilQualityByDate />} />
          <Route path="/soil-quality/id/:id" element={<SoilQualityInstance />} />
          <Route path="/soil-dashboard" element={<SoilDashboard />} />
          <Route path="/water-quality" element={<WaterQualityByDate />} />
          <Route path="/water-quality/id/:id" element={<WaterQualityInstance />} />
          <Route path="/water-dashboard" element={<WaterDashboard />} />
          <Route path="/water" element={<WaterSolo />} />


          {/* <Route path="/airview" element={<AirView />} /> */}
        </Routes>
      </div>
    </div>
  );
};

export default function AppWrapper() {
  return (
    <BrowserRouter>
      <GlobalStyle /> {/* Inject global styles for the scrollbar */}
      <AppContent />
    </BrowserRouter>
  );
}
