import React from 'react';
import { useTheme } from '@mui/material';
import { useNavigate } from 'react-router-dom'; 
import { tokens } from '../theme';
import logoImage from '../assets/logo.png'; 
import backgroundImage from '../assets/udabackg4.png'; 

const LandingPage = ({
    buttonPosition = { top: '72%', left: '36%' }, // Adjust button position slightly to the right
}) => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const navigate = useNavigate();

    // Button styles
    const buttonStyles = {
        padding: '10px 40px',
        marginTop: '20px',
        marginLeft: '20px',
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
        ...buttonPosition, // Use passed buttonPosition
    };

    const handleMouseOver = (e) => {
        e.target.style.backgroundColor = colors.grey[200];
        e.target.style.boxShadow = `0px 5px 15px ${colors.yellow[100]}`;
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

    return (
        <div
            style={{
                display: 'flex',
                justifyContent: 'space-between',
                minHeight: '100vh',
                width: '100vw',
                padding: '10px',
                backgroundColor: '#000000', 
                backgroundImage: `url(${backgroundImage})`,
                backgroundSize: 'cover', 
                backgroundRepeat: 'no-repeat', 
                backgroundPosition: 'center', 
                backgroundAttachment: 'fixed', 
                color: colors.grey[100],
                overflow: 'hidden',
                position: 'relative',
                flexDirection: 'row',
            }}
        >
            {/* Left container for Title and Description */}
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'flex-start',
                    paddingLeft: '50px',
                    width: '50%',
                    backgroundColor: 'transparent',
                }}
            >
                <h1 style={{
                    marginBottom: '10px',
                    fontSize: '7vw', 
                    fontWeight: 'bold',
                    lineHeight: '1.1',
                }}>
                    <span style={{ color: colors.cyan[700] }}>U</span>NIFIED
                </h1>
                <h1 style={{
                    marginBottom: '10px',
                    fontSize: '7vw',
                    fontWeight: 'bold',
                    lineHeight: '1.1',
                }}>
                    <span style={{ color: colors.teal[700] }}>D</span>ASHBOARD
                </h1>
                <h1 style={{
                    marginBottom: '10px',
                    fontSize: '7vw',
                    fontWeight: 'bold',
                    lineHeight: '1.1',
                }}>
                    <span style={{ color: colors.yellow[700] }}>A</span>NALYTICS
                </h1>
                <hr style={{
                    width: '95%',
                    border: `1px solid ${colors.grey[100]}`,
                    marginTop: '10px',
                }} />
                <p style={{
                    fontSize: '1.5rem',
                    color: colors.grey[100],
                    lineHeight: '1.2',
                    fontWeight: 'lighter',
                }}>
                    Turn data into actions,<br />Transform insights into impact.
                </p>
            </div>

            {/* Right container for Logo and Button */}
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingRight: '50px',
                    width: '50%',
                    backgroundColor: 'transparent', 
                    position: 'relative',
                }}
            >
                {/* Logo */}
                <div
                    style={{
                        position: 'absolute',
                        top: '15%', 
                    }}
                >
                    <img src={logoImage} alt="Logo" 
                        style={{ 
                            marginTop: '-60px',
                            marginLeft: '50px',
                            width: '35vw', 
                            height: 'auto' }} />
                </div>

                {/* Button */}
                <div style={{ marginTop: '200px' }}> {/* Adjust vertical margin as necessary */}
                    <button
                        style={buttonStyles}
                        onMouseOver={handleMouseOver}
                        onMouseOut={handleMouseOut}
                        onMouseDown={handleMouseDown}
                        onMouseUp={handleMouseUp}
                        onClick={() => navigate('/login')} 
                    >
                        Proceed
                    </button>
                </div>
            </div>

            <style>
                {`
                @media (max-width: 1440px) {
                    h1 {
                        font-size: 5.5vw; 
                    }

                    img {
                        width: 28vw; 
                    }

                    button {
                        font-size: 1.2rem;
                        padding: 12px 35px;
                    }

                    p {
                        font-size: 1.3rem;
                    }
                }

                @media (max-width: 1024px) {
                    h1 {
                        font-size: 4.5vw;
                    }

                    img {
                        width: 40vw;
                    }

                    button {
                        font-size: 1rem;
                        padding: 10px 30px;
                    }

                    p {
                        font-size: 1.2rem;
                    }
                }
                `}
            </style>
        </div>
    );
};

export default LandingPage;