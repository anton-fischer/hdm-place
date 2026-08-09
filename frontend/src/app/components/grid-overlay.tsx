'use client';

import { RefObject, useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";

import Logger from "../utils/logger";

import styles from "../styles/grid-overlay.module.css"

const GRID_TILE_SIZE = 0.000001; // size of a pixel in the grid
const GRID_ZOOM = 15;            // inital zoom of the map

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
        const startX = Math.floor(sw.x / GRID_TILE_SIZE) * GRID_TILE_SIZE;
        const startY = Math.floor(ne.y / GRID_TILE_SIZE) * GRID_TILE_SIZE;

        // create canvas
        ctx.strokeStyle = "rgba(0,0,0,0.2)";
        ctx.lineWidth = 1;

        // create vertical lines (x equals lng)
        for (let x = startX; x <= ne.x; x += GRID_TILE_SIZE) {
            const top = new mapboxgl.MercatorCoordinate(x, ne.y, 0).toLngLat();
            const bot = new mapboxgl.MercatorCoordinate(x, sw.y, 0).toLngLat();
            const p1 = map.project(top);
            const p2 = map.project(bot);
            ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
        }

        // create horizontal lines (y equals lat)
        for (let y = startY; y <= sw.y; y += GRID_TILE_SIZE) {
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
                pixel.x * GRID_TILE_SIZE < sw.x ||
                pixel.x * GRID_TILE_SIZE > ne.x ||
                pixel.y * GRID_TILE_SIZE < ne.y ||
                pixel.y * GRID_TILE_SIZE > sw.y
            ) continue;

            const topLeft = new mapboxgl.MercatorCoordinate(
                pixel.x * GRID_TILE_SIZE,
                pixel.y * GRID_TILE_SIZE,
                0
            ).toLngLat();
            const bottomRight = new mapboxgl.MercatorCoordinate(
                (pixel.x + 1) * GRID_TILE_SIZE,
                (pixel.y + 1) * GRID_TILE_SIZE,
                0
            ).toLngLat();

            const p1 = map.project(topLeft);
            const p2 = map.project(bottomRight);

            ctx.fillStyle = pixel.color;
            ctx.fillRect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);
        }

        Logger.log("Updated grid");
    };

    useEffect(() => {
        const handleGridClick = (e: mapboxgl.MapMouseEvent) => {
            const lngLat = e.lngLat;
            const merc = mapboxgl.MercatorCoordinate.fromLngLat(lngLat);

            const gridX = Math.floor(merc.x / GRID_TILE_SIZE);
            const gridY = Math.floor(merc.y / GRID_TILE_SIZE);

            Logger.log(`Grid click registered: Coordinates [${lngLat.lng}|${lngLat.lat}] | Canvas Pixel [${gridX}|${gridY}]`);

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
        //Logger.log("PIXEL COUNT UPDATE CHILD")
        updateGrid();
    }, [pixelCount]);

    return (
        <canvas ref={canvasRef} className={styles.grid} />
    );
}