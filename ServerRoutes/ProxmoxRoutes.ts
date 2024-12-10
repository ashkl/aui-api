import express = require("express");
import {
  bytesToGB,
  secondsToDh,
  fetchProxmoxData,
  runningStatus,
  getGPUData,
  getLxcMacIpAddr,
} from "./utils";
import { ProdStatus, LxcStatus, QemuStatus, NetworkRes } from "./models";
import {
  sshConnectAndDownload,
  sshConnectAndExecute,
} from "../GlobalUtils/SSH/ssh";
import * as path from "path";
import gpuData from "./Downloads/gpu_output.json";
import config from "../config";

const router: express.Router = express();

router.get("/status/:server", async (req, res) => {
  try {
    const hardwareData = await fetchProxmoxData(
      req.params.server,
      `/nodes/${req.params.server}/status`
    );
    getGPUData();
    const lxcData = await fetchProxmoxData(
      req.params.server,
      `/nodes/${req.params.server}/lxc`
    );
    const vmData = await fetchProxmoxData(
      req.params.server,
      `/nodes/${req.params.server}/qemu`
    );

    const responseData: ProdStatus = {
      uptime: secondsToDh(hardwareData.uptime),
      cpuUsage: Math.ceil(hardwareData.cpu),
      cpuTemp: hardwareData.cpu_temp,
      usedMemory: bytesToGB(hardwareData.memory.used),
      freeMemory: bytesToGB(hardwareData.memory.free),
      totalMemory: bytesToGB(hardwareData.memory.total),
      memoryUsage: +(
        (bytesToGB(hardwareData.memory.used) /
          bytesToGB(hardwareData.memory.total)) *
        100
      ).toFixed(2),
      usedStorage: bytesToGB(hardwareData.rootfs.used),
      freeStorage: bytesToGB(hardwareData.rootfs.free),
      totalStorage: bytesToGB(hardwareData.rootfs.total),
      storageUsage: +(
        (bytesToGB(hardwareData.rootfs.used) /
          bytesToGB(hardwareData.rootfs.total)) *
        100
      ).toFixed(2),
      totalLxc: lxcData.length,
      runningLxc: runningStatus(lxcData),
      totalVms: vmData.length,
      runningVms: runningStatus(vmData),
      gpu: {
        gpu_3d: Math.ceil(gpuData.engines["Render/3D/0"].busy),
        gpu_video: Math.ceil(gpuData.engines["Video/0"].busy),
        gpu_video_enhance: Math.ceil(gpuData.engines["VideoEnhance/0"].busy),
      },
    };

    res.send(responseData);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.get("/lxcstatus/:server/:lxcid", async (req, res) => {
  try {
    const lxcData = await fetchProxmoxData(
      req.params.server,
      `/nodes/${req.params.server}/lxc/${req.params.lxcid}/status/current`
    );

    const responseData: LxcStatus = {
      vmid: lxcData.vmid,
      name: lxcData.name,
      status: lxcData.status,
      cpuUseage: +lxcData.cpu.toFixed(2),
      memoryUseage: +((lxcData.mem / lxcData.maxmem) * 100).toFixed(2),
    };

    res.send(responseData);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.get("/lxcstatusall/:server", async (req, res) => {
  try {
    const lxcData = await fetchProxmoxData(
      req.params.server,
      `/nodes/${req.params.server}/lxc`
    );
    let newLxcData = [];

    for (let i = 0; i < lxcData.length; i++) {
      const macIp: NetworkRes | undefined = await getLxcMacIpAddr(
        req.params.server,
        lxcData[i].vmid
      );

      const newData: LxcStatus = {
        vmid: lxcData[i].vmid,
        name: lxcData[i].name,
        ip: macIp?.ip || "XXX.XXX.X.XXX",
        mac: macIp?.mac || "XX:XX:XX:XX:XX:XX",
        status: lxcData[i].status,
        cpuUseage: +lxcData[i].cpu.toFixed(2),
        memoryUseage: +((lxcData[i].mem / lxcData[i].maxmem) * 100).toFixed(2),
      };
      newLxcData.push(newData);
    }

    newLxcData.sort((a, b) => parseInt(a.vmid) - parseInt(b.vmid));

    res.send(newLxcData);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.get("/qemustatus/:server/:qemuid", async (req, res) => {
  try {
    const qemuData = await fetchProxmoxData(
      req.params.server,
      `/nodes/${req.params.server}/qemu/${req.params.qemuid}/status/current`
    );

    const responseData: QemuStatus = {
      vmid: qemuData.vmid,
      name: qemuData.name,
      status: qemuData.status,
      cpuUseage: +qemuData.cpu.toFixed(2),
      memoryUseage: +((qemuData.mem / qemuData.maxmem) * 100).toFixed(2),
    };

    res.send(responseData);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.get("/qemustatusall/:server", async (req, res) => {
  try {
    const qemuData = await fetchProxmoxData(
      req.params.server,
      `/nodes/${req.params.server}/qemu`
    );
    let newQemuData = [];

    for (let i = 0; i < qemuData.length; i++) {
      const newData: QemuStatus = {
        vmid: qemuData[i].vmid,
        name: qemuData[i].name,
        status: qemuData[i].status,
        cpuUseage: +qemuData[i].cpu.toFixed(2),
        memoryUseage: +((qemuData[i].mem / qemuData[i].maxmem) * 100).toFixed(
          2
        ),
      };
      newQemuData.push(newData);
    }
    newQemuData.sort((a, b) => parseInt(a.vmid) - parseInt(b.vmid));
    res.send(newQemuData);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.get("/:server/custom", async (req, res) => {
  const data = await fetchProxmoxData(
    req.params.server,
    `/nodes/prod/lxc/102/config`
  );
  res.send(data);
});

router.get("/gpuData", async (req, res) => {
  const localFilePath = path.join(__dirname, "Downloads", "gpu_output.json");

  let hostname: string = config.PROD_HOSTNAME || "";
  let username: string = config.PROD_USERNAME || "";
  let password: string = config.PROD_PASSWORD || "";

  try {
    const sshOutput = await sshConnectAndExecute(
      hostname,
      username,
      password,
      "timeout 1s intel_gpu_top -J > output.json"
    );
    await sshConnectAndDownload(
      hostname,
      username,
      password,
      "/root/output.json",
      localFilePath
    );
    res.send({ sshOutput });
  } catch (error) {
    res.status(500).send({ error });
  }
});

module.exports = router;
