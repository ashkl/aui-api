import * as dotenv from 'dotenv';
import config from "./config";
dotenv.config()
import express = require("express");
import bodyParser = require("body-parser");

const jamCamRouter = require('./JamCamRoutes/JamCamRoutes');
const serverRouter = require('./ServerRoutes/ProxmoxRoutes');
const homeassistantRouter = require('./HomeAssistantRoutes/HomeAssistantRoutes');
const jellyfinRouter = require('./JellyFinRoutes/JellyFinRoutes');

const PORT = config.PORT;
const app: express.Application = express();

app.use(bodyParser.text());

app.use(jamCamRouter);
app.use(serverRouter);
app.use(homeassistantRouter);
app.use(jellyfinRouter);

app.use(express.json());

app.listen(PORT, function () {
    console.log(`Running on port: ${PORT}`);
})