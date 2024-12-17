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
import PrivateRoute from './components/auth/PrivateRoute'; // <-- Import PrivateRoute
import { AuthProvider } from './components/auth/AuthContext'; // Add this import
import { useAuth } from './components/auth/AuthContext'; // Add this import
import GlobalToast from './components/common/GlobalToast'; // <-- Import GlobalToast
import AirWater from './components/GeneralScreen/AirWater';


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
  const { user } = useAuth();

  // Define public paths that don't need authentication or sidebar
  const publicPaths = ['/', '/login', '/register'];
  const isPublicPath = publicPaths.includes(location.pathname);

  // Only show sidebar for authenticated routes
  const showSidebar = !isPublicPath && user;

  return (
    <div className="app-layout" style={{ display: 'flex' }}>
      {showSidebar && <SidebarComponent />}
      <div className="main-content" style={{ flex: 1 }}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginForm />} />
          <Route path="/register" element={<RegisterForm />} />

          {/* Protected Routes */}
          <Route element={<PrivateRoute />}>
            {/* Dashboard Routes */}
            <Route path="/carousel" element={<Carousel />} />
            <Route path="/general-screen" element={<GeneralScreen />} />
            <Route path="/air-water" element={<AirWater />} />

            {/* Air Quality Routes */}
            <Route path="/air" element={<AirSolo />} />
            <Route path="/air-dashboard" element={<AirDashboard />} />
            <Route path="/air-quality" element={<AirQualityByDate />} />
            <Route path="/air-quality/id/:id" element={<AirQualityInstance />} />

            {/* Water Quality Routes */}
            <Route path="/water" element={<WaterSolo />} />
            <Route path="/water-dashboard" element={<WaterDashboard />} />
            <Route path="/water-quality" element={<WaterQualityByDate />} />
            <Route path="/water-quality/id/:id" element={<WaterQualityInstance />} />

            {/* Soil Quality Routes */}
            <Route path="/soil" element={<SoilSolo />} />
            <Route path="/soil-dashboard" element={<SoilDashboard />} />
            <Route path="/soil-quality" element={<SoilQualityByDate />} />
            <Route path="/soil-quality/id/:id" element={<SoilQualityInstance />} />

            {/* Profile Route */}
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
        </Routes>
      </div>
    </div>
  );
};

const AppWrapper = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <GlobalToast />
        <GlobalStyle />
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default AppWrapper;
