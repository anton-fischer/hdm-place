'use client';

import { useState, useEffect, useRef } from "react"
import { faTriangleExclamation, faCircleExclamation, faSpinner, IconDefinition } from "@fortawesome/free-solid-svg-icons";
import { Toaster } from "react-hot-toast";

import { notifyError, notifySuccess } from "../utils/toast"
import { placePixel, fetchPixelArea, fetchCooldown, fetchPixel } from "../utils/api";

import styles from "../styles/map-container.module.css"

import mapboxgl from 'mapbox-gl';

import ColorPicker from "./color-picker";
import GridOverlay from "./grid-overlay";
import MapboxMap from "./mapbox-map";
import MessageBox from "./message-box";

const COUNTDOWN_TIME = 30;
const ENABLE_LOGGING = true;

type Pixel = {
    x: number;
    y: number;
    color: string;
    placedBy: string,
    placedAt: number
};

export default function MapContainer() {
    const [map, setMap] = useState<mapboxgl.Map | null>(null);
    const [pixelCount, setPixelCount] = useState(0);
    const [selectedColor, setSelectedColor] = useState("");

    const [isLocked, setIsLocked] = useState(false);
    const [timeLeft, setTimeLeft] = useState(COUNTDOWN_TIME);

    const [showMessage, setShowMessage] = useState(true);
    const [messageIcon, setMessageIcon] = useState<IconDefinition | null>(null);
    const [messageText, setMessageText] = useState("");
    const [retryTimeLeft, setRetryTimeLeft] = useState(-1);

    const reconnectDelayRef = useRef(1000); // start with 1s, increase with each try
    const selectedColorRef = useRef(selectedColor);
    const pixelCacheRef = useRef<Pixel[]>([]);

    useEffect(() => {
        if (!isLocked) return;

        const interval = setInterval(() => {
            // reduce time until timer hits 0, then unlock
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    setIsLocked(false);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [isLocked]);

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
            // nothing to do
            return;
        }
    }

    const handlePixelClick = async (x: number, y: number, lang: number, lat: number) => {
        if (isLocked) {
            console.warn("Grid is currently locked, not placing pixel");
            showPixelInfo(x, y, lang, lat);
            return;
        }
        if (!selectedColor) {
            console.warn("No color selected, not placing pixel");
            showPixelInfo(x, y, lang, lat);
            return;
        }

        // get userId from local storage (should be generated on websocket connect)
        let userId = localStorage.getItem("userId");

        if (!userId) {
            console.warn("UserId not found in local storage, regenerating");
            userId = crypto.randomUUID();
            localStorage.setItem("userId", userId);
        }

        try {
            const pixel = await placePixel(x, y, selectedColor, userId);
            console.log("Pixel placed:", pixel);
            setIsLocked(true);
            setTimeLeft(COUNTDOWN_TIME);
        } catch (err: any) {
            if (err.payload.retryAfter) {
                setIsLocked(true);
                setTimeLeft(err.payload.retryAfter);
            }
        }
    };

    const loadData = async () => {
        // load pixels
        try {
            const pixels = await fetchPixelArea(525170, 344481, 525387, 344566);
            console.log("Pixels fetched:", pixels);

            pixelCacheRef.current.push(...pixels);
            setPixelCount(pixelCacheRef.current.length); // this will trigger an update in GridOverlay and place pixel

            reconnectDelayRef.current = 1000; // reset delay on success
        } catch (err: any) {
            setMessageIcon(faCircleExclamation);
            setMessageText("Error while initializing grid");
            return;
        }

        // load user info
        // get userId from local storage or generate one
        let userId = localStorage.getItem("userId");

        if (!userId) {
            console.warn("UserId not found in local storage, regenerating");
            userId = crypto.randomUUID();
            localStorage.setItem("userId", userId);
        } else {
            try {
                const cooldown = await fetchCooldown(userId);
                console.log("Cooldown fetched:", cooldown);

                if (cooldown.isOnCooldown) {
                    setIsLocked(true);
                    setTimeLeft(cooldown.remainingSeconds);
                }
            } catch (err: any) {
                // nothing to do
                return;
            }
        }

        setShowMessage(false);
    };

    useEffect(() => {
        // workaround needed to always have the updated values here
        selectedColorRef.current = selectedColor;
    }, [selectedColor]);

    useEffect(() => {
        if (retryTimeLeft <= 0) return;

        const interval = setInterval(() => {
            // reduce time until timer hits 0, then unlock
            setRetryTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [retryTimeLeft]);

    const getWebSocketUrl = () => {
        if (typeof window !== 'undefined') {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            return `${protocol}//${window.location.host}/ws`;
        }
        return 'ws://localhost:3000/ws';
    };

    const wsUrl = getWebSocketUrl();

    useEffect(() => {
        setMessageText("Establishing connection...");
        setMessageIcon(faSpinner);

        let socket: WebSocket;
        let reconnectTimeout: NodeJS.Timeout;

        const connect = () => {
            socket = new WebSocket(wsUrl);

            socket.onopen = () => {
                console.log("WebSocket connected!");
                if (ENABLE_LOGGING) notifySuccess("Established connection!");

                // fetch pixels from database
                loadData();
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
                        pixelCacheRef.current.push(data.payload);
                        setPixelCount(pixelCount + 1); // this will trigger an update in GridOverlay and place pixel
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

                setMessageIcon(faTriangleExclamation);
                reconnectDelayRef.current = Math.min(reconnectDelayRef.current * 2, 30000); // max 30s
                setRetryTimeLeft(reconnectDelayRef.current / 1000);
                setMessageText(`Could not connect to server, retrying in:`);
                setShowMessage(true);

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
    }, [])

    return (
        <div>
            <Toaster toastOptions={{
                position: "bottom-left", style: {
                    background: "rgba(20, 20, 20, 0.9)",
                    boxShadow: "0 0 20px 0 rgba(0, 0, 0, 0.6)",
                    color: "#fff",
                    backdropFilter: "blur(6px)",
                    borderRadius: "12px",
                }
            }} />
            {showMessage ? <MessageBox icon={messageIcon} text={messageText} time={retryTimeLeft} /> : <ColorPicker isLocked={isLocked} timeLeft={timeLeft} selectedColor={selectedColor} setSelectedColor={setSelectedColor} />}
            <MapboxMap onMapReady={setMap} />
            {map && <GridOverlay map={map} pixelCache={pixelCacheRef} pixelCount={pixelCount} onPixelClick={handlePixelClick} />}
        </div>
    );
}