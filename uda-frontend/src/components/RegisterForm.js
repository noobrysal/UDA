import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { supabase } from './supabaseClient';
import styled from '@emotion/styled';
import logoImage from '../assets/logo.png';
import backgroundImage from '../assets/udabackg.png';

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
  padding: 60px;
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
  width: 250px;
  height: auto;
  margin-bottom: -50px;
`;

const Title = styled.h1`
  padding-top: 40px;
  font-size: 64px;
  font-weight: bold;
  margin-bottom: 10px;
  text-align: center;
  line-height: 1;

  & span:first-of-type {
    color: #17c1d8;
  }

  & span:nth-of-type(2) {
    color: #0cc79f;
  }

  & span:nth-of-type(3) {
    color: #ffde59;
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
    color: #D9D9D9;
  }
`;

const SubmitButton = styled.button`
  background-color: #7ED956;
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

const LoginLink = styled.p`
  font-size: 16px;
  color: white;
  margin-top: -5px;
  font-weight: lighter;

  a {
    color: #83D464;
    text-decoration: none;
  }
`;

const RegisterForm = () => {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    name: '',
    phone: '',
    password: '',
    re_password: '',
  });


  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.re_password) {
      toast.error('Passwords do not match.');
      return;
    }

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.name,
            phone: formData.phone,
            username: formData.username
          }
        }
      });

      if (signUpError) {
        console.error('Signup error:', signUpError);
        throw signUpError;
      }

      if (!data.user?.id) {
        throw new Error('User ID not found after signup');
      }

      toast.success('Registration successful! Please check your email for verification.');
      console.log('Registration successful:', data.user);

      setTimeout(() => {
        navigate('/login');
      }, 3000);

    } catch (error) {
      console.error('Full error details:', error);
      toast.error(error.message || 'An error occurred during registration');
    }
  };


  return (
    <PageContainer>
      <ContentContainer>
        <LogoBox>
          <Logo src={logoImage} alt="Logo" />
          <Title>
            <span>U</span>NIFIED <br /><span>D</span>ASHBOARD <br /><span>A</span>NALYTICS
          </Title>
        </LogoBox>

        <FormBox>
          <h2>Create an account</h2>
          <LoginLink>Already have an account? <a href="/login">Login</a></LoginLink>

          <Form onSubmit={handleSubmit}>
            <Input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email"
              required
            />
            <Input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Username"
              required
            />
            <Input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Full Name"
              required
            />
            <Input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Phone Number"
              required
            />
            <Input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Password"
              required
            />
            <Input
              type="password"
              name="re_password"
              value={formData.re_password}
              onChange={handleChange}
              placeholder="Re-enter Password"
              required
            />
            <SubmitButton type="submit">Register</SubmitButton>
          </Form>
        </FormBox>
      </ContentContainer>
    </PageContainer>
  );
};

export default RegisterForm;