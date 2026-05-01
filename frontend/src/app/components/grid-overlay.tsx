'use client';

import { useEffect, useRef } from "react";
import styles from "../styles/grid-overlay.module.css"

const GRID_SIZE = 20;
const GRID_ZOOM = 15;

type GridOverlayProps = {
    map: mapboxgl.Map;
    onPlacePixel: (x: number, y: number) => void;
};

type Pixel = {
    x: number;
    y: number;
    color: string;
    placedBy: string,
    placedAt: number
};

export default function GridOverlay({ map, onPlacePixel }: GridOverlayProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const currentSizeRef = useRef(GRID_SIZE);

    let pixelCache = [{ x: 0, y: 0, color: '#0000ff', placedBy: 'abc', placedAt: 1777628044006 }, { x: 1, y: 1, color: '#0000ff', placedBy: 'abc', placedAt: 1777628044006 }, { x: 2, y: 2, color: '#0000ff', placedBy: 'abc', placedAt: 1777628044006 }];

    useEffect(() => {
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext("2d")!;

        const handleGridClick = (e: mapboxgl.MapMouseEvent) => {
            const { x, y } = e.point;
            const lngLat = e.lngLat;

            const gridX = Math.floor(x / currentSizeRef.current);
            const gridY = Math.floor(y / currentSizeRef.current);

            console.log(`Grid click registered: Coordinates [${lngLat.lng}|${lngLat.lat}] | Canvas Pixel [${gridX}|${gridY}]`);

            // temp for testing
            const pixel = { x: gridX, y: gridY, color: '#ff0000', placedBy: 'abc', placedAt: 1777628044006 };
            console.log(pixelCache);
            pixelCache.push(pixel);

            updatePixel(pixel);

            onPlacePixel(x, y);
        }

        const resize = () => {
            const rect = map.getContainer().getBoundingClientRect();
            canvas.width = rect.width;
            canvas.height = rect.height;
        };

        const draw = () => {
            resize();

            // stable grid size
            currentSizeRef.current = GRID_SIZE * Math.pow(2, map.getZoom() - GRID_ZOOM);

            // use this as fixed reference point, attach grid there
            const origin = map.project([0, 0]);

            const startX = origin.x % currentSizeRef.current;
            const startY = origin.y % currentSizeRef.current;

            // create canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.strokeStyle = "rgba(0,0,0,0.2)";
            ctx.lineWidth = 1;

            // create vertical grid
            for (let x = startX; x < canvas.width; x += currentSizeRef.current) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, canvas.height);
                ctx.stroke();
            }

            // create horizontal grid
            for (let y = startY; y < canvas.height; y += currentSizeRef.current) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(canvas.width, y);
                ctx.stroke();
            }

            for (let pixel of pixelCache) {
                ctx.fillStyle = pixel.color;
                ctx.fillRect(
                    startX + pixel.x * currentSizeRef.current,
                    startY + pixel.y * currentSizeRef.current,
                    currentSizeRef.current,
                    currentSizeRef.current
                );
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

    const updatePixel = async (pixel: Pixel) => {
        console.log("placing pixel");
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext("2d")!;

        const size = currentSizeRef.current;
        const origin = map.project([0, 0]);

        const startX = origin.x % size;
        const startY = origin.y % size;

        ctx.fillStyle = pixel.color;
        ctx.fillRect(
            startX + pixel.x * size,
            startY + pixel.y * size,
            size,
            size
        );
    };

    //const updateArea = async (x1: number, y1: number, x2: number, y2: number, data: object[]) => {
    const updateArea = async (pixels: Pixel[]) => {
        console.log("updating pixels");

        const canvas = canvasRef.current!;
        const ctx = canvas.getContext("2d")!;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        pixelCache.forEach(pixel => {
            updatePixel(pixel);
        });
    };

    return (
        <canvas ref={canvasRef} className={styles.grid} />
    );
}