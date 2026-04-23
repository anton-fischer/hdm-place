'use client';

import { useEffect, useRef } from "react";
import mapboxgl, { Map } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN!;

export default function MapboxMap() {
    const mapContainer = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<Map | null>(null);

    useEffect(() => {
        if (mapRef.current || !mapContainer.current) return;

        mapRef.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: "mapbox://styles/mapbox/streets-v11",
            center: [9.10121285846779, 48.74130153428095],
            zoom: 15,
        });

        mapRef.current.on('click', (e) => {
            const lng = e.lngLat.lng;
            const lat = e.lngLat.lat;
            console.log("Click registered on coords:", lng, lat);
        });

        //mapRef.current.addControl(new mapboxgl.NavigationControl());

        return () => {
            mapRef.current?.remove();
        };
    }, []);

    return (
        <div ref={mapContainer} style={{ width: "100%", height: "100vh" }}></div>
    );
};