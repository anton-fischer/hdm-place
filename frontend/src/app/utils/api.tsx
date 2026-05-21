/* 
 * used to communicate with backend
*/

import { notifyPromise } from "./toast"

const API_URL = "http://localhost:3001";

export async function placePixel(x: number, y: number, color: string, userId: string, quiet: boolean = false) {
    const promise = fetch(`${API_URL}/api/pixel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ x, y, color, userId })
    }).then(async res => {
        const payload = await res.json();
        if (!res.ok) throw Object.assign(new Error(payload.error || payload.message || "Server error"), { payload });
        return payload;
    });

    console.log(`Sending placePixel POST request: x=${x}, y=${y}, color=${color}, userId=${userId}`);
    if (!quiet) notifyPromise(promise, "Pixel placed!");

    try {
        return await promise;
    } catch (err: any) {
        if (!quiet) console.error("Error placing pixel:", err.message);
        throw err;
    }
}

export async function fetchPixel(x: number, y: number, quiet: boolean = false) {
    const promise = fetch(`${API_URL}/api/pixel/${x}/${y}`).then(async res => {
        const payload = await res.json();
        if (!res.ok) throw Object.assign(new Error(payload.error || payload.message || "Server error"), { payload });
        return payload;
    });

    console.log(`Sending fetchPixel GET request: (${x}, ${y})`);
    if (!quiet) notifyPromise(promise, "Pixel fetched!");

    try {
        return await promise;
    } catch (err) {
        if (!quiet) console.error("Error fetching pixel:", err);
        throw err;
    }
}

export async function fetchPixelArea(x1: number, y1: number, x2: number, y2: number, quiet: boolean = false) {
    const promise = fetch(`${API_URL}/api/pixels/${x1}/${y1}/${x2}/${y2}`).then(async res => {
        const payload = await res.json();
        if (!res.ok) throw Object.assign(new Error(payload.error || payload.message || "Server error"), { payload });
        return payload;
    });

    console.log(`Sending fetchPixelArea GET request: (${x1},${y1}) to (${x2},${y2})`);
    if (!quiet) notifyPromise(promise, "Pixels fetched!");

    try {
        return await promise;
    } catch (err) {
        if (!quiet) console.error("Error fetching pixel area:", err);
        throw err;
    }
}

export async function fetchCooldown(id: string, quiet: boolean = false) {
    const promise = fetch(`${API_URL}/api/users/${id}/cooldown`).then(async res => {
        const payload = await res.json();
        if (!res.ok) throw Object.assign(new Error(payload.error || payload.message || "Server error"), { payload });
        return payload;
    });

    console.log(`Sending fetchCooldown GET request: (${id})`);
    if (!quiet) notifyPromise(promise, "User info fetched!");

    try {
        return await promise;
    } catch (err) {
        if (!quiet) console.error("Error fetching cooldown:", err);
        throw err;
    }
}