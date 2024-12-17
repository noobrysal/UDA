import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import styled from '@emotion/styled';
import 'react-toastify/dist/ReactToastify.css';
import logoImage from '../assets/logo.png';
import backgroundImage from '../assets/udabackg4.png';
import { supabase } from './supabaseClient'; // Add this import
import { useAuth } from './auth/AuthContext';

const PageContainer = styled.div`
  display: flex;
  height: 100vh;
  background-image: url(${backgroundImage});
  background-size: cover;
  background-position: center;
  color: white;
  justify-content: center;
  align-items: center;
`;

const ContentContainer = styled.div`
  display: flex;
  width: 1200px;
  height: 700px;
  border-radius: 15px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
`;

const LogoBox = styled.div`
  background-color: rgba(46, 150, 0, 0.2);
  backdrop-filter: blur(10px);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 50%;
  padding: ${({ padding }) => padding || '60px'};
  gap: ${({ gap }) => gap || '20px'}; /* Gap between children (logo and text) */
`;

const FormBox = styled.div`
  background-color: rgba(34, 34, 51, 0.2);
  backdrop-filter: blur(10px);
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  width: 50%;
  padding: 60px;
`;

const Logo = styled.img`
  width: 180px;
  height: auto;
`;

const LogoHeader = styled.h1`
  text-align: center;
  line-height: 1;
  font-weight: bold; /* Makes the header bold */
  font-size: ${({ fontSize }) => fontSize || '70px'}; /* Editable font size */
  margin-top: ${({ marginTop }) => marginTop || '10px'};
  margin-bottom: ${({ marginBottom }) => marginBottom || '10px'};
  color: ${({ color }) => color || 'white'}; /* Editable color */
`;

const LogoText = styled.p`
  margin-top: ${({ marginTop }) => marginTop || '10px'};
  font-size: ${({ fontSize }) => fontSize || '20px'}; /* Editable font size */
  color: ${({ color }) => color || 'white'}; /* Editable color */
  text-align: center;
`;



const LoginHeader = styled.h2`
  font-size: 50px;
  font-weight: bold;
  margin-bottom: 10px;
  color: white;
  margin-top: 0;
`;

const LoginLink = styled.p`
  font-size: 16px;
  color: white;
  margin-top: -5px;
  font-weight: lighter;

  a {
    color: #83d464;
    text-decoration: none;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  width: 100%;
  margin-top: 30px;
`;

const Input = styled.input`
  background-color: #d9d9d926;
  border: none;
  border-radius: 8px;
  padding: 18px;
  font-size: 18px;
  color: white;
  margin-bottom: 20px;

  &::placeholder {
    color: #d9d9d9;
  }
`;

const CheckboxContainer = styled.div`
  display: flex;
  align-items: center;
  font-weight: lighter;
  font-size: 15px;
  color: white;

  label {
    margin-left: 8px;
  }
`;

const SubmitButton = styled.button`
  background-color: #7ed956;
  border: none;
  border-radius: 8px;
  padding: 18px;
  margin-top: 25px;
  font-size: 18px;
  font-weight: bold;
  color: white;
  cursor: pointer;
  width: 100%;

  &:hover {
    background-color: #15b1c2;
  }
`;

const RegisterWithText = styled.p`
  font-size: 16px;
  color: #b0b3b8;
  margin-top: 15px;
  font-weight: lighter;
`;

const SocialContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;

  & > button {
    flex: 1;
    padding: 14px 20px;
    border-radius: 8px;
    border: 1px solid #b0b3b8;
    background-color: transparent;
    color: white;
    font-size: 18px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 250px;

    &:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }
  }
`;

const LoginForm = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;

      localStorage.setItem('userEmail', data.user.email);

      toast.success('Login successful!', {
        position: "top-center",
        autoClose: 1500,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: true,
        progress: undefined,
        theme: "colored",
        onClose: () => navigate('/carousel') // Changed from general-screen to carousel
      });

    } catch (error) {
      toast.error(error.message);
    }
  };

  // Update redirect for already logged-in users
  useEffect(() => {
    if (user && window.location.pathname === '/login') {
      navigate('/carousel'); // Changed from general-screen to carousel
    }
  }, [user, navigate]);

  return (
    <PageContainer>
      <ContentContainer>
        <FormBox>
          <LoginHeader>Log in</LoginHeader>
          <LoginLink>
            Don't have an account? <a href="/register">Sign up.</a>
          </LoginLink>
          <Form onSubmit={handleSubmit}>
            <Input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
            />
            <Input
              type="password"
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
            />
            <CheckboxContainer>
              <input type="checkbox" id="save-password" />
              <label htmlFor="save-password">Save Password?</label>
            </CheckboxContainer>
            <SubmitButton>Continue</SubmitButton>
          </Form>
        </FormBox>
        <LogoBox padding="80px" gap="30px">
          <Logo src={logoImage} alt="Logo" logoMarginBottom="20px" />
          <LogoHeader marginTop="15px" marginBottom="20px">
            <span style={{ color: '#2fcedb' }}>U</span>NIFIED <br />
            <span style={{ color: '#13d7b5' }}>D</span>ASHBOARD <br />
            <span style={{ color: '#ffe470' }}>A</span>NALYTICS
          </LogoHeader>
          <LogoText marginTop="-10px" fontSize="25px">
            Turn data into actions, transform insights into impact.
          </LogoText>
        </LogoBox>
      </ContentContainer>
    </PageContainer>
  );
};

export default LoginForm;