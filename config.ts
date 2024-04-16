import path from "path";
import dotenv from "dotenv";

// Parsing the env file.
dotenv.config({ path: path.resolve(__dirname, "./.env.local") });

// Interface to load env variables
// Note these variables can possibly be undefined
// as someone could skip these varibales or not setup a .env file at all

interface ENV {
  PORT: number | undefined;

  //PROD PROXMOX
  PROD_URL: string | undefined;
  PROD_KEY: string | undefined;

  //NAS PROXMOX
  NAS_URL: string | undefined;
  NAS_KEY: string | undefined;

  //TRUENAS
  TRUENAS_URL: string | undefined;
  TRUENAS_KEY: string | undefined;

  //HOME ASSISTANT
  HOME_ASSISTANT_URL: string | undefined;
  HOME_ASSISTANT_KEY: string | undefined;

  //JELLYFIN
  JELLYFIN_URL: string | undefined;
  JOIN_API_URL: string | undefined;
  JELLYFIN_KEY: string | undefined;
  
  //EXTRA
  MAPBOX_KEY: string | undefined;
}

interface Config {
  PORT: number | undefined;

  //PROD PROXMOX
  PROD_URL: string | undefined;
  PROD_KEY: string | undefined;

  //NAS PROXMOX
  NAS_URL: string | undefined;
  NAS_KEY: string | undefined;

  //TRUENAS
  TRUENAS_URL: string | undefined;
  TRUENAS_KEY: string | undefined;

  //HOME ASSISTANT
  HOME_ASSISTANT_URL: string | undefined;
  HOME_ASSISTANT_KEY: string | undefined;

  //JELLYFIN
  JELLYFIN_URL: string | undefined;
  JOIN_API_URL: string | undefined;
  JELLYFIN_KEY: string | undefined;
  
  //EXTRA
  MAPBOX_KEY: string | undefined;
}

// Loading process.env as ENV interface

const getConfig = (): ENV => {
  return {
    PORT: process.env.PORT ? Number(process.env.PORT) : undefined,

    //PROD PROXMOX
    PROD_URL: process.env.PROD_URL,
    PROD_KEY: process.env.PROD_KEY,

    //NAS PROXMOX
    NAS_URL: process.env.NAS_URL,
    NAS_KEY: process.env.NAS_KEY,

    //TRUENAS
    TRUENAS_URL: process.env.TRUENAS_URL,
    TRUENAS_KEY: process.env.TRUENAS_KEY,

    //HOME ASSISTANT
    HOME_ASSISTANT_URL: process.env.HOME_ASSISTANT_URL,
    HOME_ASSISTANT_KEY: process.env.HOME_ASSISTANT_KEY,

    //JELLYFIN
    JELLYFIN_URL: process.env.JELLYFIN_URL,
    JOIN_API_URL: process.env.JOIN_API_URL,
    JELLYFIN_KEY: process.env.JELLYFIN_KEY,

    //EXTRA
    MAPBOX_KEY: process.env.MAPBOX_KEY,
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