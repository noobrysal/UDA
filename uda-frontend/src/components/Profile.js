import React, { useState } from 'react';
import styled from '@emotion/styled';
import { FaPhoneAlt, FaEnvelope } from 'react-icons/fa';
import { BsPlusCircle } from 'react-icons/bs';
import backgroundImage from '../assets/udabackg4.png';

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

const ProfileImage = styled.img`
  width: 130px;
  height: 130px;
  border-radius: 50%;
  object-fit: cover;
  cursor: pointer;
  background-color: #ddd; /* Placeholder background color */
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

const Name = styled(InputField)`
  font-size: 26px;
  font-weight: bold;
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

const FindingsContainer = styled.div`
  flex: 2;
  min-width: 400px;
`;

const FindingsSection = styled(SectionContainer)`
  flex-grow: 1;
  height: 92%;
`;

const FindingsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const FindingsTitle = styled.h3`
  font-size: 26px;
  font-weight: bold;
`;

const AddButton = styled(BsPlusCircle)`
  color: #7ed956;
  font-size: 30px;
  cursor: pointer;
`;

const FindingsList = styled.div`
  margin-top: 25px;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const FindingItem = styled.textarea`
  background-color: rgba(217, 217, 217, 0.5);
  border-radius: 15px;
  padding: 20px;
  color: black;
  font-size: 18px;
  line-height: 1.6;
  font-weight: lighter;
  border: none;
  resize: none;
  width: 100%;
  outline: none;
`;

const ProfilePage = () => {
  const [profile, setProfile] = useState({
    name: "Naey Geur",
    email: "Naegeur@gmail.com",
    phone: "+639 123 4567",
    image: null, // Initially null to indicate no image
  });

  const [findings, setFindings] = useState([
    "Air Pollution and Health: Exposure to air pollutants like particulate matter (PM2.5 and PM10), sulfur dioxide, nitrogen oxides, and carbon monoxide is linked to respiratory and cardiovascular diseases, and it is a major environmental health risk worldwide.",
    "Contaminants: Heavy metals, pesticides, plastics, and industrial waste pollute water bodies, affecting aquatic ecosystems and drinking water safety. Polluted water can lead to diseases such as cholera, dysentery, and hepatitis.",
  ]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setProfile((prev) => ({ ...prev, image: reader.result }));
      reader.readAsDataURL(file);
    }
  };

  const handleAddFinding = () => setFindings([...findings, ""]);

  const handleFindingChange = (index, value) => {
    const updatedFindings = [...findings];
    updatedFindings[index] = value;
    setFindings(updatedFindings);
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
            <label htmlFor="image-upload">
              <ProfileImage
                src={profile.image || "https://via.placeholder.com/130"} // Placeholder image if no profile image is set
                alt="Profile"
              />
            </label>
            <input
              type="file"
              id="image-upload"
              style={{ display: "none" }}
              onChange={handleImageUpload}
            />
            <Name
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            />
            <Role>Admin</Role>

            <ContactInfo>
              <ContactItem>
                <FaPhoneAlt />
                <InputField
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                />
              </ContactItem>
              <ContactItem>
                <FaEnvelope />
                <InputField
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                />
              </ContactItem>
            </ContactInfo>
          </ProfileContainer>

          <StatusContainer>
            <StatusText>
              <StatusLabel>Status:</StatusLabel> <StatusActive>Active</StatusActive>
              <StatusIndicator />
            </StatusText>
          </StatusContainer>
        </LeftColumn>

        <FindingsContainer>
          <FindingsSection>
            <FindingsHeader>
              <FindingsTitle>Findings</FindingsTitle>
              <AddButton onClick={handleAddFinding} />
            </FindingsHeader>

            <FindingsList>
              {findings.map((finding, index) => (
                <FindingItem
                  key={index}
                  value={finding}
                  onChange={(e) => handleFindingChange(index, e.target.value)}
                />
              ))}
            </FindingsList>
          </FindingsSection>
        </FindingsContainer>
      </ContentContainer>
    </PageContainer>
  );
};

export default ProfilePage;
