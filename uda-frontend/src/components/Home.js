import React from 'react';
import udaLogo from '../static/uda-logo.jpg'; // Change the import name

const Home = () => {
    const styles = {
        container: {
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#1c1c1c', // Background color for the home page
            color: 'white',
            position: 'relative',
            textAlign: 'center',
            margin: 0, // Ensure no margin is applied
            padding: 0, // Ensure no padding is applied
        },
        logo: {
            width: '150px', // Adjust size of the placeholder logo
            marginBottom: '20px',
            display: 'block', // Ensure it is a block element
            objectFit: 'contain', // Maintain aspect ratio and avoid stretching
        },
        title: {
            fontSize: '3rem',
            marginBottom: '10px',
        },
        subtitle: {
            fontSize: '1.5rem',
            marginBottom: '20px',
        },
        proceedButton: {
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            textDecoration: 'none',
            transition: 'background-color 0.3s',
        },
    };

    return (
        <div style={styles.container}>
            <img
                src={udaLogo} // Use the updated import name here
                alt="Logo"
                style={styles.logo}
            />
            <h1 style={styles.title}>UNIFIED <span style={{ color: '#007bff' }}>DASHBOARD</span> ANALYTICS</h1>
            <p style={styles.subtitle}>Turn data into action, transform insights into impact.</p>
            <a href="#proceed" style={styles.proceedButton}>Proceed</a>
        </div>
    );
};

export default Home;
