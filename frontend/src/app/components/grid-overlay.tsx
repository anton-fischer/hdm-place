'use client';

import { RefObject, useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";

import styles from "../styles/grid-overlay.module.css"

const TILE_SIZE = 0.000001;
const GRID_ZOOM = 15;

type Pixel = {
    x: number;
    y: number;
    color: string;
    placedBy: string,
    placedAt: number
};

type GridOverlayProps = {
    map: mapboxgl.Map;
    pixelCache: RefObject<Pixel[]>;
    pixelCount: number;
    onPixelClick: (x: number, y: number, lang: number, lat: number) => void;
};

export default function GridOverlay({ map, pixelCache, pixelCount, onPixelClick }: GridOverlayProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    // used to place single pixels
    // TODO maybe remove because right now its not that big of a performance improvement (grid gets rendered new at every move anyways)
    const updatePixel = (pixel: Pixel) => {
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext("2d")!;

        const topLeft = new mapboxgl.MercatorCoordinate(
            pixel.x * TILE_SIZE,
            pixel.y * TILE_SIZE,
            0
        ).toLngLat();
        const bottomRight = new mapboxgl.MercatorCoordinate(
            (pixel.x + 1) * TILE_SIZE,
            (pixel.y + 1) * TILE_SIZE,
            0
        ).toLngLat();

        const p1 = map.project(topLeft);
        const p2 = map.project(bottomRight);

        ctx.fillStyle = pixel.color;
        ctx.fillRect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);
    };

    const resize = () => {
        const canvas = canvasRef.current!;
        const mapSize = map.getContainer().getBoundingClientRect();

        canvas.width = mapSize.width;
        canvas.height = mapSize.height;
    };

    const updateGrid = () => {
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext("2d")!;

        resize();
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // only render grid at a certain zoom level
        if (map.getZoom() < GRID_ZOOM - 2) return;

        const bounds = map.getBounds();
        if (!bounds) return;
        const sw = mapboxgl.MercatorCoordinate.fromLngLat(bounds.getSouthWest());
        const ne = mapboxgl.MercatorCoordinate.fromLngLat(bounds.getNorthEast());

        // grid lines based on visible area
        const startX = Math.floor(sw.x / TILE_SIZE) * TILE_SIZE;
        const startY = Math.floor(ne.y / TILE_SIZE) * TILE_SIZE;

        // create canvas
        ctx.strokeStyle = "rgba(0,0,0,0.2)";
        ctx.lineWidth = 1;

        // create vertical lines (x equals lng)
        for (let x = startX; x <= ne.x; x += TILE_SIZE) {
            const top = new mapboxgl.MercatorCoordinate(x, ne.y, 0).toLngLat();
            const bot = new mapboxgl.MercatorCoordinate(x, sw.y, 0).toLngLat();
            const p1 = map.project(top);
            const p2 = map.project(bot);
            ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
        }

        // create horizontal lines (y equals lat)
        for (let y = startY; y <= sw.y; y += TILE_SIZE) {
            const left = new mapboxgl.MercatorCoordinate(sw.x, y, 0).toLngLat();
            const right = new mapboxgl.MercatorCoordinate(ne.x, y, 0).toLngLat();
            const p1 = map.project(left);
            const p2 = map.project(right);
            ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
        }

        // place cached pixels
        for (let pixel of pixelCache.current) {
            // check if pixel is currently visible, else skip
            if (
                pixel.x * TILE_SIZE < sw.x ||
                pixel.x * TILE_SIZE > ne.x ||
                pixel.y * TILE_SIZE < ne.y ||
                pixel.y * TILE_SIZE > sw.y
            ) continue;

            const topLeft = new mapboxgl.MercatorCoordinate(
                pixel.x * TILE_SIZE,
                pixel.y * TILE_SIZE,
                0
            ).toLngLat();
            const bottomRight = new mapboxgl.MercatorCoordinate(
                (pixel.x + 1) * TILE_SIZE,
                (pixel.y + 1) * TILE_SIZE,
                0
            ).toLngLat();

            const p1 = map.project(topLeft);
            const p2 = map.project(bottomRight);

            ctx.fillStyle = pixel.color;
            ctx.fillRect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);
        }
    };

    useEffect(() => {
        const handleGridClick = (e: mapboxgl.MapMouseEvent) => {
            const lngLat = e.lngLat;
            const merc = mapboxgl.MercatorCoordinate.fromLngLat(lngLat);

            const gridX = Math.floor(merc.x / TILE_SIZE);
            const gridY = Math.floor(merc.y / TILE_SIZE);

            console.log(`Grid click registered: Coordinates [${lngLat.lng}|${lngLat.lat}] | Canvas Pixel [${gridX}|${gridY}]`);

            onPixelClick(gridX, gridY, lngLat.lng, lngLat.lat);
        }

        updateGrid();

        map.on("click", handleGridClick)
        map.on("move", updateGrid);
        map.on("zoom", updateGrid);
        window.addEventListener("resize", updateGrid);

        return () => {
            map.off("click", handleGridClick);
            map.off("move", updateGrid);
            map.off("zoom", updateGrid);
            window.removeEventListener("resize", updateGrid);
        };
    }, [map, onPixelClick]);

    useEffect(() => {
        updateGrid();
    }, [pixelCount]);

    return (
        <canvas ref={canvasRef} className={styles.grid} />
    );
}