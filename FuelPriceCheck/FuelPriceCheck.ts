import express = require("express");
import { fetchFuelPriceData, sortByDistance } from "./utils";

const router: express.Router = express();

/**
 * Validate and parse coordinate parameters
 */
function validateCoordinates(
  long: string,
  lat: string
): { longitude: number; latitude: number } | { error: string; status: number } {
  const longitude = Number(long);
  const latitude = Number(lat);

  if (isNaN(longitude) || isNaN(latitude)) {
    return {
      error: "Invalid coordinates",
      status: 400,
    };
  }

  if (longitude < -180 || longitude > 180) {
    return {
      error: "Longitude must be between -180 and 180",
      status: 400,
    };
  }

  if (latitude < -90 || latitude > 90) {
    return {
      error: "Latitude must be between -90 and 90",
      status: 400,
    };
  }

  return { longitude, latitude };
}

router.get("/fuelprice/nearby/:long/:lat", async (req, res) => {
  const { long, lat } = req.params;
  const radius = req.query.radius ? Number(req.query.radius) : 5;

  // Validate coordinates
  const coordinateValidation = validateCoordinates(long, lat);
  if ("error" in coordinateValidation) {
    return res.status(coordinateValidation.status).json({
      error: coordinateValidation.error,
      message: coordinateValidation.error,
    });
  }

  const { longitude, latitude } = coordinateValidation;

  // Validate radius if provided
  if (req.query.radius && (isNaN(radius) || radius < 0 || radius > 50)) {
    return res.status(400).json({
      error: "Invalid radius",
      message: "Radius must be a number between 0 and 50 kilometers",
    });
  }

  try {
    const fuelPriceData = await fetchFuelPriceData(
      `/nearby?lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(
        longitude
      )}&radius=${radius}`
    );

    // Sort data by distance from user's location
    const sortedData = sortByDistance(fuelPriceData, latitude, longitude);

    res.json(sortedData);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Error fetching fuel price data:", errorMessage);
    res.status(500).json({
      error: "Failed to fetch fuel price data",
      message: errorMessage,
    });
  }
});

module.exports = router;
