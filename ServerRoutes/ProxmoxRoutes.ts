import express = require("express");
import { bytesToGB, secondsToDh, fetchProxmoxData, runningStatus } from "./utils";
import { ProdStatus, LxcStatus, QemuStatus, baseStatus } from "./models";

const router: express.Router = express();

router.get('/status/:server', async (req, res) => {
    try {

        const hardwareData = await fetchProxmoxData(req.params.server,`/nodes/${req.params.server}/status`);
        const lxcData = await fetchProxmoxData(req.params.server,`/nodes/${req.params.server}/lxc`);
        const vmData = await fetchProxmoxData(req.params.server,`/nodes/${req.params.server}/qemu`);
    
        const responseData: ProdStatus = {
            uptime: secondsToDh(hardwareData.uptime),
            cpuUsage: Math.ceil(hardwareData.cpu),
            cpuTemp: hardwareData.cpu_temp,
            usedMemory: bytesToGB(hardwareData.memory.used),
            freeMemory: bytesToGB(hardwareData.memory.free),
            totalMemory: bytesToGB(hardwareData.memory.total),
            memoryUsage: +(bytesToGB(hardwareData.memory.used)/bytesToGB(hardwareData.memory.total)*100).toFixed(2),
            usedStorage: bytesToGB(hardwareData.rootfs.used),
            freeStorage: bytesToGB(hardwareData.rootfs.free),
            totalStorage: bytesToGB(hardwareData.rootfs.total),
            storageUsage: +(bytesToGB(hardwareData.rootfs.used)/bytesToGB(hardwareData.rootfs.total)*100).toFixed(2),
            totalLxc: lxcData.length,
            runningLxc: runningStatus(lxcData),
            totalVms: vmData.length,
            runningVms: runningStatus(vmData),
        }
    
        res.send(responseData)
        
    } catch (error) {
        res.status(500).send(error);
    }

})

router.get('/lxcstatus/:server/:lxcid', async (req, res) => {

    try {

        const lxcData = await fetchProxmoxData(req.params.server,`/nodes/${req.params.server}/lxc/${req.params.lxcid}/status/current`);

        const responseData: LxcStatus = {
            vmid: lxcData.vmid,
            name: lxcData.name,
            status: lxcData.status,
            cpuUseage: +(lxcData.cpu).toFixed(2),
            memoryUseage: +(lxcData.mem/lxcData.maxmem*100).toFixed(2)
        }
        
        res.send(responseData);
        
    } catch (error) {
        res.status(500).send(error);
    }
  })

router.get('/lxcstatusall/:server', async (req, res) => {

    try {

        const lxcData = await fetchProxmoxData(req.params.server,`/nodes/${req.params.server}/lxc`);
        let newLxcData = [];
    
        for (let i=0; i<lxcData.length; i++){
            const newData: LxcStatus = {
                vmid: lxcData[i].vmid,
                name: lxcData[i].name,
                status: lxcData[i].status,
                cpuUseage: +(lxcData[i].cpu).toFixed(2),
                memoryUseage: +(lxcData[i].mem/lxcData[i].maxmem*100).toFixed(2)
            }
            newLxcData.push(newData);
        }
        
        res.send(newLxcData);
        
    } catch (error) {
        res.status(500).send(error);
    }
})

router.get('/qemustatus/:server/:qemuid', async (req, res) => {

    try {

        const qemuData = await fetchProxmoxData(req.params.server,`/nodes/${req.params.server}/qemu/${req.params.qemuid}/status/current`);

        const responseData: QemuStatus = {
            vmid: qemuData.vmid,
            name: qemuData.name,
            status: qemuData.status,
            cpuUseage: +(qemuData.cpu).toFixed(2),
            memoryUseage: +(qemuData.mem/qemuData.maxmem*100).toFixed(2)
        }
        
        res.send(responseData);
        
    } catch (error) {
        res.status(500).send(error);
    }
})

router.get('/qemustatusall/:server', async (req, res) => {

    try {

        const qemuData = await fetchProxmoxData(req.params.server,`/nodes/${req.params.server}/qemu`);
        let newLxcData = [];
    
        for (let i=0; i<qemuData.length; i++){
            const newData: QemuStatus = {
                vmid: qemuData[i].vmid,
                name: qemuData[i].name,
                status: qemuData[i].status,
                cpuUseage: +(qemuData[i].cpu).toFixed(2),
                memoryUseage: +(qemuData[i].mem/qemuData[i].maxmem*100).toFixed(2)
            }
            newLxcData.push(newData);
        }
        
        res.send(newLxcData);
        
    } catch (error) {
        res.status(500).send(error);
    }
})

router.get('/:server/custom', async (req, res) => {
    const data = await fetchProxmoxData(req.params.server,`/nodes/${req.params.server}/storage`);
    res.send(data);
})

module.exports = router;