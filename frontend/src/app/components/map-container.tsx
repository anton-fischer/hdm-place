'use client';

import { ENABLE_LOGGING, API_URL, COUNTDOWN_TIME } from "../config"

import { useState, useEffect, useRef } from "react"
import { faTriangleExclamation, faSpinner, IconDefinition } from "@fortawesome/free-solid-svg-icons";
import { Toaster } from "react-hot-toast";

import { notifyError, notifySuccess } from "../utils/toast"
import { placePixel, fetchPixelArea, fetchCooldown, fetchPixel } from "../utils/api";

import styles from "../styles/map-container.module.css"

import mapboxgl from 'mapbox-gl';

import ColorPicker from "./color-picker";
import GridOverlay from "./grid-overlay";
import MapboxMap from "./mapbox-map";
import MessageBox from "./message-box";

const GRID_TILE_SIZE = 0.000001; // size of a pixel in the grid

const CHUNK_SIZE = 256;          // size of the chunks
const CHUNK_PRELOAD_AMOUNT = 1;  // how many chunks shall be preloaded
const CHUNK_LOAD_DEBOUNCE = 250; // debounce in ms

type Pixel = {
    x: number;
    y: number;
    color: string;
    placedBy: string,
    placedAt: number
};

export default function MapContainer() {
    const [map, setMap] = useState<mapboxgl.Map | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [pixelCount, setPixelCount] = useState(0);

    const [selectedColor, setSelectedColor] = useState("");
    const [timeLeft, setTimeLeft] = useState(0);

    const [showMessage, setShowMessage] = useState(true);
    const [messageIcon, setMessageIcon] = useState<IconDefinition>();
    const [messageText, setMessageText] = useState("");
    const [messageTimer, setMessageTimer] = useState(-1);

    const reconnectDelayRef = useRef(1000); // start with 1s, increase with each try up to 30s

    const pixelCacheRef = useRef<Pixel[]>([]);
    const pixelMapRef = useRef<Map<string, Pixel>>(new Map());

    const loadedChunksRef = useRef<Set<string>>(new Set());
    const pendingChunksRef = useRef<Set<string>>(new Set());
    const loadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (timeLeft <= 0) return;

        const interval = setInterval(() => {
            // reduce time until timer hits 0, then unlock
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [timeLeft]);

    const addPixelToCache = (pixel: Pixel) => {
        const key = `${pixel.x}:${pixel.y}`;

        if (pixelMapRef.current.has(key)) {
            pixelMapRef.current.set(key, pixel);
            return;
        }

        pixelMapRef.current.set(key, pixel);
        pixelCacheRef.current.push(pixel);
        setPixelCount(pixelCacheRef.current.length);

        const chunkKey = `${Math.floor(pixel.x / CHUNK_SIZE)}:${Math.floor(pixel.y / CHUNK_SIZE)}`;
        loadedChunksRef.current.add(chunkKey);
    };

    const addPixelsToCache = (pixels: Pixel[]) => {
        pixels.forEach(addPixelToCache);
    };

    const getVisibleChunks = (currentMap: mapboxgl.Map) => {
        const bounds = currentMap.getBounds();
        if (!bounds) return [];

        const sw = mapboxgl.MercatorCoordinate.fromLngLat(bounds.getSouthWest());
        const ne = mapboxgl.MercatorCoordinate.fromLngLat(bounds.getNorthEast());

        const minPixelX = Math.floor(sw.x / GRID_TILE_SIZE);
        const maxPixelX = Math.floor(ne.x / GRID_TILE_SIZE);
        const minPixelY = Math.floor(ne.y / GRID_TILE_SIZE);
        const maxPixelY = Math.floor(sw.y / GRID_TILE_SIZE);

        const minChunkX = Math.floor(minPixelX / CHUNK_SIZE) - CHUNK_PRELOAD_AMOUNT;
        const maxChunkX = Math.floor(maxPixelX / CHUNK_SIZE) + CHUNK_PRELOAD_AMOUNT;
        const minChunkY = Math.floor(minPixelY / CHUNK_SIZE) - CHUNK_PRELOAD_AMOUNT;
        const maxChunkY = Math.floor(maxPixelY / CHUNK_SIZE) + CHUNK_PRELOAD_AMOUNT;

        const chunks: Array<{ x: number; y: number }> = [];

        for (let chunkX = minChunkX; chunkX <= maxChunkX; chunkX += 1) {
            for (let chunkY = minChunkY; chunkY <= maxChunkY; chunkY += 1) {
                chunks.push({ x: chunkX, y: chunkY });
            }
        }

        return chunks;
    };

    const fetchVisibleChunks = async (currentMap: mapboxgl.Map) => {
        if (!isConnected) {
            console.warn("Currently no connection with websocket, not fetching chunks");
            return;
        }

        const chunks = getVisibleChunks(currentMap);
        const missingChunks = chunks.filter(({ x, y }) => {
            const key = `${x}:${y}`;
            return !loadedChunksRef.current.has(key) && !pendingChunksRef.current.has(key);
        });

        if (!missingChunks.length) return;

        await Promise.all(missingChunks.map(async ({ x, y }) => {
            const key = `${x}:${y}`;
            pendingChunksRef.current.add(key);

            try {
                const pixels = await fetchPixelArea(
                    x * CHUNK_SIZE,
                    y * CHUNK_SIZE,
                    (x + 1) * CHUNK_SIZE - 1,
                    (y + 1) * CHUNK_SIZE - 1,
                    true
                );

                addPixelsToCache(pixels);
                loadedChunksRef.current.add(key);
                //console.log(`Chunk ${key} fetched with pixels: ${pixels}`);
                console.log(`Chunk ${key} fetched with containing ${pixels.length} pixels`);
            } catch (err) {
                console.warn(`Could not fetch pixel chunk ${key}`, err);
            } finally {
                pendingChunksRef.current.delete(key);
            }
        }));
    };

    const getOrCreateUserId = () => {
        // get userId from local storage (should be generated on websocket connect)
        let userId = localStorage.getItem("userId");

        if (!userId) {
            console.warn("UserId not found in local storage, regenerating");
            userId = crypto.randomUUID();
            localStorage.setItem("userId", userId);
        }

        return userId;
    };

    const showPixelInfo = async (x: number, y: number, lang: number, lat: number) => {
        try {
            const pixel = await fetchPixel(x, y, true);
            if (map) {
                new mapboxgl.Popup({ closeOnClick: true, className: styles["popup-pixel-info"] })
                    .setLngLat([lang, lat])
                    .setHTML(`<p>Coordinates: [${pixel.x}|${pixel.y}]</p><p>Color: ${pixel.color}</p><p>Placed at: ${new Date(pixel.placedAt).toLocaleString()}</p>`)
                    .addTo(map);
            }
        } catch (err: any) {
            console.warn(`Could not fetch pixel info for pixel [${x}|${y}]`, err);
            return;
        }
    }

    const handlePixelClick = async (x: number, y: number, lang: number, lat: number) => {
        if (!isConnected) {
            console.warn("Currently no connection with websocket, not placing pixel");
            return;
        }
        if (timeLeft > 0) {
            console.warn("Grid is currently locked, not placing pixel");
            showPixelInfo(x, y, lang, lat);
            return;
        }
        if (!selectedColor) {
            console.warn("No color selected, not placing pixel");
            showPixelInfo(x, y, lang, lat);
            return;
        }

        try {
            const pixel = await placePixel(x, y, selectedColor, getOrCreateUserId());
            console.log("Pixel placed:", pixel);
            setTimeLeft(COUNTDOWN_TIME);
        } catch (err: any) {
            if (err?.payload?.retryAfter) {
                setTimeLeft(err.payload.retryAfter);
            }
        }
    };

    const fetchPlayerCooldown = async () => {
        try {
            const userId = getOrCreateUserId();
            const cooldown = await fetchCooldown(userId);
            console.log(`Cooldown fetched for player [${userId}]:`, cooldown);

            if (cooldown.isOnCooldown) {
                setTimeLeft(cooldown.remainingSeconds);
            }
        } catch (err: any) {
            // nothing to do
            return;
        }

        reconnectDelayRef.current = 1000; // reset delay on success
        setShowMessage(false);
    };

    const setInfoBoxContent = (icon: IconDefinition, text: string, timer = -1) => {
        setMessageIcon(icon);
        setMessageText(text);
        setMessageTimer(timer);
        setShowMessage(true);
    };

    useEffect(() => {
        if (!map) return;

        const scheduleViewportLoad = () => {
            if (loadTimeoutRef.current) {
                clearTimeout(loadTimeoutRef.current);
            }

            loadTimeoutRef.current = setTimeout(() => {
                void fetchVisibleChunks(map);
            }, CHUNK_LOAD_DEBOUNCE);
        };

        scheduleViewportLoad();

        map.on("moveend", scheduleViewportLoad);
        map.on("zoomend", scheduleViewportLoad);

        return () => {
            if (loadTimeoutRef.current) {
                clearTimeout(loadTimeoutRef.current);
            }

            map.off("moveend", scheduleViewportLoad);
            map.off("zoomend", scheduleViewportLoad);
        };
    }, [map, isConnected]);

    useEffect(() => {
        if (messageTimer <= 0) return;

        const interval = setInterval(() => {
            // reduce time until timer hits 0, then unlock
            setMessageTimer((prev) => {
                if (prev <= 1) {
                    setInfoBoxContent(faSpinner, "Establishing connection...");
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [messageTimer]);

    useEffect(() => {
        setInfoBoxContent(faSpinner, "Establishing connection...");

        let socket: WebSocket;
        let reconnectTimeout: NodeJS.Timeout;

        const connect = () => {
            socket = new WebSocket(API_URL + "/ws");

            socket.onopen = () => {
                console.log("WebSocket connected!");
                if (ENABLE_LOGGING) notifySuccess("Established connection!");
                setIsConnected(true);

                // check if player is currently on cooldown
                fetchPlayerCooldown();
            }

            socket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                console.log("WS event:", data);

                switch (data.type) {
                    case "connected": {
                        // do nothing, gets handled in socket.onopen
                        break;
                    }
                    case "pixel:placed": {
                        addPixelToCache(data.payload);
                        break;
                    }
                    default: {
                        console.warn("Unknown ws message type recieved: ", data.type);
                    }
                }
            }

            /*socket.onerror = (err) => {
                console.error("WebSocket error:", err);
                if (ENABLE_LOGGING) notifyError("WebSocket error!");
            }*/

            socket.onclose = (event) => {
                console.warn("WebSocket disconnected:", {
                    code: event.code,
                    reason: event.reason,
                    wasClean: event.wasClean
                });

                if (ENABLE_LOGGING) notifyError("Failed to connect!");
                setIsConnected(false);

                reconnectDelayRef.current = Math.min(reconnectDelayRef.current * 2, 30000); // double time after each try, max 30s
                setInfoBoxContent(faTriangleExclamation, "Could not connect to server, retrying in:", reconnectDelayRef.current / 1000);

                reconnectTimeout = setTimeout(() => {
                    connect();
                }, reconnectDelayRef.current);
            }
        }

        connect();

        return () => {
            if (reconnectTimeout) clearTimeout(reconnectTimeout);
            if (socket) socket.close();
        }
    }, []);

    /*useEffect(() => {
        console.log("PIXEL COUNT UPDATE PARENT")
    }, [pixelCount]);*/

    return (
        <div>
            <img
                src="/resources/hdm-place-logo.png"
                alt="Logo"
                style={{
                    position: "absolute",
                    top: 25,
                    left: 25,
                    zIndex: 100,
                    width: "175px",
                    height: "auto"
                }}
            />
            <Toaster toastOptions={{
                position: "bottom-left", style: {
                    background: "rgba(20, 20, 20, 0.9)",
                    boxShadow: "0 0 20px 0 rgba(0, 0, 0, 0.6)",
                    color: "#fff",
                    backdropFilter: "blur(6px)",
                    borderRadius: "12px",
                }
            }} />
            {showMessage ? <MessageBox icon={messageIcon} text={messageText} time={messageTimer} /> : <ColorPicker timeLeft={timeLeft} selectedColor={selectedColor} setSelectedColor={setSelectedColor} />}
            <MapboxMap onMapReady={setMap} />
            {map && <GridOverlay map={map} pixelCache={pixelCacheRef} pixelCount={pixelCount} onPixelClick={handlePixelClick} />}
        </div>
    );
}