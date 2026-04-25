'use client';

import { useState, useEffect } from "react"

import ColorPicker from "./color-picker";
import GridOverlay from "./grid-overlay";
import MapboxMap from "./mapbox-map";

const COUNTDOWN_TIME = 5;

export default function MapContainer() {
    const [map, setMap] = useState<mapboxgl.Map | null>(null);
    const [isLocked, setIsLocked] = useState(false);
    const [timeLeft, setTimeLeft] = useState(COUNTDOWN_TIME);

    useEffect(() => {
        if (!isLocked) return;

        const interval = setInterval(() => {
            // reduce time until timer hits 0, then unlock
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    setIsLocked(false);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [isLocked]);

    const handlePlacePixel = () => {
        if (isLocked) return;

        setIsLocked(true);
        setTimeLeft(5);
    };

    return (
        <div>
            <ColorPicker isLocked={isLocked} timeLeft={timeLeft} />
            <MapboxMap onMapReady={setMap} />
            {map && <GridOverlay map={map} onPlacePixel={handlePlacePixel} />}
        </div>
    );
}