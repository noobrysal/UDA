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
  const { user } = useAuth(); // Add this line

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
          {/* Public Routes - No authentication needed */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginForm />} />
          <Route path="/register" element={<RegisterForm />} />

          {/* Protected Routes - Need authentication */}
          <Route path="/general-screen" element={
            <PrivateRoute>
              <GeneralScreen />
            </PrivateRoute>
          } />
          <Route path="/carousel" element={
            <PrivateRoute>
              <Carousel />
            </PrivateRoute>
          } />
          <Route path="/profile" element={
            <PrivateRoute>
              <ProfilePage />
            </PrivateRoute>
          } />

          {/* Routes with Sidebar */}
          <Route path="/air" element={
            <PrivateRoute>
              <AirSolo />
            </PrivateRoute>
          } />
          <Route path="/air-dashboard" element={
            <PrivateRoute>
              <AirDashboard />
            </PrivateRoute>
          } />
          <Route path="/air-quality" element={
            <PrivateRoute>
              <AirQualityByDate />
            </PrivateRoute>
          } />
          <Route path="/air-quality/id/:id" element={
            <PrivateRoute>
              <AirQualityInstance />
            </PrivateRoute>
          } />

          <Route path="/water-quality" element={
            <PrivateRoute>
              <WaterQualityByDate />
            </PrivateRoute>
          } />
          <Route path="/water-quality/id/:id" element={
            <PrivateRoute>
              <WaterQualityInstance />
            </PrivateRoute>
          } />
          <Route path="/water-dashboard" element={
            <PrivateRoute>
              <WaterDashboard />
            </PrivateRoute>
          } />
          <Route path="/water" element={
            <PrivateRoute>
              <WaterSolo />
            </PrivateRoute>
          } />

          <Route path="/soil-quality" element={
            <PrivateRoute>
              <SoilQualityByDate />
            </PrivateRoute>
          } />
          <Route path="/soil-quality/id/:id" element={
            <PrivateRoute>
              <SoilQualityInstance />
            </PrivateRoute>
          } />
          <Route path="/soil-dashboard" element={
            <PrivateRoute>
              <SoilDashboard />
            </PrivateRoute>
          } />
          <Route path="/soil" element={
            <PrivateRoute>
              <SoilSolo />
            </PrivateRoute>
          } />


          {/* <Route path="/airview" element={<AirView />} /> */}
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
