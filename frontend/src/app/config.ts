// api token and backend url
if (!process.env.NEXT_PUBLIC_BACKEND_API_URL) {
    throw new Error("NEXT_PUBLIC_BACKEND_API_URL is missing");
}
export const API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL;

if (!process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN) {
    throw new Error("NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN is missing");
}
export const MAPBOX_ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;


// logging
if (!process.env.NEXT_PUBLIC_ENABLE_NOTIFICATIONS) {
    throw new Error("NEXT_PUBLIC_ENABLE_NOTIFICATIONS is missing");
}
if (!isBoolean(process.env.NEXT_PUBLIC_ENABLE_NOTIFICATIONS)) {
    throw new Error("NEXT_PUBLIC_ENABLE_NOTIFICATIONS must be of type boolean");
}
export const ENABLE_NOTIFICATIONS = parseBoolean(process.env.NEXT_PUBLIC_ENABLE_NOTIFICATIONS);

if (!process.env.NEXT_PUBLIC_ENABLE_LOGGING) {
    throw new Error("NEXT_PUBLIC_ENABLE_LOGGING is missing");
}
if (!isBoolean(process.env.NEXT_PUBLIC_ENABLE_LOGGING)) {
    throw new Error("NEXT_PUBLIC_ENABLE_LOGGING must be of type boolean");
}
export const ENABLE_LOGGING = parseBoolean(process.env.NEXT_PUBLIC_ENABLE_LOGGING);


// misc settings
if (!process.env.NEXT_PUBLIC_COUNTDOWN_TIME) {
    throw new Error("NEXT_PUBLIC_COUNTDOWN_TIME is missing");
}
if (!isNumber(process.env.NEXT_PUBLIC_COUNTDOWN_TIME)) {
    throw new Error("NEXT_PUBLIC_COUNTDOWN_TIME must be numeric");
}
export const COUNTDOWN_TIME = parseNumber(process.env.NEXT_PUBLIC_COUNTDOWN_TIME);


// helpers
function isBoolean(value: string): boolean {
    return ["true", "false", "1", "0"].includes(value.toLowerCase());
}
function parseBoolean(value: string): boolean {
    if (value === "true" || value === "1") return true;
    return false;
}

function isNumber(value: string): boolean {
    return !Number.isNaN(Number(value));
}
function parseNumber(value: string): number {
    return Number(value);
}