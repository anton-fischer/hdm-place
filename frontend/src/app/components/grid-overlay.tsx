'use client';

import { useEffect, useRef } from "react";
import styles from "../styles/grid-overlay.module.css"

const GRID_SIZE = 20;
const GRID_ZOOM = 15;

type GridOverlayProps = {
    map: mapboxgl.Map;
    onPlacePixel: () => void;
};

export default function GridOverlay({ map, onPlacePixel }: GridOverlayProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    let currentSize = GRID_SIZE;

    useEffect(() => {
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext("2d")!;

        const handleGridClick = (e: mapboxgl.MapMouseEvent) => {
            const { x, y } = e.point;
            const lngLat = e.lngLat;

            const gridX = Math.floor(x / currentSize);
            const gridY = Math.floor(y / currentSize);

            console.log(`Grid click registered: Coordinates [${lngLat.lng}|${lngLat.lat}] | Canvas Pixel [${gridX}|${gridY}]`);

            onPlacePixel();
        }

        const resize = () => {
            const rect = map.getContainer().getBoundingClientRect();
            canvas.width = rect.width;
            canvas.height = rect.height;
        };

        const draw = () => {
            resize();

            // stable grid size
            currentSize = GRID_SIZE * Math.pow(2, map.getZoom() - GRID_ZOOM);

            // use this as fixed reference point, attach grid there
            const origin = map.project([0, 0]);

            const startX = origin.x % currentSize;
            const startY = origin.y % currentSize;

            // create canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.strokeStyle = "rgba(0,0,0,0.2)";
            ctx.lineWidth = 1;

            // create vertical grid
            for (let x = startX; x < canvas.width; x += currentSize) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, canvas.height);
                ctx.stroke();
            }

            // create horizontal grid
            for (let y = startY; y < canvas.height; y += currentSize) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(canvas.width, y);
                ctx.stroke();
            }
        };

        const update = () => {
            resize();
            draw();
        };

        update();

        map.on("click", handleGridClick)
        map.on("move", update);
        map.on("zoom", update);
        window.addEventListener("resize", update);

        return () => {
            map.off("click", handleGridClick);
            map.off("move", update);
            map.off("zoom", update);
            window.removeEventListener("resize", update);
        };
    }, [map]);

    return (
        <canvas ref={canvasRef} className={styles.grid} />
    );
}