import React from "react";
import "./OrbitalLoader.css";

/**
 * OrbitalLoader — INVENZA branded loading spinner
 * Three concentric orbital rings spinning in alternating directions
 * @param {string} message - Optional loading message
 * @param {"top"|"bottom"|"left"|"right"} messagePlacement - Message position
 * @param {string} className - Additional CSS classes
 */
const OrbitalLoader = ({ message, messagePlacement = "bottom", className = "", size = 64 }) => {
    const placementClasses = {
        bottom: "orbital-loader--col",
        top: "orbital-loader--col-reverse",
        right: "orbital-loader--row",
        left: "orbital-loader--row-reverse",
    };

    return (
        <div className={`orbital-loader ${placementClasses[messagePlacement] || placementClasses.bottom}`}>
            <div className={`orbital-spinner ${className}`} style={{ width: size, height: size }}>
                <div className="orbital-ring orbital-ring--outer" />
                <div className="orbital-ring orbital-ring--middle" />
                <div className="orbital-ring orbital-ring--inner" />
            </div>
            {message && <p className="orbital-message">{message}</p>}
        </div>
    );
};

export default OrbitalLoader;
