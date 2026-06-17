if (!process.env.NEXT_PUBLIC_BACKEND_API_URL) {
  throw new Error("NEXT_PUBLIC_BACKEND_API_URL is missing");
}

export const API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL;

if (!process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN) {
  throw new Error("NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN is missing");
}

export const MAPBOX_ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
