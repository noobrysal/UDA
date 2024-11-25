import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faHome, faInfoCircle, faEnvelope, faCog, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
const Sidebar = ({ children }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const menuItems = [
        { icon: faHome, label: "Home" },
        { icon: faInfoCircle, label: "About" },
        { icon: faEnvelope, label: "Messages" },
        { icon: faCog, label: "Settings" },
        { icon: faSignOutAlt, label: "Logout" },
    ];

    const appStyles = {
        sidebar: {
            position: "fixed", // Sticky sidebar
            top: 0,
            left: 0,
            width: isExpanded ? "200px" : "60px",
            transition: "width 0.3s",
            backgroundColor: "#343a40",
            color: "#fff",
            height: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: isExpanded ? "flex-start" : "center",
            paddingTop: "10px",
            zIndex: 1000,
        },
        burger: {
            backgroundColor: "transparent",
            border: "none",
            color: "white",
            margin: isExpanded ? "10px 10px" : "10px 0",
            cursor: "pointer",
            fontSize: "20px",
        },
        menuItem: {
            display: "flex",
            alignItems: "center",
            padding: "10px",
            width: "100%",
            cursor: "pointer",
            transition: "background-color 0.2s",
        },
        menuItemHover: {
            backgroundColor: "#495057",
        },
        icon: {
            fontSize: "20px",
            marginRight: isExpanded ? "10px" : "0",
        },
        label: {
            fontSize: "16px",
        },
        content: {
            marginLeft: isExpanded ? "200px" : "60px", // Adjust content margin dynamically

            transition: "margin-left 0.3s", // Smooth transition
        },
        layout: {
            display: "flex",
        },
    };

    return (
        <div style={appStyles.layout}>
            {/* Sidebar */}
            <div style={appStyles.sidebar}>
                {/* Burger Menu */}
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    style={appStyles.burger}
                >
                    <FontAwesomeIcon icon={faBars} />
                </button>

                {/* Menu Items */}
                {menuItems.map((item, index) => (
                    <div
                        key={index}
                        style={appStyles.menuItem}
                        onMouseOver={(e) =>
                        (e.currentTarget.style.backgroundColor =
                            appStyles.menuItemHover.backgroundColor)
                        }
                        onMouseOut={(e) =>
                            (e.currentTarget.style.backgroundColor = "transparent")
                        }
                    >
                        <FontAwesomeIcon icon={item.icon} style={appStyles.icon} />
                        {isExpanded && <span style={appStyles.label}>{item.label}</span>}
                    </div>
                ))}
            </div>

            {/* Dynamic Main Content */}
            <div style={appStyles.content}>{children}</div>
        </div>
    );
};

export default Sidebar;
