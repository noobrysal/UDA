import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const Activation = () => {
    const { uidb64, token } = useParams();
    const navigate = useNavigate();
    const [message, setMessage] = useState('');

    useEffect(() => {
        const activateAccount = async () => {
            try {
                const response = await axios.get(`http://127.0.0.1:8000/auth/activate/${uidb64}/${token}/`);
                setMessage('Your account has been successfully activated!');
                setTimeout(() => {
                    navigate('/login');
                }, 3000);  // Redirect to login after 3 seconds
            } catch (error) {
                setMessage('Activation failed. The link might be invalid or expired.');
            }
        };

        activateAccount();
    }, [uidb64, token, navigate]);

    return (
        <div style={styles.container}>
            <div style={styles.messageContainer}>
                <h2 style={styles.heading}>Account Activation</h2>
                <p style={styles.message}>{message}</p>
            </div>
        </div>
    );
};

const styles = {
    container: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        padding: '20px',
        background: '#f5f5f5', // Light background for better readability
    },
    messageContainer: {
        width: '100%',
        maxWidth: '600px',
        background: '#fff', // White background for message container
        padding: '30px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)', // Box shadow for depth
        textAlign: 'center',
    },
    heading: {
        fontFamily: 'Arial, sans-serif',
        fontSize: '24px',
        fontWeight: 'bold',
        marginBottom: '20px',
        color: '#333', // Dark text color for better contrast
    },
    message: {
        fontFamily: 'Arial, sans-serif',
        fontSize: '16px',
        color: '#666', // Grey text color
    },
};

export default Activation;
