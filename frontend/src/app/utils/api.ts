/* 
 * used to communicate with backend
*/

import { API_URL } from "../config"
import { notifyPromise } from "./toast"

import Logger from "./logger";

// parses a fetch response as JSON, falling back to a readable error for non-JSON (e.g. HTML) responses
async function parseResponse(res: Response) {
    const text = await res.text();
    let payload: any;
    try {
        payload = text ? JSON.parse(text) : {};
    } catch {
        throw Object.assign(new Error(`Server error (${res.status})`), { payload: undefined });
    }

    if (!res.ok) throw Object.assign(new Error(payload.error || payload.message || `Server error (${res.status})`), { payload });
    return payload;
}

// sends POST request to backend to place a single pixel
export async function placePixel(x: number, y: number, color: string, userId: string, quiet: boolean = false) {
    const promise = fetch(`${API_URL}/api/pixel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ x, y, color, userId })
    }).then(parseResponse);

    Logger.log(`Sending placePixel POST request: x=${x}, y=${y}, color=${color}, userId=${userId}`);
    if (!quiet) notifyPromise(promise, "Pixel placed!");

    try {
        return await promise;
    } catch (err: any) {
        if (!quiet) Logger.error("Error placing pixel:", err.message);
        throw err;
    }
}

// sends GET request to backend to fetch a single pixel
export async function fetchPixel(x: number, y: number, quiet: boolean = false) {
    const promise = fetch(`${API_URL}/api/pixel/${x}/${y}`).then(parseResponse);

    Logger.log(`Sending fetchPixel GET request: (${x}, ${y})`);
    if (!quiet) notifyPromise(promise, "Pixel fetched!");

    try {
        return await promise;
    } catch (err) {
        if (!quiet) Logger.error("Error fetching pixel:", err);
        throw err;
    }
}

// sends GET request to backend to fetch multiple pixels
export async function fetchPixelArea(x1: number, y1: number, x2: number, y2: number, quiet: boolean = false) {
    const promise = fetch(`${API_URL}/api/pixels/${x1}/${y1}/${x2}/${y2}`).then(parseResponse);

    Logger.log(`Sending fetchPixelArea GET request: (${x1},${y1}) to (${x2},${y2})`);
    if (!quiet) notifyPromise(promise, "Pixels fetched!");

    try {
        return await promise;
    } catch (err) {
        if (!quiet) Logger.error("Error fetching pixel area:", err);
        throw err;
    }
}

// sends GET request to backend to fetch the current cooldown of the user
export async function fetchCooldown(id: string, quiet: boolean = false) {
    const promise = fetch(`${API_URL}/api/users/${id}/cooldown`).then(parseResponse);

    Logger.log(`Sending fetchCooldown GET request: (${id})`);
    if (!quiet) notifyPromise(promise, "User info fetched!");

    try {
        return await promise;
    } catch (err) {
        if (!quiet) Logger.error("Error fetching cooldown:", err);
        throw err;
    }
}

// sends GET request to backend to fetch the current leaderboard
export async function fetchLeaderboard(quiet: boolean = false) {
    const promise = fetch(`${API_URL}/api/leaderboard`).then(parseResponse);

    Logger.log(`Sending fetchLeaderboard GET request`);
    if (!quiet) notifyPromise(promise, "Leaderboard fetched!");

    try {
        return await promise;
    } catch (err) {
        if (!quiet) Logger.error("Error fetching leaderboard:", err);
        throw err;
    }
}