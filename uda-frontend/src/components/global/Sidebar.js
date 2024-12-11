import { useState } from "react";
import { Box, IconButton, Typography, useTheme } from "@mui/material";
import { ProSidebar, Menu, MenuItem } from "react-pro-sidebar"; 
import 'react-pro-sidebar/dist/css/styles.css'; 
import { Link } from "react-router-dom";
import { tokens } from "../../theme";
import logo from "../../assets/logo.png";
import DashboardIcon from '@mui/icons-material/Dashboard';
import MenuOutlinedIcon from "@mui/icons-material/MenuOutlined";
import TerrainRoundedIcon from '@mui/icons-material/TerrainRounded';
import WaterOutlinedIcon from '@mui/icons-material/WaterOutlined';
import AirOutlinedIcon from "@mui/icons-material/AirOutlined";
import ReplyIcon from '@mui/icons-material/Reply';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PersonIcon from '@mui/icons-material/Person';

const Item = ({ title, to, icon, selected, setSelected, isCollapsed }) => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const isSelected = selected === title;

    return (
        <MenuItem
            active={isSelected}
            style={{ color: colors.grey[100]}}
            onClick={() => setSelected(title)}
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
            <Link to={to} />
        </MenuItem>
    );
};

const SidebarComponent = () => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const [isCollapsed, setIsCollapsed] = useState(true);
    const [selected, setSelected] = useState("Dashboard");

    // Dynamic background color for the sidebar based on the selected page
    const getBackgroundColor = () => {
        switch (selected) {
            case "Air":
                return "#0F0D1A";
            case "River":
                return "#0B1A12";
            case "Soil":
                return "#141209";
            default:
                return "black";
        }
    };

    return (
        <Box
            sx={{
                position: "fixed",
                top: 28,
                left: 15,
                height: "70vh",
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
            <ProSidebar collapsed={isCollapsed}>
                <Menu iconShape="square">
                    <MenuItem
                        onClick={() => setIsCollapsed(!isCollapsed)}
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
                            to="/air"
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
                            to="/"
                            icon={<WaterOutlinedIcon />}
                            selected={selected}
                            setSelected={setSelected}
                            isCollapsed={isCollapsed}
                        />
                        <Item
                            title="Soil"
                            to="/"
                            icon={<TerrainRoundedIcon />}
                            selected={selected}
                            setSelected={setSelected}
                            isCollapsed={isCollapsed}
                        />
                        <Item
                            title="Calendar"
                            to="/calendar"
                            icon={<CalendarMonthIcon />}
                            selected={selected}
                            setSelected={setSelected}
                            isCollapsed={isCollapsed}
                        />
                    </Box>

                    <Box paddingBottom="140px" />

                    <Box paddingLeft={isCollapsed ? undefined : "2%"} display="flex" flexDirection="column" gap="8px">
                        <Item
                            title="Profile"
                            to="/profilepage"
                            icon={<PersonIcon />}
                            selected={selected}
                            setSelected={setSelected}
                            isCollapsed={isCollapsed}
                        />
                        <Item
                            title="Logout"
                            to="/"
                            icon={<ReplyIcon />}
                            selected={selected}
                            setSelected={setSelected}
                            isCollapsed={isCollapsed}
                        />
                    </Box>
                </Menu>
            </ProSidebar>
        </Box>
    );
};

export default SidebarComponent;
