import express = require("express");
import { fetchTruenasData } from "./utils";
import { bytesToGB } from "../ServerRoutes/utils";
import { poolStatus } from "./models";

const router: express.Router = express();

router.get('/pools', async (req, res) => {
    try {

        const hardwareData = await fetchTruenasData('/pool');

        let pools = [];
        for (let i=0; i<hardwareData.length; i++){
            const pool: poolStatus = {
                name: hardwareData[i].name,
                path: hardwareData[i].path,
                status: hardwareData[i].status,
                totalSpace: bytesToGB(hardwareData[i].size),
                freeSpace: bytesToGB(hardwareData[i].free),
                usedSpace: bytesToGB(hardwareData[i].allocated),
                usagePercentage: +((hardwareData[i].allocated/hardwareData[i].size)*100).toFixed(2)
            }
            pools.push(pool);
        }

        res.send(pools);
        
    } catch (error) {
        res.status(500).send(error);
    }

})

module.exports = router;