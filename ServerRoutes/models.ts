export interface baseStatus {
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
    totalLxc: number;
    runningLxc: number;
    totalVms: number;
    runningVms: number;
}


export interface ProdStatus extends baseStatus {
    gpu: {
        gpu_3d: number;
        gpu_video: number;
        gpu_video_enhance: number;
    }
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