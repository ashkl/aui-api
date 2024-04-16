var axios = require("axios");
import { AxiosError } from 'axios';
import config from "../config";

export async function fetchTruenasData(url:string) {
    try {
        const apiUrl = `http://${config.TRUENAS_URL}/api/v2.0${url}`;
        const authToken = config.TRUENAS_KEY;

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