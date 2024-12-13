import React from 'react';
import backgroundImage from '../../assets/udabackg4.png';

const GeneralScreen = () => {



    return (
        <div style={styles.fullcontainer}>
            <div style={styles.headerContainer}>
                <header style={styles.header}>
                    <div>
                        <h1 style={styles.title}>Home Dashboard</h1>
                        <p style={styles.subtitle}>Unified Dashboard Analytics</p>
                    </div>
                </header>
            </div>
            <div style={styles.gridContainer}>
                {/* Air Quality Column */}
                <div style={styles.column}>
                    <div style={styles.box1}>
                        <div style={styles.iotHeaderBox}>
                            <h2 style={styles.airHeaderTitle}>Air Quality</h2>
                        </div>
                    </div>
                    <div style={styles.box2}>
                        <div style={styles.iotHeaderBox}>
                            <h2 style={styles.airHeaderTitle}>Unsa man diri</h2>
                        </div>
                    </div>
                    <div style={styles.box3}>
                        <div style={styles.iotHeaderBox}>
                            <h2 style={styles.airHeaderTitle}>Air Narrative Summary</h2>
                        </div>
                    </div>
                </div>

                {/* Water Quality Column */}
                <div style={styles.column}>
                    <div style={styles.box4}>
                        <div style={styles.iotHeaderBox}>
                            <h2 style={styles.waterHeaderTitle}>Water Quality</h2>
                        </div>
                    </div>
                    <div style={styles.box5}>
                        <div style={styles.iotHeaderBox}>
                            <h2 style={styles.waterHeaderTitle}>Unsa man diri</h2>
                        </div>
                    </div>
                    <div style={styles.box6}>
                        <div style={styles.iotHeaderBox}>
                            <h2 style={styles.waterHeaderTitle}>Water Narrative Summary</h2>
                        </div>
                    </div>
                </div>

                {/* Soil Quality Column */}
                <div style={styles.column}>
                    <div style={styles.box7}>
                        <div style={styles.iotHeaderBox}>
                            <h2 style={styles.soilHeaderTitle}>Soil Quality</h2>
                        </div>
                    </div>
                    <div style={styles.box8}>
                        <div style={styles.iotHeaderBox}>
                            <h2 style={styles.soilHeaderTitle}>Unsa man diri</h2>
                        </div>
                    </div>
                    <div style={styles.box9}>
                        <div style={styles.iotHeaderBox}>
                            <h2 style={styles.soilHeaderTitle}>Soil Narrative Summary</h2>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


const styles = {
    // Main container with background
    fullcontainer: {
        height: "100vh",
        width: "100vw",
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        display: "flex",
        flexDirection: "column",
        padding: "20px",
        overflow: "hidden",
        boxSizing: "border-box",
    },

    // Header styles
    headerContainer: {
        display: "flex",
        justifyContent: "center",
        marginBottom: "20px",
        marginTop: "5px",
        marginLeft: "70px",
    },
    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        width: "100%",
        textAlign: "left",
        color: "#fff",
    },
    title: {
        fontSize: "28px",
        fontWeight: "bold",
        margin: 0,
        color: "#fff",
    },
    subtitle: {
        fontSize: "15px",
        margin: 0,
        color: "#fff",
    },

    // Grid container styles
    gridContainer: {
        display: "flex",
        flexDirection: "row",
        flex: 1,
        gap: "20px",
        marginLeft: "70px",
    },

    // Column styles
    column: {
        flex: 1,
        display: "flex",
        flexDirection: "column",
        gap: "15px",
    },

    iotHeaderBox: {
        margin: 0,
        fontWeight: "bold",
        textAlign: "left",
    },
    iotHeaderTitle: {
        fontSize: "1.2rem",
        color: "#fff",
    },

    // Box styles AIR QUALITY
    box1: {
        flex: 1,
        backgroundColor: "rgba(22, 193, 255, 0.2)",
        borderRadius: "30px",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",  // Align header to the left
        justifyContent: "flex-start",
        fontSize: "1.5rem",
        color: "#fff",
        fontWeight: "bold",
        padding: "20px",
    },
    box2: {
        flex: 0.3,
        backgroundColor: "rgba(22, 193, 255, 0.2)",
        borderRadius: "30px",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",  // Align header to the left
        justifyContent: "flex-start",
        fontSize: "1.5rem",
        color: "#fff",
        fontWeight: "bold",
        padding: "20px",
    },
    box3: {
        flex: 0.5,
        backgroundColor: "rgba(22, 193, 255, 0.2)",
        borderRadius: "30px",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",  // Align header to the left
        justifyContent: "flex-start",
        fontSize: "1.5rem",
        color: "#fff",
        fontWeight: "bold",
        padding: "20px",
    },
    airHeaderTitle: {
        fontSize: "1.2rem",
        color: "#fff",
    },


    // Box styles WATER QUALITY
    box4: {
        flex: 1,
        backgroundColor: "rgba(188, 255, 159, 0.2)",
        borderRadius: "30px",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",  // Align header to the left
        justifyContent: "flex-start",
        fontSize: "1.5rem",
        color: "#fff",
        fontWeight: "bold",
        padding: "20px",
    },
    box5: {
        flex: 0.3,
        backgroundColor: "rgba(188, 255, 159, 0.2)",
        borderRadius: "30px",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",  // Align header to the left
        justifyContent: "flex-start",
        fontSize: "1.5rem",
        color: "#fff",
        fontWeight: "bold",
        padding: "20px",
    },
    box6: {
        flex: 0.5,
        backgroundColor: "rgba(188, 255, 159, 0.2)",
        borderRadius: "30px",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",  // Align header to the left
        justifyContent: "flex-start",
        fontSize: "1.5rem",
        color: "#fff",
        fontWeight: "bold",
        padding: "20px",
    },
    waterHeaderTitle: {
        fontSize: "1.2rem",
        color: "#fff",
    },

    // Box styles SOIL QUALITY
    box7: {
        flex: 1,
        backgroundColor: "rgba(255, 222, 89, 0.2)",
        borderRadius: "30px",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",  // Align header to the left
        justifyContent: "flex-start",
        fontSize: "1.5rem",
        color: "#fff",
        fontWeight: "bold",
        padding: "20px",
    },
    box8: {
        flex: 0.3,
        backgroundColor: "rgba(255, 222, 89, 0.2)",
        borderRadius: "30px",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",  // Align header to the left
        justifyContent: "flex-start",
        fontSize: "1.5rem",
        color: "#fff",
        fontWeight: "bold",
        padding: "20px",
    },
    box9: {
        flex: 0.5,
        backgroundColor: "rgba(255, 222, 89, 0.2)",
        borderRadius: "30px",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",  // Align header to the left
        justifyContent: "flex-start",
        fontSize: "1.5rem",
        color: "#fff",
        fontWeight: "bold",
        padding: "20px",
    },
    soilHeaderTitle: {
        fontSize: "1.2rem",
        color: "#fff",
    },
};

export default GeneralScreen;
