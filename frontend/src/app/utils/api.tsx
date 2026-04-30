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