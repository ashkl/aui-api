var axios = require("axios");
import { AxiosError } from "axios";
import config from "../config";

export async function fetchHomeAssistantData(url: string) {
  try {
    const apiUrl = `http://${config.HOME_ASSISTANT_URL}/api${url}`;
    const authToken = config.HOME_ASSISTANT_KEY;

    const response = await axios.get(apiUrl, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
    });

    return response.data;
  } catch (error) {
    console.error("Axios request failed:", (error as AxiosError).message);

    if ((error as AxiosError).response) {
      console.error("Response status:", (error as AxiosError).response?.status);
      console.error("Response data:", (error as AxiosError).response?.data);
    }
  }
}

export async function toggleLight(state: string) {
  try {
    let mode = "";

    if (state == "on") {
      mode = "off";
    } else {
      mode = "on";
    }

    const data = {
      entity_id: "light.smart_ceiling_light",
    };

    const apiUrl = `http://${config.HOME_ASSISTANT_URL}/api/services/light/turn_${mode}`;
    const authToken = config.HOME_ASSISTANT_KEY;

    await axios.post(apiUrl, data, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
    });

    return mode;
  } catch (error) {
    console.error("Axios request failed:", (error as AxiosError).message);

    if ((error as AxiosError).response) {
      console.error("Response status:", (error as AxiosError).response?.status);
      console.error("Response data:", (error as AxiosError).response?.data);
    }
  }
}

export async function rgbOnly() {
  try {
    const initial = {
      entity_id: "light.smart_ceiling_light",
      brightness: 0,
    };

    const rgb = {
      entity_id: "light.smart_ceiling_light",
      brightness: 255,
      rgb_color: [20, 0, 255],
    };

    const apiUrl = `http://${config.HOME_ASSISTANT_URL}/api/services/light/turn_on`;
    const authToken = config.HOME_ASSISTANT_KEY;

    await axios.post(apiUrl, initial, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
    });

    await axios.post(apiUrl, rgb, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
    });

    return "works";
  } catch (error) {
    console.error("Axios request failed:", (error as AxiosError).message);

    if ((error as AxiosError).response) {
      console.error("Response status:", (error as AxiosError).response?.status);
      console.error("Response data:", (error as AxiosError).response?.data);
    }
  }
}

export async function changeColour(red: number, green: number, blue: number) {
  try {
    const data = {
      entity_id: "light.smart_ceiling_light",
      rgb_color: [red, green, blue],
      brightness: 255,
    };

    const apiUrl = `http://${config.HOME_ASSISTANT_URL}/api/services/light/turn_on`;
    const authToken = config.HOME_ASSISTANT_KEY;

    await axios.post(apiUrl, data, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
    });
    return "works";
  } catch (error) {
    console.error("Axios request failed:", (error as AxiosError).message);

    if ((error as AxiosError).response) {
      console.error("Response status:", (error as AxiosError).response?.status);
      console.error("Response data:", (error as AxiosError).response?.data);
    }
  }
}

export async function changeColourTemp() {
  try {
    const data = {
      entity_id: "light.smart_ceiling_light",
      brightness: 100,
      color_temp_kelvin: 2000,
    };

    const apiUrl = `http://${config.HOME_ASSISTANT_URL}/api/services/light/turn_on`;
    const authToken = config.HOME_ASSISTANT_KEY;

    await axios.post(apiUrl, data, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
    });
    return "works";
  } catch (error) {
    console.error("Axios request failed:", (error as AxiosError).message);

    if ((error as AxiosError).response) {
      console.error("Response status:", (error as AxiosError).response?.status);
      console.error("Response data:", (error as AxiosError).response?.data);
    }
  }
}

export async function toggleRoomFan(state: string) {
  try {
    let mode = "";

    if (state == "on") {
      mode = "off";
    } else {
      mode = "on";
    }

    const data = {
      entity_id: "switch.hl_server_socket_1",
    };

    const apiUrl = `http://${config.HOME_ASSISTANT_URL}/api/services/switch/turn_${mode}`;
    const authToken = config.HOME_ASSISTANT_KEY;

    await axios.post(apiUrl, data, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
    });

    return mode;
  } catch (error) {
    console.error("Axios request failed:", (error as AxiosError).message);

    if ((error as AxiosError).response) {
      console.error("Response status:", (error as AxiosError).response?.status);
      console.error("Response data:", (error as AxiosError).response?.data);
    }
  }
}
