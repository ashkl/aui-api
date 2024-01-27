import path from "path";
import dotenv from "dotenv";

// Parsing the env file.
dotenv.config({ path: path.resolve(__dirname, "./.env.local") });

// Interface to load env variables
// Note these variables can possibly be undefined
// as someone could skip these varibales or not setup a .env file at all

interface ENV {
  PORT: number | undefined;
  
  HOME_ASSISTANT_URL: string | undefined;
  PROXMOX_URL: string | undefined;
  JELLYFIN_URL: string | undefined;
  JOIN_API_URL: string | undefined;

  MAPBOX_KEY: string | undefined;
  HOME_ASSISTANT_KEY: string | undefined;
  PROXMOX_KEY: string | undefined;
  JELLYFIN_KEY: string | undefined;  
}

interface Config {
  PORT: number | undefined;

  HOME_ASSISTANT_URL: string | undefined;
  PROXMOX_URL: string | undefined;
  JELLYFIN_URL: string | undefined;
  JOIN_API_URL: string | undefined;

  MAPBOX_KEY: string | undefined;
  HOME_ASSISTANT_KEY: string | undefined;
  PROXMOX_KEY: string | undefined;
  JELLYFIN_KEY: string | undefined;
}

// Loading process.env as ENV interface

const getConfig = (): ENV => {
  return {
    PORT: process.env.PORT ? Number(process.env.PORT) : undefined,
    
    HOME_ASSISTANT_URL: process.env.HOME_ASSISTANT_URL,
    PROXMOX_URL: process.env.PROXMOX_URL,
    JELLYFIN_URL: process.env.JELLYFIN_URL,
    JOIN_API_URL: process.env.JOIN_API_URL,

    MAPBOX_KEY: process.env.MAPBOX_KEY,
    HOME_ASSISTANT_KEY: process.env.HOME_ASSISTANT_KEY,
    PROXMOX_KEY: process.env.PROXMOX_KEY,
    JELLYFIN_KEY: process.env.JELLYFIN_KEY,
  };
};

// Throwing an Error if any field was undefined we don't 
// want our app to run if it can't connect to DB and ensure 
// that these fields are accessible. If all is good return
// it as Config which just removes the undefined from our type 
// definition.

const getSanitzedConfig = (config: ENV): Config => {
  for (const [key, value] of Object.entries(config)) {
    if (value === undefined) {
      throw new Error(`Missing key ${key} in config.env`);
    }
  }
  return config as Config;
};

const config = getConfig();

const sanitizedConfig = getSanitzedConfig(config);

export default sanitizedConfig;