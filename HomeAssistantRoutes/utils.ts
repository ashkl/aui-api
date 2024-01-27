var axios = require("axios");
import { AxiosError } from 'axios';
import config from "../config";

export async function fetchHomeAssistantData(url:string) {
    try {
        const apiUrl = `http://${config.HOME_ASSISTANT_URL}/api${url}`;
        const authToken = config.HOME_ASSISTANT_KEY;

        const response = await axios.get(apiUrl, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json',
            },
        });

        return response.data

    } catch (error) {
        console.error('Axios request failed:', (error as AxiosError).message);

        if ((error as AxiosError).response) {
            console.error('Response status:', (error as AxiosError).response?.status);
            console.error('Response data:', (error as AxiosError).response?.data);
        }
    }
}

export async function toggleLight(state:string) {
    try {
        let mode = "";
        
        if (state == "on") {
            mode = "off";
        } else {
            mode = "on";
        }

        const data = {
            entity_id: 'light.room_light'
        }

        const apiUrl = `http://${config.HOME_ASSISTANT_URL}/api/services/light/turn_${mode}`;
        const authToken = config.HOME_ASSISTANT_KEY;

        await axios.post(apiUrl, data, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json',
            },
        });

        return mode;

    } catch (error) {
        console.error('Axios request failed:', (error as AxiosError).message);

        if ((error as AxiosError).response) {
            console.error('Response status:', (error as AxiosError).response?.status);
            console.error('Response data:', (error as AxiosError).response?.data);
        }
    }
}