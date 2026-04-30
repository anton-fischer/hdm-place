'use client';

import { useState, useEffect, useRef } from "react"
import { faTriangleExclamation, IconDefinition } from "@fortawesome/free-solid-svg-icons";

import ColorPicker from "./color-picker";
import GridOverlay from "./grid-overlay";
import MapboxMap from "./mapbox-map";
import MessageBox from "./message-box";

const COUNTDOWN_TIME = 5;

export default function MapContainer() {
    const [map, setMap] = useState<mapboxgl.Map | null>(null);
    const [isLocked, setIsLocked] = useState(false);
    const [timeLeft, setTimeLeft] = useState(COUNTDOWN_TIME);

    const [showMessage, setShowMessage] = useState(false);
    const [messageIcon, setMessageIcon] = useState<IconDefinition | null>(null);
    const [messageText, setMessageText] = useState("");
    const [retryTimeLeft, setRetryTimeLeft] = useState(-1);

    const reconnectDelayRef = useRef(1000); // start with 1s, increase with each try

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

    const handlePlacePixel = () => {
        if (isLocked) return;

        placePixel();
        setIsLocked(true);
        setTimeLeft(5);
    };

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

    async function placePixel() {
        const res = await fetch("http://localhost:3001/api/pixels", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                x: 1,
                y: 1,
                color: "#FF0000",
                userId: "abc"
            })
        });

        if (!res.ok) {
            const err = await res.json();
            console.error("Error placing pixel:", err);
            return;
        }

        const pixel = await res.json();
        console.log("Pixel placed:", pixel);
    }

    useEffect(() => {
        let socket: WebSocket;
        let reconnectTimeout: NodeJS.Timeout;

        const connect = () => {
            socket = new WebSocket("ws://localhost:3001/ws");

            socket.onopen = () => {
                console.log("WebSocket connected!");
                setShowMessage(false);
                reconnectDelayRef.current = 1000; // reset delay on success
            }

            socket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                console.log("WS event:", data);
            }

            /*socket.onerror = (err) => {
                console.error("WebSocket error:", err);
            }*/

            socket.onclose = (event) => {
                console.warn("WebSocket disconnected:", {
                    code: event.code,
                    reason: event.reason,
                    wasClean: event.wasClean
                });

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

        connect()

        return () => {
            if (reconnectTimeout) clearTimeout(reconnectTimeout);
            if (socket) socket.close();
        }
    }, [])

    return (
        <div>
            {showMessage ? <MessageBox icon={messageIcon} text={messageText} time={retryTimeLeft} /> : <ColorPicker isLocked={isLocked} timeLeft={timeLeft} />}
            <MapboxMap onMapReady={setMap} />
            {map && <GridOverlay map={map} onPlacePixel={handlePlacePixel} />}
        </div>
    );
}