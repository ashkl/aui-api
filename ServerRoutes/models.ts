export interface HomelabStatus {
    uptime: string;
    cpuUsage: number;
    cpuTemp: number;
    usedMemory: number;
    freeMemory: number;
    totalMemory: number;
    memoryUsage: number;
    usedStorage: number;
    freeStorage: number;
    totalStorage: number;
    storageUsage: number;
    gpu_usage: number
    gpu_temp: number
    totalLxc: number;
    runningLxc: number;
    totalVms: number;
    runningVms: number;
}

export interface vmStatus {
    vmid: string;
    name: string;
    status: string;
    cpuUseage: number;
    memoryUseage: number
}

export interface LxcStatus extends vmStatus {
}

export interface QemuStatus extends vmStatus {
}