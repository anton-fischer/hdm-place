'use client';

import { useState } from "react"
import styles from "../styles/map-container.module.css"

import ColorPicker from "./color-picker";
import GridOverlay from "./grid-overlay";
import MapboxMap from "./mapbox-map";

export default function MapContainer() {
    const [map, setMap] = useState<mapboxgl.Map | null>(null);

    return (
        <div>
            <ColorPicker />
            <MapboxMap onMapReady={setMap} />
            {map && <GridOverlay map={map} />}
        </div>
    );
}