require("dotenv").config();
import express = require("express");

import {
  changeColour,
  changeColourTemp,
  fetchHomeAssistantData,
  rgbOnly,
  toggleLight,
  toggleRoomFan,
} from "./utils";

const router: express.Router = express();

router.get("/homeassistant/power", async (req, res) => {
  try {
    const mainPCData = await fetchHomeAssistantData(
      "/states/sensor.main_pc_power"
    );
    const mainPCAccData = await fetchHomeAssistantData(
      "/states/sensor.pc_acc_power"
    );
    const serverRackData = await fetchHomeAssistantData(
      "/states/sensor.server_rack_power"
    );
    const prodData = await fetchHomeAssistantData(
      "/states/sensor.pve_prod_power"
    );
    const ogServerData = await fetchHomeAssistantData(
      "/states/sensor.pve_nas_power"
    );

    const responseData = {
      mainPCPower: mainPCData.state,
      mainPCAccData: mainPCAccData.state,
      serverRackData: serverRackData.state,
      prodServerPower: prodData.state,
      nasServerPower: ogServerData.state,
    };
    res.send(responseData);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.get("/homeassistant/roomTemp", async (req, res) => {
  try {
    const tempData = await fetchHomeAssistantData(
      "/states/sensor.room_sensor_temperature"
    );
    const humidityData = await fetchHomeAssistantData(
      "/states/sensor.room_sensor_humidity"
    );

    const windowState = await fetchHomeAssistantData(
      "/states/binary_sensor.bedroom_trv_window"
    );

    const responseData = {
      temp: tempData.state,
      humidity: humidityData.state,
      window: windowState.state,
    };

    res.send(responseData);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.get("/homeassistant/serverClosetTemp", async (req, res) => {
  try {
    const tempData = await fetchHomeAssistantData(
      "/states/sensor.server_room_temp_temperature"
    );
    const humidityData = await fetchHomeAssistantData(
      "/states/sensor.server_room_temp_humidity"
    );

    const responseData = {
      temp: tempData.state,
      humidity: humidityData.state,
    };

    res.send(responseData);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.post("/homeassistant/toggleRoomLight", async (req, res) => {
  try {
    const lightData = await fetchHomeAssistantData(
      "/states/light.smart_ceiling_light"
    );
    const response = await toggleLight(lightData.state);

    res.send(response);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.post("/homeassistant/roomLightColour", async (req, res) => {
  try {
    const response = await changeColour(50, 0, 255);
    res.send(response);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.post("/homeassistant/roomLightColourTemp", async (req, res) => {
  try {
    const response = await changeColourTemp(2000, 4);
    res.send(response);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.post("/homeassistant/toggleRoomFan", async (req, res) => {
  try {
    const fanData = await fetchHomeAssistantData(
      "/states/switch.hl_server_socket_1"
    );
    const response = await toggleRoomFan(fanData.state);

    res.send(response);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.get("/homeassistant/states", async (req, res) => {
  const data = await fetchHomeAssistantData("/states");
  res.send(data);
});

module.exports = router;
