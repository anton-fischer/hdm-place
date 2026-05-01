'use client';

import { useState, useEffect, useRef } from "react"
import { faTriangleExclamation, faSpinner, IconDefinition } from "@fortawesome/free-solid-svg-icons";
import { Toaster } from "react-hot-toast";

import { placePixel } from "../utils/api"
import { notifyPromise, notifyError, notifySuccess } from "../utils/toast"

import ColorPicker from "./color-picker";
import GridOverlay from "./grid-overlay";
import MapboxMap from "./mapbox-map";
import MessageBox from "./message-box";

const COUNTDOWN_TIME = 5;
const ENABLE_LOGGING = true;

export default function MapContainer() {
    const [map, setMap] = useState<mapboxgl.Map | null>(null);
    const [selectedColor, setSelectedColor] = useState("");

    const [isLocked, setIsLocked] = useState(false);
    const [timeLeft, setTimeLeft] = useState(COUNTDOWN_TIME);

    const [showMessage, setShowMessage] = useState(true);
    const [messageIcon, setMessageIcon] = useState<IconDefinition | null>(null);
    const [messageText, setMessageText] = useState("");
    const [retryTimeLeft, setRetryTimeLeft] = useState(-1);

    const reconnectDelayRef = useRef(1000); // start with 1s, increase with each try
    const selectedColorRef = useRef(selectedColor);

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

    const handlePlacePixel = async (x: number, y: number) => {
        console.log("clicked", { isLocked, selectedColorRef: selectedColorRef.current });

        if (isLocked) return;

        const success = await placePixel(x, y, selectedColorRef.current);

        if (success) {
            setIsLocked(true);
            setTimeLeft(5);
        }
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

    useEffect(() => {
        setMessageText("Establishing connection...");
        setMessageIcon(faSpinner);

        let socket: WebSocket;
        let reconnectTimeout: NodeJS.Timeout;

        const connect = () => {
            socket = new WebSocket("ws://localhost:3001/ws");

            socket.onopen = () => {
                console.log("WebSocket connected!");
                if (ENABLE_LOGGING) notifySuccess("Established connection!");

                setShowMessage(false);
                reconnectDelayRef.current = 1000; // reset delay on success
            }

            socket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                console.log("WS event:", data);
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
            {map && <GridOverlay map={map} onPlacePixel={handlePlacePixel} />}
        </div>
    );
}