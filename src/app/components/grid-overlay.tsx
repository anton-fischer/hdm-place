'use client';

import { useEffect, useRef } from "react";
import styles from "../styles/grid-overlay.module.css"

const GRID_SIZE = 20;
const GRID_ZOOM = 15;

type GridOverlayProps = {
    map: mapboxgl.Map;
};

export default function GridOverlay({ map }: GridOverlayProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext("2d")!;

        map.on("click", (e) => {
            // todo print coords
        });

        const resize = () => {
            const rect = map.getContainer().getBoundingClientRect();
            canvas.width = rect.width;
            canvas.height = rect.height;
        };

        const draw = () => {
            resize();

            // stable grid size
            const size = GRID_SIZE * Math.pow(2, map.getZoom() - GRID_ZOOM);

            // use this as fixed reference point, attach grid there
            const origin = map.project([0, 0]);

            const startX = origin.x % size;
            const startY = origin.y % size;

            // create canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.strokeStyle = "rgba(0,0,0,0.2)";
            ctx.lineWidth = 1;

            // create vertical grid
            for (let x = startX; x < canvas.width; x += size) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, canvas.height);
                ctx.stroke();
            }

            // create horizontal grid
            for (let y = startY; y < canvas.height; y += size) {
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

        map.on("move", update);
        map.on("zoom", update);
        window.addEventListener("resize", update);

        return () => {
            map.off("move", update);
            map.off("zoom", update);
            window.removeEventListener("resize", update);
        };
    }, [map]);

    return (
        <canvas ref={canvasRef} className={styles.grid} />
    );
}