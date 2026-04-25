'use client';

import { useEffect, useRef } from "react";
import mapboxgl, { Map } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN!;

type MapboxMapProps = {
    onMapReady: (map: mapboxgl.Map) => void;
};

export default function MapboxMap({ onMapReady }: MapboxMapProps) {
    const mapContainer = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<Map | null>(null);

    useEffect(() => {
        if (mapRef.current || !mapContainer.current) return;

        const bounds: mapboxgl.LngLatBoundsLike = [
            [9.070903396401832, 48.73528416944094], // south west bounds
            [9.139581464091322, 48.75982205278953]  // north east bounds
        ];

        mapRef.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: "mapbox://styles/mapbox/streets-v11",
            center: [9.10121285846779, 48.74130153428095],
            //maxBounds: bounds,
            zoom: 15,
            minZoom: 14
        });

        /*mapRef.current.on("click", (e) => {
            const lng = e.lngLat.lng;
            const lat = e.lngLat.lat;
            console.log("Click registered on coords:", lng, lat);
        });*/

        mapRef.current.on("load", () => {
            if (mapRef.current) onMapReady(mapRef.current);
        });

        //mapRef.current.addControl(new mapboxgl.NavigationControl());
        mapRef.current.scrollZoom.setWheelZoomRate(1.5);

        return () => {
            mapRef.current?.remove();
        };
    }, []);

    return (
        <div ref={mapContainer} style={{ width: "100%", height: "100vh" }}></div>
    );
};