import express = require("express");
import config from "../config";

var axios = require("axios");

const router: express.Router = express();
const MAPBOX_ACCESS_TOKEN = config.MAPBOX_KEY;

router.get('/jamCamSearch/:loc', async (req, res) => {
  axios.get(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(req.params.loc)}.json?country=gb&bbox=-0.535583%2C51.256758%2C0.365295%2C51.701502&limit=1&proximity=ip&types=place%2Cpostcode%2Caddress&access_token=${MAPBOX_ACCESS_TOKEN}`)
        .then(function (response: any) {
            const long = response.data.features[0].center[0];
            const lat = response.data.features[0].center[1];
            axios.get(`https://api.tfl.gov.uk/Place?lat=${lat}&lon=${long}&radius=1000&type=JamCam`)
                .then(function (response: any) {
                    res.statusCode = 200;
                    res.send(response.data)
                })
                .catch(function (error: any) {
                    res.statusCode = 404;
                    res.send("No cameras nearby, please try increasing the radius.")
                })
        })
        .catch(function (error: any) {
            res.statusCode = 404;
            res.send("Please enter a location within London or try the postcode.")
            console.log(error);
        })
})

router.get('/jamCam/:long-:lat', async (req, res) => {
    const longParam: number = Number(req.params.long);
    const latParam: number = Number(req.params.lat);
    console.log(longParam);
    console.log(latParam);

    axios.get(`https://api.tfl.gov.uk/Place/?Lat=${encodeURIComponent(req.params.lat)}&Lon=${encodeURIComponent(req.params.long)}&radius=1000&type=JamCam`)
        .then(function (response: any) {
            res.statusCode = 200;
            res.send(response.data)
        })
        .catch(function (error: any) {
            res.statusCode = 404;
            res.send("No cameras nearby, please try increasing the radius.")
        })
})

router.get('/traffic/:long-:lat', async (req, res) => {
    const longParam: number = Number(req.params.long);
    const latParam: number = Number(req.params.lat);
    console.log(longParam);
    console.log(latParam);

    axios.get('https://api.tfl.gov.uk/Road/')
        .then(function (response: any) {
            
            const data = response.data;
            let arrayData: any = [];
            let responseData = { "data": arrayData};
            
            for (let i = 0; i < data.length; i++) {
                
                let returnDataObj = {
                    roadName: "",
                    status: "",
                    statusDesc: ""
                }

                const bbox = JSON.parse(data[i].bounds);
                
                if (bbox[0][0] <= longParam && longParam <= bbox[1][0] && bbox[0][1] <= latParam && latParam <= bbox[1][1]) {
                    returnDataObj.roadName = data[i].displayName;
                    returnDataObj.status = data[i].statusSeverity;
                    returnDataObj.statusDesc = data[i].statusSeverityDescription;
                    arrayData.push(returnDataObj);
                }
            }
            if (arrayData.length === 0) {
                res.statusCode=404;
                res.send("Not in London.")
            } else {
                res.send(responseData);
            }
        })
        .catch(function (error: any) {
            res.send(error);
        })
})

module.exports = router;