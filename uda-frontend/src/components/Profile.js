import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { FaEnvelope } from 'react-icons/fa';
import backgroundImage from '../assets/udabackg4.png';
import { supabase } from './supabaseClient';
import { useAuth } from './auth/AuthContext';
import { toast } from 'react-toastify';

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-image: url(${backgroundImage});
  background-size: cover;
  background-position: center;
  color: white;
  justify-content: flex-start;
  align-items: center;
  overflow: hidden;
`;

const Header = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 20px;
  width: 100%;
  z-index: 1;
  margin-left: 300px;
  margin-top: 10px;
`;

const Titles = styled.div`
  display: flex;
  flex-direction: column;
`;

const MainTitle = styled.h1`
  font-size: 32px;
  font-weight: bold;
  margin: 0;
`;

const Subtitle = styled.p`
  font-size: 20px;
  color: #b0b3b8;
  margin: 0;
`;

const ContentContainer = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 20px;
  width: 85%;
  max-width: 1500px;
  flex-wrap: wrap;
  margin-top: 50px;
  margin-left: 130px;
`;

const LeftColumn = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 20px;
`;

const SectionContainer = styled.div`
  background-color: rgba(167, 183, 189, 0.1);
  backdrop-filter: blur(15px);
  border-radius: 20px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
  padding: 22px;
  display: flex;
  flex-direction: column;
`;

const ProfileContainer = styled(SectionContainer)`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const InputField = styled.input`
  background: transparent;
  color: white;
  border: none;
  font-size: 18px;
  outline: none;
  text-align: center;
  width: 100%;
`;

const DisplayName = styled.div`
  font-size: 26px;
  font-weight: bold;
  color: white;
  text-align: center;
  width: 100%;
`;

const Role = styled.p`
  font-size: 20px;
  color: #83d464;
  margin: 0;
`;

const ContactInfo = styled.div`
  margin-top: 25px;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const ContactItem = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  background-color: rgba(255, 255, 255, 0.15);
  padding: 15px 20px;
  border-radius: 15px;
  font-size: 18px;
`;

const StatusContainer = styled(SectionContainer)``;

const StatusText = styled.div`
  display: flex;
  align-items: center;
  font-size: 20px;
`;

const StatusLabel = styled.span`
  font-weight: bold;
`;

const StatusActive = styled.span`
  font-weight: lighter;
`;

const StatusIndicator = styled.div`
  width: 10px;
  height: 10px;
  background-color: #7ed956;
  border-radius: 50%;
  margin-left: 10px;
`;

const Button = styled.button`
  background-color: #7ed956;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
  margin-top: 10px;
  transition: background-color 0.3s;

  &:hover {
    background-color: #6bc248;
  }
`;

const PasswordChangeForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  margin-top: 15px;
`;

const ProfilePage = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState({
    name: "",
    email: "",
  }); // Removed image and phone from state
  const [isEditing, setIsEditing] = useState(false);
  const [passwords, setPasswords] = useState({
    newPassword: '',
    confirmPassword: '',
  }); // Removed currentPassword as it's not needed
  const [showPasswordChange, setShowPasswordChange] = useState(false);

  useEffect(() => {
    if (user) {
      setProfile(prev => ({
        ...prev,
        email: user.email,
        name: user.user_metadata?.name || "User",
      }));
    }
  }, [user]);

  const handleUpdateProfile = async () => {
    try {
      const { error } = await supabase.auth.updateUser({
        data: { name: profile.name }
      });

      if (error) throw error;

      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      toast.error('Error updating profile: ' + error.message);
    }
  };

  const handlePasswordChange = async () => {
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error('New passwords do not match!');
      return;
    }

    // Add password validation
    if (passwords.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    try {
      // Use updateUser with just the password field
      const { data, error } = await supabase.auth.updateUser({
        password: passwords.newPassword
      });

      if (error) {
        throw error;
      }

      toast.success('Password updated successfully!');
      setShowPasswordChange(false);
      setPasswords({
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      console.error('Password update error:', error);
      toast.error(error.message || 'Error updating password');
    }
  };

  return (
    <PageContainer>
      <Header>
        <Titles>
          <MainTitle>Profile Dashboard</MainTitle>
          <Subtitle>Unified Dashboard Analytics</Subtitle>
        </Titles>
      </Header>

      <ContentContainer>
        <LeftColumn>
          <ProfileContainer>
            {isEditing ? (
              <InputField
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                placeholder="Display Name"
              />
            ) : (
              <DisplayName>{profile.name}</DisplayName>
            )}

            <Role>User</Role>

            {isEditing ? (
              <Button onClick={handleUpdateProfile}>Save Changes</Button>
            ) : (
              <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
            )}

            <ContactInfo>
              <ContactItem>
                <FaEnvelope />
                <span>{profile.email}</span>
              </ContactItem>
            </ContactInfo>

            <Button onClick={() => setShowPasswordChange(!showPasswordChange)}>
              {showPasswordChange ? 'Cancel Password Change' : 'Change Password'}
            </Button>

            {showPasswordChange && (
              <PasswordChangeForm>
                <InputField
                  type="password"
                  placeholder="New Password"
                  value={passwords.newPassword}
                  onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                />
                <InputField
                  type="password"
                  placeholder="Confirm New Password"
                  value={passwords.confirmPassword}
                  onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                />
                <Button onClick={handlePasswordChange}>Update Password</Button>
              </PasswordChangeForm>
            )}
          </ProfileContainer>

          <StatusContainer>
            <StatusText>
              <StatusLabel>Status:</StatusLabel> <StatusActive>Active</StatusActive>
              <StatusIndicator />
            </StatusText>
          </StatusContainer>
        </LeftColumn>
      </ContentContainer>
    </PageContainer>
  );
};

export default ProfilePage;
