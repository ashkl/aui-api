var axios = require("axios");
import { AxiosError } from 'axios';
import config from "../config";

export async function fetchProxmoxData(server:string, url:string) {

    let SERVER_URL;
    let SERVER_KEY;

    if (server === "prod"){
        SERVER_URL = config.PROD_URL;
        SERVER_KEY = config.PROD_KEY;
    } else {
        SERVER_URL = config.NAS_URL;
        SERVER_KEY = config.NAS_KEY;
    }

    try {
        const apiUrl = `https://${SERVER_URL}/api2/json${url}`;
        const authToken = SERVER_KEY;

        process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

        const response = await axios.get(apiUrl, {
            headers: {
                'Authorization': `PVEAPIToken=${authToken}`,
                'Content-Type': 'application/json',
            },
        });

        return response.data.data

    } catch (error) {
        console.error('Axios request failed:', (error as AxiosError).message);

        if ((error as AxiosError).response) {
            console.error('Response status:', (error as AxiosError).response?.status);
            console.error('Response data:', (error as AxiosError).response?.data);
        }
    }
}

export function bytesToGB(bytes: number): number {
    return +(bytes/Math.pow(1024, 3)).toFixed(2);
}

export function secondsToDh(seconds: number): string {
    const days = Math.floor(seconds / (3600 * 24));
    const hours = Math.floor((seconds % (3600 * 24)) / 3600);

    return `${days}D ${hours}H`;
}

export function runningStatus(data: any) {
    let count = 0
    for (let i=0; i<data.length; i++){
        if (data[i].status == 'running'){
            count++
        }
    }
    return count;
}