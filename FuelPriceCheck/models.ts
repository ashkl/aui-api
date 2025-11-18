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

export interface FuelStation {
  site_id: string;
  brand: string;
  address: string;
  postcode: string;
  location: Location;
  prices: FuelPrices;
  last_updated: string;
  distance?: number; // Added by our sorting function
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
