import express = require("express");
import { bytesToGB, secondsToDh, fetchProxmoxData, runningStatus } from "./utils";
import { HomelabStatus, LxcStatus, QemuStatus } from "./models";

const router: express.Router = express();

router.get('/homelabstatus', async (req, res) => {

    try {

        const hardwaredData = await fetchProxmoxData('/nodes/homelab/status');
        const lxcData = await fetchProxmoxData('/nodes/homelab/lxc');
        const vmData = await fetchProxmoxData('/nodes/homelab/qemu');
    
        const responseData: HomelabStatus = {
            uptime: secondsToDh(hardwaredData.uptime),
            cpuUsage: Math.ceil(hardwaredData.cpu),
            cpuTemp: hardwaredData.cpu_temp,
            usedMemory: bytesToGB(hardwaredData.memory.used),
            freeMemory: bytesToGB(hardwaredData.memory.free),
            totalMemory: bytesToGB(hardwaredData.memory.total),
            memoryUsage: +(bytesToGB(hardwaredData.memory.used)/bytesToGB(hardwaredData.memory.total)*100).toFixed(2),
            usedStorage: bytesToGB(hardwaredData.rootfs.used),
            freeStorage: bytesToGB(hardwaredData.rootfs.free),
            totalStorage: bytesToGB(hardwaredData.rootfs.total),
            storageUsage: +(bytesToGB(hardwaredData.rootfs.used)/bytesToGB(hardwaredData.rootfs.total)*100).toFixed(2),
            gpu_usage: hardwaredData.gpu.gpu_usage,
            gpu_temp: hardwaredData.gpu.gpu_temp,
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

router.get('/lxcstatus/:lxcid', async (req, res) => {

    try {

        const lxcData = await fetchProxmoxData(`/nodes/homelab/lxc/${req.params.lxcid}/status/current`);

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

router.get('/lxcstatusall', async (req, res) => {

    try {

        const lxcData = await fetchProxmoxData(`/nodes/homelab/lxc`);
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

router.get('/qemustatus/:qemuid', async (req, res) => {

    try {

        const qemuData = await fetchProxmoxData(`/nodes/homelab/qemu/${req.params.qemuid}/status/current`);

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

router.get('/qemustatusall', async (req, res) => {

    try {

        const qemuData = await fetchProxmoxData(`/nodes/homelab/qemu`);
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

router.get('/custom', async (req, res) => {
    const data = await fetchProxmoxData(`/nodes/homelab/qemu`);
    res.send(data);
})

module.exports = router;