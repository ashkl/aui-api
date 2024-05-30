require('dotenv').config();
import express = require("express");

import { fetchHomeAssistantData, toggleLight, toggleRoomFan } from "./utils";

const router: express.Router = express();

router.get('/homeassistant/power', async (req, res) => {

    try {
     
        const mainPCData = await fetchHomeAssistantData('/states/sensor.main_pc_power');
        const prodData = await fetchHomeAssistantData('/states/sensor.fan_control_power');
        const ogServerData = await fetchHomeAssistantData('/states/sensor.og_server_power');

        const responseData = {
            mainPCPower: mainPCData.state,
            prodServerPower: prodData.state,
            nasServerPower: ogServerData.state,
        }
        res.send(responseData);
        
    } catch (error) {
        res.status(500).send(error);
    }
})

router.get('/homeassistant/roomTemp', async (req, res) => {
    try {

        const tempData = await fetchHomeAssistantData('/states/sensor.wifi_temperature_humidity_sensor_temperature');
        const humidityData = await fetchHomeAssistantData('/states/sensor.wifi_temperature_humidity_sensor_humidity');
    
        const responseData = {
            temp: tempData.state,
            humidity: humidityData.state
        }
    
        res.send(responseData);
        
    } catch (error) {
        res.status(500).send(error);
    }
})

router.post('/homeassistant/toggleRoomLight', async (req, res) => {
    
    try {
        const lightData = await fetchHomeAssistantData('/states/light.room_light');
        const response = await toggleLight(lightData.state);

        res.send(response)
    } catch (error) {
        res.status(500).send(error);
    }
    
})

router.post('/homeassistant/toggleRoomFan', async (req, res) => {
    
    try {
        const fanData = await fetchHomeAssistantData('/states/switch.hl_server_socket_1');
        const response = await toggleRoomFan(fanData.state);

        res.send(response)
    } catch (error) {
        res.status(500).send(error);
    }
    
})

router.get('/homeassistant/states', async (req, res) => {
    const data = await fetchHomeAssistantData('/states');
    res.send(data);
})

module.exports = router;