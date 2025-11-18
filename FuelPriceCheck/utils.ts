import axios, { AxiosError } from "axios";
import config from "../config";
import { FuelStation, FuelPriceApiResponse } from "./models";

const API_BASE_URL =
  "https://uk-daily-fuel-prices.p.rapidapi.com/api/petrol-prices";
const API_HOST = "uk-daily-fuel-prices.p.rapidapi.com";
const REQUEST_TIMEOUT = 10000; // 10 seconds

/**
 * Calculate the distance between two coordinates using the Haversine formula
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @returns Distance in kilometers
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Extract coordinates from a fuel station object
 * Handles various coordinate property name formats
 */
function extractCoordinates(station: any): { lat: number; lon: number } | null {
  const stationLat =
    station.location?.latitude ??
    station.location?.lat ??
    station.lat ??
    station.latitude;
  const stationLon =
    station.location?.longitude ??
    station.location?.lon ??
    station.lon ??
    station.longitude ??
    station.lng;

  if (typeof stationLat === "number" && typeof stationLon === "number") {
    return { lat: stationLat, lon: stationLon };
  }
  return null;
}

/**
 * Get brand preference priority for sorting
 * Lower number = higher priority
 * @param brand Brand name (case-insensitive)
 * @returns Priority number (1 = Tesco, 2 = Shell, 3 = Esso, 4 = Others)
 */
function getBrandPriority(brand: string | undefined): number {
  if (!brand) return 4;

  const brandUpper = brand.toUpperCase().trim();

  // Check for Tesco (including variations like "TESCO", "Tesco Extra", etc.)
  if (brandUpper.includes("TESCO")) {
    return 1;
  }

  // Check for Shell
  if (brandUpper.includes("ESSO")) {
    return 2;
  }

  // Check for Esso
  if (brandUpper.includes("SHELL")) {
    return 3;
  }

  // All other brands
  return 4;
}

/**
 * Sort fuel price data by distance from the given coordinates
 * Handles both direct arrays and objects containing arrays (e.g., { data: [...] })
 * @param data Fuel price data (array of stations or object containing array)
 * @param userLat User's latitude
 * @param userLon User's longitude
 * @returns Sorted data with distance added to each station
 */
export function sortByDistance(
  data: FuelPriceApiResponse | FuelStation[] | any,
  userLat: number,
  userLon: number
): FuelPriceApiResponse | FuelStation[] | any {
  // Handle case where data is an object with an array property
  let stations: any[] = [];
  let arrayKey: string | null = null;
  const isOriginalArray = Array.isArray(data);

  if (Array.isArray(data)) {
    stations = data;
  } else if (data && typeof data === "object") {
    // Find which property contains the array - check 'data' first as that's the API format
    if (Array.isArray(data.data)) {
      stations = data.data;
      arrayKey = "data";
    } else if (Array.isArray(data.stations)) {
      stations = data.stations;
      arrayKey = "stations";
    } else if (Array.isArray(data.results)) {
      stations = data.results;
      arrayKey = "results";
    } else if (Array.isArray(data.items)) {
      stations = data.items;
      arrayKey = "items";
    } else {
      // Try to find any array property
      const found = Object.entries(data).find(([_, val]) => Array.isArray(val));
      if (found) {
        stations = found[1] as any[];
        arrayKey = found[0];
      }
    }
  } else {
    // If data is not an array or object, return as-is
    return data;
  }

  if (!Array.isArray(stations)) {
    return data;
  }

  // If array is empty, still preserve structure but return early
  if (stations.length === 0) {
    if (!isOriginalArray && data && typeof data === "object" && arrayKey) {
      return { ...data };
    }
    return stations;
  }

  const sortedStations = stations
    .map((station: any) => {
      const coords = extractCoordinates(station);

      if (!coords) {
        // If coordinates are missing, assign a very large distance
        return { ...station, distance: Infinity };
      }

      const distance = calculateDistance(
        userLat,
        userLon,
        coords.lat,
        coords.lon
      );
      return { ...station, distance: Number(distance.toFixed(2)) };
    })
    .sort((a, b) => {
      // First sort by brand preference (Tesco > Shell > Esso > Others)
      const brandPriorityA = getBrandPriority(a.brand);
      const brandPriorityB = getBrandPriority(b.brand);

      if (brandPriorityA !== brandPriorityB) {
        return brandPriorityA - brandPriorityB;
      }

      // If same brand priority, sort by distance (nearest first)
      const distanceA = a.distance ?? Infinity;
      const distanceB = b.distance ?? Infinity;
      return distanceA - distanceB;
    });

  // If original data was an object, preserve its structure
  if (!isOriginalArray && data && typeof data === "object" && arrayKey) {
    const result = { ...data };
    result[arrayKey] = sortedStations;
    return result;
  }

  return sortedStations;
}

export async function fetchFuelPriceData(
  url: string
): Promise<FuelPriceApiResponse> {
  try {
    const apiUrl = `${API_BASE_URL}${url}`;
    const authToken = config.RAPIDAPI_KEY;

    const response = await axios.get<FuelPriceApiResponse>(apiUrl, {
      headers: {
        "x-rapidapi-key": authToken,
        "x-rapidapi-host": API_HOST,
      },
      timeout: REQUEST_TIMEOUT,
    });

    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;

    if (axiosError.response) {
      const status = axiosError.response.status;
      const data = axiosError.response.data;

      // Throw a more descriptive error with status code
      throw new Error(
        `Fuel price API error: ${status}${
          data ? ` - ${JSON.stringify(data)}` : ""
        }`
      );
    } else if (axiosError.code === "ECONNABORTED") {
      throw new Error("Fuel price API: Request timeout");
    } else if (axiosError.request) {
      throw new Error("Fuel price API: No response received from server");
    } else {
      throw new Error(`Fuel price API request error: ${axiosError.message}`);
    }
  }
}
