export interface poolStatus {
    name: string;
    path: string;
    status: string;
    totalSpace: number;
    freeSpace: number;
    usedSpace: number;
    usagePercentage: number;
}
