/* 
 * used to communicate with backend
*/

import { notifyPromise } from "./toast"

const ENABLE_LOGGING = true;

export async function placePixel(x: number, y: number, color: string) {
    try {
        const promise = fetch("http://localhost:3001/api/pixels", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ x, y, color, userId: "abc" })
        }).then(async res => {
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || err.message || "Server error");
            }
            return res.json();
        });

        if (ENABLE_LOGGING) notifyPromise(promise, "Pixel placed!");

        console.log(`Sending POST request: x=${x}, y=${y}, color=${color}`);

        const data = await promise;

        console.log("Pixel placed:", data);
        return true;

    } catch (err: any) {
        console.error("Error placing pixel:", err.message);
        return false;
    }
}

export async function getPixels(x1: number, y1: number, x2: number, y2: number) {
    try {
        const promise = fetch("http://localhost:3001/api/tiles", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ x1, y1, x2, y2 })
        }).then(async res => {
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || err.message || "Server error");
            }
            return res.json();
        });

        if (ENABLE_LOGGING) notifyPromise(promise, "Pixel placed!");

        console.log(`Sending POST request: x1=${x1}, y1=${y1}, x2=${x2}, y2=${y2}`);

        const data = await promise;

        console.log("Pixels fetched:", data);
        return data;

    } catch (err: any) {
        console.error("Error fetching pixels:", err.message);
        return undefined;
    }
}