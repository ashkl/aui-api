import axios, { AxiosError } from "axios";
import config from "../config";
import {
  FuelStation,
  FuelPriceApiResponse,
  FuelPriceTrend,
  FuelPrices,
} from "./models";

const API_BASE_URL =
  "https://uk-daily-fuel-prices.p.rapidapi.com/api/petrol-prices";
const API_HOST = "uk-daily-fuel-prices.p.rapidapi.com";
const REQUEST_TIMEOUT = 10000; // 10 seconds

const MAX_PRICE_HISTORY = 20;

interface PriceHistoryEntry {
  timestamp: number;
  prices: FuelPrices;
}

const stationPriceHistory = new Map<string, PriceHistoryEntry[]>();

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

const ADDRESS_KEYWORDS = [
  "RETAIL PARK",
  "SERVICE STATION",
  "SERVICES",
  "FORECOURT",
  "CENTRE",
  "CENTER",
  "HIGH ROAD",
  "HIGH STREET",
  "ROAD",
  "RD",
  "STREET",
  "ST",
  "LANE",
  "LN",
  "AVENUE",
  "AVE",
  "WAY",
  "DRIVE",
  "DR",
  "CLOSE",
  "PLACE",
  "COURT",
  "SQUARE",
  "PARK",
  "GATE",
];

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const BRAND_PREFIXES = [
  "TESCO",
  "TESCO STORES",
  "TESCO STORES LTD",
  "TESCO STORE LTD",
  "TESCO PETROL FILLING STATION",
  "TESCO FILLING STATION",
  "TESCO PETROL STATION",
  "ESSO",
  "ESSO PETROL STATION",
  "ESSO FILLING STATION",
  "SHELL",
  "SHELL PETROL STATION",
  "SHELL FILLING STATION",
  "BP",
  "ASDA",
  "MORRISONS",
  "SAINSBURY",
];

const GENERIC_PREFIXES = [
  "STORES",
  "STORES LTD",
  "STORE",
  "LIMITED",
  "LTD",
  "PETROL FILLING STATION",
  "PETROL STATION",
  "FILLING STATION",
  "FILLING STA",
  "SERVICE STATION",
  "AUTOMOBILE ASSOCIATION",
];

function stripPrefixes(address: string, brand?: string): string {
  let text = address.trim();
  const patterns = new Set<string>();

  if (brand) {
    patterns.add(brand.toUpperCase());
  }

  BRAND_PREFIXES.forEach((p) => patterns.add(p.toUpperCase()));
  GENERIC_PREFIXES.forEach((p) => patterns.add(p.toUpperCase()));

  let changed = true;
  while (changed) {
    changed = false;
    for (const pattern of patterns) {
      const regex = new RegExp(`^${escapeRegExp(pattern)}\\b[\\s,./-]*`, "i");
      if (regex.test(text)) {
        text = text.replace(regex, "").trim();
        changed = true;
      }
    }
  }

  return text;
}

function toTitleCase(value: string): string {
  return value
    .toLowerCase()
    .replace(/\b([a-z])/g, (match) => match.toUpperCase())
    .replace(
      /\b(A|B|C|D|E|F|G|H|I|J|K|L|M|N|O|P|Q|R|S|T|U|V|W|X|Y|Z)(\d+)/g,
      (_, letter, digits) => `${letter.toUpperCase()}${digits}`
    );
}

function createShortAddress(
  address?: string,
  brand?: string
): string | undefined {
  if (!address) {
    return undefined;
  }

  let working = stripPrefixes(address, brand);

  // Remove leading numbers and punctuation (house number)
  working = working.replace(/^[0-9#,\-/\s]+/, "").trim();

  if (!working) {
    return undefined;
  }

  const sortedKeywords = [...ADDRESS_KEYWORDS].sort(
    (a, b) => b.length - a.length
  );

  for (const keyword of sortedKeywords) {
    const pattern = keyword
      .split(/\s+/)
      .map((word) => escapeRegExp(word))
      .join("\\s+");
    const regex = new RegExp(`\\b${pattern}\\b`, "i");
    const match = working.match(regex);
    if (match && typeof match.index === "number") {
      const end = match.index + match[0].length;
      const segment = working.slice(0, end).trim();
      if (segment.length > 0) {
        return toTitleCase(segment);
      }
    }
  }

  // Fallback: use text before first comma
  const commaIndex = working.indexOf(",");
  if (commaIndex !== -1) {
    return toTitleCase(working.slice(0, commaIndex).trim());
  }

  // Fallback: first 3 words
  const words = working.split(/\s+/);
  const fallback = words.slice(0, Math.min(3, words.length)).join(" ");
  return toTitleCase(fallback);
}

function parseLastUpdated(dateString?: string): Date | null {
  if (!dateString) {
    return null;
  }

  // Expected format: DD/MM/YYYY HH:mm:ss
  const match = dateString.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})$/
  );

  if (!match) {
    const parsed = new Date(dateString);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  const [, dd, mm, yyyy, hh, min, ss] = match;
  const date = new Date(
    Number(yyyy),
    Number(mm) - 1,
    Number(dd),
    Number(hh),
    Number(min),
    Number(ss)
  );

  return isNaN(date.getTime()) ? null : date;
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();

  const seconds = Math.max(0, Math.floor(diffMs / 1000));
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return days === 1 ? "Updated 1 day ago" : `Updated ${days} days ago`;
  }
  if (hours > 0) {
    return hours === 1 ? "Updated 1 hour ago" : `Updated ${hours} hours ago`;
  }
  if (minutes > 0) {
    return minutes === 1 ? "Updated 1 min ago" : `Updated ${minutes} mins ago`;
  }
  return "Updated just now";
}

const BASE_DRIVE_DELAY_MINUTES = 3; // time for getting into car, lights, junctions
const AVERAGE_DRIVING_SPEED_KMH = 30; // realistic urban speed incl. junctions

function estimateDriveTimeMinutes(distanceKm: number): number | undefined {
  if (!isFinite(distanceKm) || distanceKm < 0) {
    return undefined;
  }

  const travelMinutes = (distanceKm / AVERAGE_DRIVING_SPEED_KMH) * 60;
  const totalMinutes = BASE_DRIVE_DELAY_MINUTES + travelMinutes;
  return Math.max(2, Math.round(totalMinutes));
}

function diff(current?: number, previous?: number): number | undefined {
  if (
    typeof current !== "number" ||
    !isFinite(current) ||
    typeof previous !== "number" ||
    !isFinite(previous)
  ) {
    return undefined;
  }

  const delta = Number((current - previous).toFixed(1));
  return delta === 0 ? 0 : delta;
}

function recordPriceTrend(
  siteId: string,
  prices: FuelPrices,
  lastUpdated?: Date | null
): FuelPriceTrend | undefined {
  if (!siteId) {
    return undefined;
  }

  const timestamp = (lastUpdated ?? new Date()).getTime();
  const history = stationPriceHistory.get(siteId) ?? [];
  const previous = history[history.length - 1];

  const entry: PriceHistoryEntry = {
    timestamp,
    prices: { ...prices },
  };

  history.push(entry);
  if (history.length > MAX_PRICE_HISTORY) {
    history.shift();
  }
  stationPriceHistory.set(siteId, history);

  if (!previous) {
    return undefined;
  }

  const e5Change = diff(prices.E5, previous.prices.E5);
  const e10Change = diff(prices.E10, previous.prices.E10);
  const b7Change = diff(prices.B7, previous.prices.B7);

  const primaryChange =
    e5Change ??
    e10Change ??
    b7Change ??
    (typeof prices.E5 === "number" ? 0 : undefined);

  const direction =
    typeof primaryChange === "number"
      ? primaryChange > 0
        ? "up"
        : primaryChange < 0
        ? "down"
        : "flat"
      : "flat";

  const sampleHours = Number(
    ((timestamp - previous.timestamp) / (1000 * 60 * 60)).toFixed(1)
  );

  return {
    direction: direction as FuelPriceTrend["direction"],
    e5Change,
    e10Change,
    b7Change,
    sampleHours,
  };
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
      const shortAddress = createShortAddress(station.address, station.brand);
      const lastUpdatedDate = parseLastUpdated(station.last_updated);
      const lastUpdatedRelative = lastUpdatedDate
        ? formatRelativeTime(lastUpdatedDate)
        : undefined;
      const priceTrend = recordPriceTrend(
        station.site_id,
        station.prices,
        lastUpdatedDate
      );

      if (!coords) {
        // If coordinates are missing, assign a very large distance
        return {
          ...station,
          distance: Infinity,
          shortAddress,
          lastUpdatedRelative,
          priceTrend,
        };
      }

      const distance = calculateDistance(
        userLat,
        userLon,
        coords.lat,
        coords.lon
      );
      const distanceKm = Number(distance.toFixed(2));
      const estimatedDriveTimeMinutes = estimateDriveTimeMinutes(distanceKm);
      const navigationLink = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
        `${userLat},${userLon}`
      )}&destination=${encodeURIComponent(`${coords.lat},${coords.lon}`)}`;

      return {
        ...station,
        distance: distanceKm,
        shortAddress,
        lastUpdatedRelative,
        estimatedDriveTimeMinutes,
        navigationLink,
        priceTrend,
      };
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
