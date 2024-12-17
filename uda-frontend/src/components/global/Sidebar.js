import { useState } from "react";
import { Box, IconButton, Typography, useTheme } from "@mui/material";
import { ProSidebar, Menu, MenuItem } from "react-pro-sidebar";
import 'react-pro-sidebar/dist/css/styles.css';
import { Link, useNavigate } from "react-router-dom";
import { tokens } from "../../theme";
import logo from "../../assets/logo.png";
import DashboardIcon from '@mui/icons-material/Dashboard';
import MenuOutlinedIcon from "@mui/icons-material/MenuOutlined";
import TerrainRoundedIcon from '@mui/icons-material/TerrainRounded';
import WaterOutlinedIcon from '@mui/icons-material/WaterOutlined';
import AirOutlinedIcon from "@mui/icons-material/AirOutlined";
import ReplyIcon from '@mui/icons-material/Reply';
import PersonIcon from '@mui/icons-material/Person';
import { supabase } from '../supabaseClient';
import { useAuth } from '../auth/AuthContext';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

// Modify the Item component to accept and handle onClick
const Item = ({ title, to, icon, selected, setSelected, isCollapsed, onClick }) => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const isSelected = selected === title;

    const handleClick = () => {
        setSelected(title);
        if (onClick) onClick(); // Call the onClick handler if provided
    };

    return (
        <MenuItem
            active={isSelected}
            style={{ color: colors.grey[100] }}
            onClick={handleClick}
            icon={
                <Box
                    sx={{
                        backgroundColor: isSelected ? colors.white[900] : "transparent",
                        padding: "6px",
                        borderRadius: "6px",
                        display: "flex",
                        justifyContent: isCollapsed ? "center" : "flex-start",
                        alignItems: "center",
                        marginLeft: isCollapsed ? "5px" : "8px",
                        transition: "all 0.3s",
                        "&:hover": {
                            backgroundColor: colors.teal[300],
                        },
                    }}
                >
                    {icon}
                </Box>
            }
        >
            {!isCollapsed && (
                <Typography variant="caption">{title}</Typography>
            )}
            {/* Only add Link if it's not the logout item */}
            {title !== "Logout" && <Link to={to} />}
        </MenuItem>
    );
};

// Add a new SubMenuItem component after the Item component
const SubMenuItem = ({ title, to, selected, setSelected, isCollapsed }) => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const isSelected = selected === title;

    return (
        <MenuItem
            active={isSelected}
            style={{
                color: colors.grey[100],
                marginLeft: isCollapsed ? "0" : "20px",
                fontSize: "0.8em"
            }}
            onClick={() => setSelected(title)}
        >
            {!isCollapsed && (
                <Typography variant="caption">{title}</Typography>
            )}
            <Link to={to} />
        </MenuItem>
    );
};

const SidebarComponent = () => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const [isCollapsed, setIsCollapsed] = useState(true);
    const [selected, setSelected] = useState("Dashboard");
    const navigate = useNavigate();
    const { user } = useAuth();
    const [calendarOpen, setCalendarOpen] = useState(false);

    const handleLogout = async () => {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;

            // Clear any stored user data
            localStorage.removeItem('userEmail');

            // Show toast and wait for it to complete before navigating
            toast.info('Logging out...', {
                position: "top-center",
                autoClose: 1500,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: false,
                draggable: true,
                progress: undefined,
                theme: "colored",
                onClose: () => navigate('/login')
            });

        } catch (error) {
            toast.error('Error logging out: ' + error.message);
        }
    };

    // Dynamic background color for the sidebar based on the selected page
    const getBackgroundColor = () => {
        switch (selected) {
            case "Air":
                return "#0F0D1A";
            case "River":
                return "#0A1B1F";
            case "Soil":
                return "#141209";
            default:
                return "black";
        }
    };

    // Add new function to handle sidebar body click
    const handleSidebarClick = (e) => {
        // Don't collapse sidebar when clicking on calendar menu or its subitems
        if (
            !e.target.closest('.logo-container') &&
            !e.target.closest('.calendar-menu') &&
            !e.target.closest('.calendar-subitems')
        ) {
            setIsCollapsed(!isCollapsed);
        }
    };

    return (
        <>
            <Box
                sx={{
                    position: "fixed",
                    top: 28,
                    left: 15,
                    height: "77vh", // Increased from 70vh to 85vh
                    width: isCollapsed ? "60px" : "200px",
                    zIndex: 1300,
                    backgroundColor: getBackgroundColor(), // Dynamic color
                    borderRadius: "30px",
                    boxShadow: isCollapsed ? "none" : "0 0 15px rgba(255, 255, 255, 0.1)",
                    overflow: "hidden",
                    transition: "background 0.3s, width 0.6s",
                    "& .pro-sidebar-inner": {
                        background: "transparent !important",
                    },
                    "& .pro-icon-wrapper": {
                        backgroundColor: "transparent !important",
                    },
                    "& .pro-inner-item": {
                        padding: "3px 20px 3px 10px !important",
                    },
                    "& .pro-inner-item:hover": {
                        color: colors.yellow[700] + " !important",
                    },
                    "& .pro-menu-item.active": {
                        color: colors.teal[800] + " !important",
                    },
                }}
            >
                <ProSidebar
                    collapsed={isCollapsed}
                    onClick={handleSidebarClick}
                >
                    <Menu iconShape="square">
                        <MenuItem
                            className="logo-container" // Add this className
                            onClick={(e) => {
                                e.stopPropagation(); // Prevent click from bubbling to ProSidebar
                                setIsCollapsed(!isCollapsed);
                            }}
                            icon={
                                <img
                                    src={logo}
                                    alt="Logo"
                                    style={{
                                        width: isCollapsed ? "40px" : "30px",
                                        height: "auto",
                                        marginLeft: isCollapsed ? "8px" : "5px",
                                        transition: "all 0.3s",
                                    }}
                                />
                            }
                            style={{
                                margin: "10px 0 20px 0",
                                color: colors.grey[100],
                            }}
                        >
                            {!isCollapsed && (
                                <Box display="flex" justifyContent="space-between" alignItems="center" ml="10px">
                                    <Typography variant="h6" style={{ color: colors.grey[100], fontWeight: "bold" }}>
                                        UDA
                                    </Typography>
                                    <IconButton onClick={() => setIsCollapsed(!isCollapsed)}>
                                        <MenuOutlinedIcon />
                                    </IconButton>
                                </Box>
                            )}
                        </MenuItem>

                        <Box paddingBottom="5px" />

                        <Box paddingLeft={isCollapsed ? undefined : "2%"} display="flex" flexDirection="column" gap="8px">
                            <Item
                                title="Dashboard"
                                to="/carousel"
                                icon={<DashboardIcon />}
                                selected={selected}
                                setSelected={setSelected}
                                isCollapsed={isCollapsed}
                            />
                            <Item
                                title="Air"
                                to="/air-dashboard"
                                icon={<AirOutlinedIcon />}
                                selected={selected}
                                setSelected={setSelected}
                                isCollapsed={isCollapsed}
                            />
                            <Item
                                title="River"
                                to="/water-dashboard"
                                icon={<WaterOutlinedIcon />}
                                selected={selected}
                                setSelected={setSelected}
                                isCollapsed={isCollapsed}
                            />
                            <Item
                                title="Soil"
                                to="/soil-dashboard"
                                icon={<TerrainRoundedIcon />}
                                selected={selected}
                                setSelected={setSelected}
                                isCollapsed={isCollapsed}
                            />
                            {/* <Item
                                title="Calendar"
                                to="/calendar"
                                icon={<CalendarMonthIcon />}
                                selected={selected}
                                setSelected={setSelected}
                                isCollapsed={isCollapsed}
                            /> */}
                        </Box>

                        <Box paddingBottom="140px" />

                        <Box paddingLeft={isCollapsed ? undefined : "2%"} display="flex" flexDirection="column" gap="8px">
                            <MenuItem
                                className="calendar-menu" // Add this className
                                style={{ color: colors.grey[100] }}
                                onClick={(e) => {
                                    e.stopPropagation(); // Stop event from bubbling
                                    if (!isCollapsed) {
                                        setCalendarOpen(!calendarOpen);
                                    }
                                }}
                                icon={
                                    <Box
                                        sx={{
                                            backgroundColor: selected === "Calendar" ? colors.white[900] : "transparent",
                                            padding: "6px",
                                            borderRadius: "6px",
                                            display: "flex",
                                            justifyContent: isCollapsed ? "center" : "flex-start",
                                            alignItems: "center",
                                            marginLeft: isCollapsed ? "5px" : "8px",
                                            transition: "all 0.3s",
                                            "&:hover": {
                                                backgroundColor: colors.teal[300],
                                            },
                                        }}
                                    >
                                        <CalendarMonthIcon />
                                    </Box>
                                }
                            >
                                {!isCollapsed && (
                                    <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
                                        <Typography variant="caption">Calendar</Typography>
                                        {calendarOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                    </Box>
                                )}
                            </MenuItem>

                            {/* Calendar Subitems */}
                            {!isCollapsed && calendarOpen && (
                                <div className="calendar-subitems"> {/* Add this wrapper */}
                                    <SubMenuItem
                                        title="Air Calendar"
                                        to="/air-quality"
                                        selected={selected}
                                        setSelected={setSelected}
                                        isCollapsed={isCollapsed}
                                    />
                                    <SubMenuItem
                                        title="Water Calendar"
                                        to="/water-quality"
                                        selected={selected}
                                        setSelected={setSelected}
                                        isCollapsed={isCollapsed}
                                    />
                                    <SubMenuItem
                                        title="Soil Calendar"
                                        to="/soil-quality"
                                        selected={selected}
                                        setSelected={setSelected}
                                        isCollapsed={isCollapsed}
                                    />
                                </div>
                            )}
                        </Box>

                        <Box paddingBottom="20px" />

                        <Box paddingLeft={isCollapsed ? undefined : "2%"} display="flex" flexDirection="column" gap="8px">
                            <Item
                                title="Profile"
                                to="/profile"
                                icon={<PersonIcon />}
                                selected={selected}
                                setSelected={setSelected}
                                isCollapsed={isCollapsed}
                            />
                            <Item
                                title="Logout"
                                icon={<ReplyIcon />}
                                selected={selected}
                                setSelected={setSelected}
                                isCollapsed={isCollapsed}
                                onClick={handleLogout} // Pass the logout handler directly
                            />
                        </Box>
                    </Menu>
                </ProSidebar>
            </Box>
        </>
    );
};

export default SidebarComponent;
