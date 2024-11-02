export interface baseDrive {
  name: string;
  totalSpace: number;
  freeSpace: number;
  usedSpace: number;
  usagePercentage: number;
}

export interface poolStatus extends baseDrive {
  path: string;
  status: string;
}
