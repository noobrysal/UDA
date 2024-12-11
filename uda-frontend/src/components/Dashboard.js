import React from 'react';
import backgroundImage from '../assets/udabackg4.png'; // Import your background image
import airImage from '../assets/airdash.png'; // Example image for air quality
import riverImage from '../assets/airdash.png'; // Example image for river quality
import soilImage from '../assets/airdash.png'; // Example image for soil quality

const Dashboard = () => {
    const styles = {
        container: {
            height: '100vh',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundImage: `url(${backgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            color: 'white',
            textAlign: 'center',
        },
        header: {
            marginBottom: '30px',
        },
        title: {
            fontSize: '3rem',
            fontWeight: 'bold',
            marginBottom: '10px',
        },
        subtitle: {
            fontSize: '1.5rem',
            marginBottom: '20px',
        },
        boxesContainer: {
            display: 'flex',
            justifyContent: 'space-around',
            width: '90%',
            maxWidth: '1200px',
            flexWrap: 'wrap',
        },
        box: {
            flex: '1 1 30%', // Adjust width of each box
            margin: '10px',
            padding: '20px',
            backgroundColor: 'rgba(0, 0, 0, 0.7)', // Semi-transparent background
            borderRadius: '10px',
            textAlign: 'center',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
            color: 'white',
        },
        boxImage: {
            width: '100%',
            height: '150px',
            objectFit: 'cover',
            borderRadius: '10px 10px 0 0',
        },
        boxTitle: {
            marginTop: '15px',
            fontSize: '1.2rem',
            fontWeight: 'bold',
        },
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h1 style={styles.title}>UNIFIED <span style={{ color: '#007bff' }}>DASHBOARD</span> ANALYTICS</h1>
                <p style={styles.subtitle}>Turn data into action, transform insights into impact.</p>
            </div>
            <div style={styles.boxesContainer}>
                <div style={styles.box}>
                    <img src={airImage} alt="Air Quality" style={styles.boxImage} />
                    <h2 style={styles.boxTitle}>Air Quality</h2>
                    <p>Monitor and analyze air quality metrics in real time.</p>
                </div>
                <div style={styles.box}>
                    <img src={riverImage} alt="River Quality" style={styles.boxImage} />
                    <h2 style={styles.boxTitle}>River Quality</h2>
                    <p>Track and manage river siltation and water quality levels.</p>
                </div>
                <div style={styles.box}>
                    <img src={soilImage} alt="Soil Quality" style={styles.boxImage} />
                    <h2 style={styles.boxTitle}>Soil Quality</h2>
                    <p>Analyze soil moisture and health for effective land management.</p>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
