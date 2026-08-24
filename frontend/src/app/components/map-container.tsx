'use client';

import { API_URL, COUNTDOWN_TIME } from "../config"

import { useState, useEffect, useRef, useCallback } from "react"
import { faTriangleExclamation, faSpinner, IconDefinition, faSun, faMoon, faTrophy } from "@fortawesome/free-solid-svg-icons";
import { Toaster } from "react-hot-toast";

import { notifyError, notifySuccess } from "../utils/toast"
import { placePixel, fetchPixelArea, fetchCooldown } from "../utils/api";

import styles from "../styles/map-container.module.css"

import mapboxgl from 'mapbox-gl';

import ColorPicker from "./color-picker";
import GridOverlay from "./grid-overlay";
import MapboxMap from "./mapbox-map";
import MessageBox from "./message-box";

import Logger from "../utils/logger";
import Button from "./button";
import Leaderboard from "./leaderboard";
import InputBox from "./input-box";

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

// main component holding all other components
// also contains the logic for chunk loading, handling cooldown, doing backend requests, and more
export default function MapContainer() {
    const [map, setMap] = useState<mapboxgl.Map | null>(null);

    const [isConnected, setIsConnected] = useState(false);
    const [pixelCount, setPixelCount] = useState(0);

    const [userName, setUserName] = useState<string | null>(null);
    const [selectedColor, setSelectedColor] = useState("");
    const [timeLeft, setTimeLeft] = useState(0);

    const [showMessage, setShowMessage] = useState(true);
    const [messageIcon, setMessageIcon] = useState<IconDefinition>();
    const [messageText, setMessageText] = useState("");
    const [messageTimer, setMessageTimer] = useState(-1);

    const [isDarkmodeEnabled, setIsDarkmodeEnabled] = useState(false);
    const [isLeaderboardVisible, setIsLeaderboardVisible] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    const reconnectDelayRef = useRef(1000); // start with 1s, increase with each try up to 30s

    const pixelCacheRef = useRef<Pixel[]>([]);
    const pixelMapRef = useRef<Map<string, Pixel>>(new Map());

    const loadedChunksRef = useRef<Set<string>>(new Set());
    const pendingChunksRef = useRef<Set<string>>(new Set());
    const loadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        const mediaQuery = window.matchMedia("(max-width: 520px)");
        setIsMobile(mediaQuery.matches);

        const handleChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
        mediaQuery.addEventListener("change", handleChange);

        return () => mediaQuery.removeEventListener("change", handleChange);
    }, []);

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

    // adds a single pixel to the cache map
    const addPixelToCache = (pixel: Pixel) => {
        const key = `${pixel.x}:${pixel.y}`;

        if (pixelMapRef.current.has(key)) {
            pixelMapRef.current.set(key, pixel);

            // replace the outdated pixel in cache with the new one
            const index = pixelCacheRef.current.findIndex((p) => p.x === pixel.x && p.y === pixel.y);
            if (index !== -1) pixelCacheRef.current[index] = pixel;

            // then trigger grid redraw
            setPixelCount((prev) => prev + 1);
            return;
        }

        pixelMapRef.current.set(key, pixel);
        pixelCacheRef.current.push(pixel);
        setPixelCount(pixelCacheRef.current.length);

        const chunkKey = `${Math.floor(pixel.x / CHUNK_SIZE)}:${Math.floor(pixel.y / CHUNK_SIZE)}`;
        loadedChunksRef.current.add(chunkKey);
    };

    // adds multiple pixels to the cache map
    const addPixelsToCache = (pixels: Pixel[]) => {
        pixels.forEach(addPixelToCache);
    };

    // returns all chunks that are currently visible
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

    // fetches pixels for the chunks that are currently visible
    const fetchVisibleChunks = async (currentMap: mapboxgl.Map) => {
        if (!isConnected) {
            Logger.warn("Currently no connection with websocket, not fetching chunks");
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
                //Logger.log(`Chunk ${key} fetched with pixels: ${pixels}`);
                Logger.log(`Chunk ${key} fetched with containing ${pixels.length} pixels`);
            } catch (err) {
                Logger.warn(`Could not fetch pixel chunk ${key}`, err);
            } finally {
                pendingChunksRef.current.delete(key);
            }
        }));
    };

    // returns existing userId or creates a new one
    /*const getOrCreateUserId = () => {
        // get userId from local storage (should be generated on websocket connect)
        let userId = localStorage.getItem("userId");

        if (!userId) {
            Logger.warn("UserId not found in local storage, regenerating");
            userId = crypto.randomUUID();
            localStorage.setItem("userId", userId);
        }

        return userId;
    };*/

    // called once username is entered in input-box
    const handleUserNameEntered = (newUserName: string) => {
        Logger.log("New username was entered:", newUserName);
        localStorage.setItem("userName", newUserName);

        // TODO backend validation if username is valid and does not already exist
        setUserName(newUserName);
    };

    // creates a mapbox popup with pixel info for a pixel at the given coordinates
    const showPixelInfo = (async (x: number, y: number, lang: number, lat: number) => {
        // check cache if there is a pixel at the given coordinates
        const pixel = pixelMapRef.current.get(`${x}:${y}`);
        if (!pixel) return;

        // create mapbox popup to show the pixel info
        if (map) {
            new mapboxgl.Popup({ closeOnClick: true, className: styles["popup-pixel-info"] })
                .setLngLat([lang, lat])
                .setHTML(`<p>Coordinates: [${pixel.x}|${pixel.y}]</p><p>Color: ${pixel.color}</p><p>Placed at: ${new Date(pixel.placedAt).toLocaleString()}</p>`)
                .addTo(map);
        }
    });

    // executed on map click
    const handlePixelClick = useCallback(async (x: number, y: number, lang: number, lat: number) => {
        if (!isConnected) {
            Logger.warn("Currently no connection with websocket, not placing pixel");
            return;
        }
        if (timeLeft > 0) {
            Logger.warn("Grid is currently locked, not placing pixel");
            showPixelInfo(x, y, lang, lat);
            return;
        }
        if (!selectedColor) {
            Logger.warn("No color selected, not placing pixel");
            showPixelInfo(x, y, lang, lat);
            return;
        }
        if (!userName) {
            Logger.warn("No username entered yet, not placing pixel");
            showPixelInfo(x, y, lang, lat);
            return;
        }

        try {
            const pixel = await placePixel(x, y, selectedColor, userName);
            Logger.log("Pixel placed:", pixel);
            setTimeLeft(COUNTDOWN_TIME);
        } catch (err: any) {
            if (err?.payload?.retryAfter) {
                setTimeLeft(err.payload.retryAfter);
            }
        }
    }, [isConnected, timeLeft, selectedColor, map]);

    // fetches current cooldown for a user with the given userId
    const fetchPlayerCooldown = async (userId: string) => {
        try {
            const cooldown = await fetchCooldown(userId);
            Logger.log(`Cooldown fetched for player [${userId}]:`, cooldown);

            if (cooldown.isOnCooldown) {
                setTimeLeft(cooldown.remainingSeconds);
            }
        } catch (err: any) {
            // nothing to do
            return;
        }

        reconnectDelayRef.current = 1000; // reset delay on success
    };

    // updates content of the info box and shows it
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
                Logger.log("WebSocket connected!");
                notifySuccess("Established connection!");
                setIsConnected(true);

                // check if browser has a cached username and if so fetch cooldown
                let userName = localStorage.getItem("userName");
                if (userName) {
                    Logger.log("Using existing username in local storage:", userName);
                    setUserName(userName);
                    fetchPlayerCooldown(userName);
                }

                // hide establishing connection message
                setShowMessage(false);
            }

            socket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                Logger.log("WS event:", data);

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
                        Logger.warn("Unknown ws message type recieved: ", data.type);
                    }
                }
            }

            /*socket.onerror = (err) => {
                Logger.error("WebSocket error:", err);
                notifyError("WebSocket error!");
            }*/

            socket.onclose = (event) => {
                Logger.warn("WebSocket disconnected:", {
                    code: event.code,
                    reason: event.reason,
                    wasClean: event.wasClean
                });

                notifyError("Failed to connect!");
                setIsConnected(false);

                reconnectDelayRef.current = Math.min(reconnectDelayRef.current * 2, 30000); // double time after each try, max 30s
                setInfoBoxContent(faTriangleExclamation, "Could not reach backend, retrying in:", reconnectDelayRef.current / 1000);

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
        Logger.log("PIXEL COUNT UPDATE PARENT")
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
            <Button
                onClick={() => {
                    if (!map) return;
                    isDarkmodeEnabled ? map.setStyle("mapbox://styles/mapbox/streets-v11") : map.setStyle("mapbox://styles/mapbox/dark-v11");
                    setIsDarkmodeEnabled(!isDarkmodeEnabled);
                }}
                icon={isDarkmodeEnabled ? faSun : faMoon}
                style={{
                    width: 40,
                    height: 40,
                    position: "absolute",
                    top: 25,
                    right: 25,
                    zIndex: 100,
                }}
            />
            <Button
                onClick={() => {
                    setIsLeaderboardVisible(!isLeaderboardVisible);
                }}
                icon={faTrophy}
                style={{
                    width: 40,
                    height: 40,
                    position: "absolute",
                    top: 25,
                    right: 75,
                    zIndex: 100,
                }}
            />
            <Toaster
                position={isMobile ? "top-center" : "bottom-left"}
                toastOptions={{
                    style: {
                        background: "rgba(20, 20, 20, 0.9)",
                        boxShadow: "0 0 20px 0 rgba(0, 0, 0, 0.6)",
                        color: "#fff",
                        fontSize: "13px",
                        backdropFilter: "blur(6px)",
                        borderRadius: "12px",
                        cursor: "default",
                    }
                }} />
            {isLeaderboardVisible && <Leaderboard />}
            {/* showing messages has highest prio */
                showMessage && <MessageBox icon={messageIcon} text={messageText} time={messageTimer} />}
            {/* show input box if no username is entered yet */
                !showMessage && !userName && <InputBox onConfirm={handleUserNameEntered} />}
            {/* if username is entered, only then show color picker */
                !showMessage && userName && <ColorPicker timeLeft={timeLeft} selectedColor={selectedColor} setSelectedColor={setSelectedColor} />}
            <MapboxMap onMapReady={setMap} />
            {map && <GridOverlay map={map} pixelCache={pixelCacheRef} pixelCount={pixelCount} onPixelClick={handlePixelClick} />}
        </div>
    );
}