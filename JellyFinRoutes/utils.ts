var axios = require("axios");
import { AxiosError } from 'axios';
import config from "../config";
import { StandardResponse } from './models';

export async function fetchJellyFinData(url:string) {
    const apiUrl = `http://${config.JELLYFIN_URL}${url}`;
    const authToken = config.JELLYFIN_KEY;
   
    try {
        const response = await axios.get(apiUrl, {
            params: {
                'ApiKey': `${authToken}`,
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

export async function postJellyFinDataToPhone(json:StandardResponse) {
    const phoneApiUrl = config.JOIN_API_URL;

    try {
        const response = await axios.post(phoneApiUrl, null, {
            params: {
                'text': `${json}`,
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