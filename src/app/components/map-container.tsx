'use client';

import styles from "../styles/map-container.module.css"
import ColorPicker from "./color-picker";
import MapboxMap from "./mapbox-map";

export default function MapContainer() {
    return (
        <div>
            <ColorPicker />
            <MapboxMap />
        </div>
    );
}