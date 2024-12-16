import React, { useState, useEffect } from "react";
import "./Carousel.css";
import GeneralScreen from "./GeneralScreen";
import AirSolo from "./AirSolo";
import WaterSolo from "./WaterSolo";
import SoilSolo from "./SoilSolo";

const Carousel = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    const [isIdle, setIsIdle] = useState(true); // Track if the user is idle
    const [interactionTimeout, setInteractionTimeout] = useState(null);
    const [transitionsEnabled, setTransitionsEnabled] = useState(true);

    const components = [
        { id: "general", Component: GeneralScreen },
        { id: "air", Component: AirSolo },
        { id: "water", Component: WaterSolo },
        { id: "soil", Component: SoilSolo },
    ];

    useEffect(() => {
        const handleUserInteraction = () => {
            if (!transitionsEnabled) return; // Don't set idle state if transitions are disabled

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
    }, [interactionTimeout, transitionsEnabled]);

    useEffect(() => {
        if (isIdle && transitionsEnabled) {
            const interval = setInterval(() => {
                // Start transition
                setIsAnimating(true);

                // Change page after fade out
                setTimeout(() => {
                    setCurrentIndex((prevIndex) => (prevIndex + 1) % components.length);
                    // Start fade in
                    setTimeout(() => {
                        setIsAnimating(false);
                    }, 50);
                }, 750);
            }, 5000);

            return () => clearInterval(interval);
        }
    }, [isIdle, components.length, transitionsEnabled]);

    const toggleTransitions = () => {
        setTransitionsEnabled(!transitionsEnabled);
        setIsIdle(false); // Reset idle state when toggling
    };

    const CurrentComponent = components[currentIndex].Component;

    return (
        <div className="page-carousel">
            <div className={`page-container ${isAnimating ? 'page-exit' : 'page-active'}`}>
                <CurrentComponent />
            </div>
            <button
                className={`toggle-button ${!transitionsEnabled ? 'disabled' : ''}`}
                onClick={toggleTransitions}
                title={transitionsEnabled ? "Disable Transitions" : "Enable Transitions"}
            >
                {transitionsEnabled ? "⏵" : "⏸"}
            </button>
        </div>
    );
};

export default Carousel;
