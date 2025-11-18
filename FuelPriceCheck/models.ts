/**
 * Type definitions for fuel price API responses
 */

export interface Location {
  latitude: number;
  longitude: number;
}

export interface FuelPrices {
  E5?: number;
  E10?: number;
  B7?: number;
  SDV?: number;
  [key: string]: number | undefined;
}

export interface FuelPriceTrend {
  direction: "up" | "down" | "flat";
  e5Change?: number;
  e10Change?: number;
  b7Change?: number;
  sampleHours?: number;
}

export interface FuelStation {
  site_id: string;
  brand: string;
  address: string;
  postcode: string;
  location: Location;
  prices: FuelPrices;
  last_updated: string;
  distance?: number; // Added by our sorting function
  shortAddress?: string; // Friendly address computed on server
  lastUpdatedRelative?: string;
  estimatedDriveTimeMinutes?: number;
  navigationLink?: string;
  priceTrend?: FuelPriceTrend;
}

export interface FuelPriceApiResponse {
  data: FuelStation[];
  count: number;
  params: {
    latitude: number;
    longitude: number;
    radius: number;
  };
}
