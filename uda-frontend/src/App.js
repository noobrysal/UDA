import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { createGlobalStyle } from 'styled-components'; // <-- Import createGlobalStyle
import RegisterForm from './components/RegisterForm';
import LoginForm from './components/LoginForm';
import Air from '../src/General Screen View/AirSolo';
import AirDashboard from './components/iot/AirQuality/AirDashboard';
import AirQualityInstance from './components/iot/AirQuality/AirQualityInstance';
import AirQualityByDate from './components/iot/AirQuality/AirQualityByDate';
import LandingPage from './components/LandingPage';
import SidebarComponent from './components/global/Sidebar'; // Adjust the import path as needed
import AirView from './components/iot/AirQuality/AirView';

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
    // '/airview',
    '/air-quality/date/:date/location/:locationId',
    '/air-quality/id/:id',
    '/air',
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

          {/* Routes with Sidebar */}
          <Route path="/air" element={<Air />} />
          <Route path="/air-dashboard" element={<AirDashboard />} />
          <Route path="/air-quality" element={<AirQualityByDate />} />
          <Route path="/air-quality/id/:id" element={<AirQualityInstance />} />
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
