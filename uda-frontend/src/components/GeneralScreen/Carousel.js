import React, { useState, useEffect } from "react";
import GeneralScreen from "./GeneralScreen";
import AirSolo from "./AirSolo";
import WaterSolo from "./WaterSolo";
import SoilSolo from "./SoilSolo";

const Carousel = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    const [isIdle, setIsIdle] = useState(true); // Track if the user is idle
    const [interactionTimeout, setInteractionTimeout] = useState(null);

    const components = [
        { id: "general", Component: GeneralScreen },
        { id: "air", Component: AirSolo },
        { id: "water", Component: WaterSolo },
        { id: "soil", Component: SoilSolo },
    ];

    useEffect(() => {
        const handleUserInteraction = () => {
            // Reset the idle state when the user interacts
            setIsIdle(false);

            // Clear any existing timeout to prevent the transition countdown
            if (interactionTimeout) {
                clearTimeout(interactionTimeout);
            }

            // Set a new timeout to detect 5 seconds of inactivity
            const newTimeout = setTimeout(() => {
                setIsIdle(true);
            }, 5000); // 5 seconds of inactivity

            setInteractionTimeout(newTimeout);
        };

        // Event listeners to detect user interactions
        window.addEventListener("click", handleUserInteraction);
        window.addEventListener("keydown", handleUserInteraction);
        window.addEventListener("input", handleUserInteraction);

        return () => {
            // Clean up event listeners on component unmount
            window.removeEventListener("click", handleUserInteraction);
            window.removeEventListener("keydown", handleUserInteraction);
            window.removeEventListener("input", handleUserInteraction);
            
            // Clean up the timeout when the component unmounts
            if (interactionTimeout) {
                clearTimeout(interactionTimeout);
            }
        };
    }, [interactionTimeout]);

    useEffect(() => {
        if (isIdle) {
            // If the user is idle, start the transition countdown
            const interval = setInterval(() => {
                setIsAnimating(true);
                setTimeout(() => {
                    setCurrentIndex((prevIndex) => (prevIndex + 1) % components.length);
                    setIsAnimating(false);
                }, 500); // Duration of the animation in ms
            }, 5000); // 10 seconds interval between transitions

            return () => clearInterval(interval);
        }
    }, [isIdle, components.length]);

    const CurrentComponent = components[currentIndex].Component;

    const containerStyle = {
        transition: "opacity 0.5s ease-in-out, background-color 0.5s ease-in-out",
        opacity: isAnimating ? 0 : 1,
        backgroundColor: isAnimating ? "black" : "transparent",
        position: "relative",
        height: "100vh",
        width: "100vw",
    };

    return (
        <div style={containerStyle}>
            <CurrentComponent />
        </div>
    );
};

export default Carousel;
