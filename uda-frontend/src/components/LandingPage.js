import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logoImage from '../static/logo.png';
import Sidebar from './Sidebar';

const LandingPage = ({
  logoPosition = { top: '10%', left: '62%' },
  buttonPosition = { top: '72%', left: '70.2%' },
}) => {
  const navigate = useNavigate();

  const colors = {
    black: '#000000',
    grey: {
      100: '#f0f0f0',
      200: '#d3d3d3',
      300: '#a0a0a0',
      400: '#7d7d7d',
      500: '#5a5a5a',
      700: '#3f3f3f',
      900: '#1c1c1c',
    },
    cyan: {
      100: '#00bcd4',
      200: '#0097a7',
      400: '#006f75',
      700: '#004d56',
    },
    teal: {
      100: '#80cbc4',
      200: '#4db6ac',
      400: '#00796b',
      700: '#004d40',
    },
    yellow: {
      100: '#ffeb3b',
      200: '#fbc02d',
      400: '#f57f17',
      700: '#c65100',
    },
  };

  const buttonStyles = {
    padding: '10px 40px',
    fontSize: '18px',
    backgroundColor: colors.grey[100],
    color: colors.grey[900],
    border: 'none',
    borderRadius: '25px',
    cursor: 'pointer',
    fontWeight: 'bold',
    transition: 'transform 0.2s, background-color 0.3s, box-shadow 0.3s',
    outline: 'none',
    position: 'absolute',
    ...buttonPosition,
  };

  const handleMouseOver = (e) => {
    e.target.style.backgroundColor = colors.grey[200];
    e.target.style.boxShadow = `0px 5px 15px ${colors.cyan[400]}`;
    e.target.style.transform = 'translateY(-2px)';
  };

  const handleMouseOut = (e) => {
    e.target.style.backgroundColor = colors.grey[100];
    e.target.style.boxShadow = 'none';
    e.target.style.transform = 'translateY(0)';
  };

  const handleMouseDown = (e) => {
    e.target.style.transform = 'translateY(2px)';
    e.target.style.boxShadow = `0px 2px 8px ${colors.grey[300]}`;
  };

  const handleMouseUp = (e) => {
    e.target.style.transform = 'translateY(-2px)';
    e.target.style.boxShadow = `0px 5px 15px ${colors.grey[400]}`;
  };

  useEffect(() => {
    document.body.style.overflowX = 'hidden';
    return () => {
      document.body.style.overflowX = 'auto';
    };
  }, []);

  return (
    <Sidebar>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          minHeight: '100vh',
          width: '100vw',
          padding: '50px',
          backgroundColor: colors.black,
          color: colors.grey[100],
          overflow: 'hidden',
          position: 'relative',
          flexDirection: 'row',
        }}
      >
        {/* Gradient "stickers" */}
        <div
          style={{
            position: 'absolute',
            top: '-105%',
            left: '15%',
            width: '1100px',
            height: '1100px',
            background: `radial-gradient(circle, ${colors.cyan[100]} 0%, transparent 70%)`,
            borderRadius: '50%',
            zIndex: 0,
          }}
        ></div>
        <div
          style={{
            position: 'absolute',
            bottom: '-90%',
            left: '-35%',
            width: '1100px',
            height: '1100px',
            background: `radial-gradient(circle, ${colors.teal[100]} 0%, transparent 70%)`,
            borderRadius: '50%',
            zIndex: 0,
          }}
        ></div>
        <div
          style={{
            position: 'absolute',
            bottom: '-90%',
            right: '-35%',
            width: '1100px',
            height: '1100px',
            background: `radial-gradient(circle, ${colors.yellow[100]} 0%, transparent 70%)`,
            borderRadius: '50%',
            zIndex: 0,
          }}
        ></div>

        {/* Content: Text */}
        <div
          style={{
            marginLeft: '50px',
            maxWidth: '50%',
            textAlign: 'left',
            zIndex: 1,
            position: 'relative',
          }}
        >
          <h1
            style={{
              marginBottom: '20px',
              fontSize: 'clamp(40px, 8vw, 100px)', // Responsive text size
              fontWeight: 'bold',
              lineHeight: '1.1',
            }}
          >
            <span style={{ color: colors.cyan[700] }}>U</span>NIFIED <br />
            <span style={{ color: colors.teal[700] }}>D</span>ASHBOARD <br />
            <span style={{ color: colors.yellow[700] }}>A</span>NALYTICS
          </h1>
          <hr
            style={{
              width: '90%', // Adjusted for responsiveness
              border: `1px solid ${colors.grey[100]}`,
              margin: '0',
            }}
          />
          <p
            style={{
              paddingTop: '20px',
              fontSize: 'clamp(16px, 3vw, 25px)', // Responsive paragraph size
              color: colors.grey[100],
              lineHeight: '1.2',
              fontWeight: 'lighter',
            }}
          >
            Turn data into actions,<br />transform insights into impact.
          </p>
        </div>

        {/* Logo */}
        <div
          style={{
            position: 'absolute',
            ...logoPosition,
            zIndex: 1,
          }}
        >
          <img
            src={logoImage}
            alt="Logo"
            style={{
              width: 'clamp(400px, 30%, 500px)', // Responsive logo size
              height: 'auto',
            }}
          />
        </div>

        {/* Button */}
        <button
          style={{
            ...buttonStyles,
            fontSize: 'clamp(14px, 2vw, 18px)', // Responsive font size
            padding: 'clamp(8px, 1.5vw, 10px) clamp(20px, 4vw, 40px)', // Responsive padding
          }}
          onMouseOver={handleMouseOver}
          onMouseOut={handleMouseOut}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onClick={() => navigate('/login')}
        >
          Proceed
        </button>
      </div>
    </Sidebar>
  );
};

export default LandingPage;
