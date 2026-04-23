'use client';

import styles from "../styles/map-container.module.css"
import MapboxMap from "./mapbox-map";

export default function MapContainer() {
    return (
        <div>
            <MapboxMap />
        </div>
    );
}