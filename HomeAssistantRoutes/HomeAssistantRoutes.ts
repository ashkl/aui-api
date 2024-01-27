require('dotenv').config();
import express = require("express");

import { fetchHomeAssistantData, toggleLight } from "./utils";

const router: express.Router = express();

router.get('/homeassistant/power', async (req, res) => {
    const mainPCData = await fetchHomeAssistantData('/states/sensor.main_pc_power');
    const homelabServerData = await fetchHomeAssistantData('/states/sensor.smart_socket_3_power');
    const ogServerData = await fetchHomeAssistantData('/states/sensor.og_server_power');

    const responseData = {
        mainPCPower: mainPCData.state,
        homelabServerPower: homelabServerData.state,
        ogServerPower: ogServerData.state,
    }

    res.send(responseData);
})

router.get('/homeassistant/roomTemp', async (req, res) => {
    const tempData = await fetchHomeAssistantData('/states/sensor.wifi_temperature_humidity_sensor_temperature');
    const humidityData = await fetchHomeAssistantData('/states/sensor.wifi_temperature_humidity_sensor_humidity');

    const responseData = {
        temp: tempData.state,
        humidity: humidityData.state
    }

    res.send(responseData);
})

router.post('/homeassistant/toggleRoomLight', async (req, res) => {
    
    try {
        const lightData = await fetchHomeAssistantData('/states/light.room_light');
        const response = await toggleLight(lightData.state);

        res.send(response)
    } catch (error) {
        console.error('Error in toggleRoomLight route:', error);
        res.status(500).send('Internal Server Error');
    }
    
})

router.get('/homeassistant/states', async (req, res) => {
    const data = await fetchHomeAssistantData('/states');
    res.send(data);
})

module.exports = router;