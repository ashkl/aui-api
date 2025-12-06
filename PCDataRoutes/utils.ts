interface SensorData {
  SensorId?: string;
  Value?: string;
  Text?: string;
  ImageURL?: string;
  Children?: SensorData[];
}

// Helper function to find a sensor by SensorId
function findSensor(data: SensorData, sensorId: string): SensorData | null {
  if (data.SensorId === sensorId) {
    return data;
  }
  if (data.Children) {
    for (const child of data.Children) {
      const found = findSensor(child, sensorId);
      if (found) return found;
    }
  }
  return null;
}

// Helper function to find all sensors matching a pattern
function findAllSensors(data: SensorData, pattern: RegExp): SensorData[] {
  const results: SensorData[] = [];
  if (data.SensorId && pattern.test(data.SensorId)) {
    results.push(data);
  }
  if (data.Children) {
    for (const child of data.Children) {
      results.push(...findAllSensors(child, pattern));
    }
  }
  return results;
}

// Helper function to find the NVMe drive name by traversing up the tree
function findDriveName(
  data: SensorData,
  targetSensorId: string,
  currentPath: SensorData[] = []
): string | null {
  const newPath = [...currentPath, data];

  if (data.SensorId === targetSensorId) {
    // Found the sensor, now traverse up to find the drive name
    // The drive name is typically 2-3 levels up
    for (let i = newPath.length - 1; i >= 0; i--) {
      const node = newPath[i];
      // Look for a node that has an ImageURL indicating it's a drive (hdd.png)
      if (node.ImageURL && node.ImageURL.includes("hdd.png") && node.Text) {
        return node.Text;
      }
    }
    return null;
  }

  if (data.Children) {
    for (const child of data.Children) {
      const found = findDriveName(child, targetSensorId, newPath);
      if (found) return found;
    }
  }

  return null;
}

// Helper function to extract percentage value from string like "74.6 %"
function extractPercentage(value: string | undefined): number | null {
  if (!value) return null;
  const match = value.match(/(\d+\.?\d*)/);
  return match ? parseFloat(match[1]) : null;
}

// Helper function to extract GB value from string like "300128.0 GB" or "19.9 GB"
function extractGB(value: string | undefined): number | null {
  if (!value) return null;
  const match = value.match(/(\d+\.?\d*)\s*GB/i);
  return match ? parseFloat(match[1]) : null;
}

// Helper function to find all sensors under a specific drive (NVMe or HDD/SSD)
function findSensorsByDriveIndex(
  data: SensorData,
  driveType: string,
  driveIndex: string
): SensorData[] {
  const results: SensorData[] = [];
  const pattern = new RegExp(`^/${driveType}/${driveIndex}/`);

  if (data.SensorId && pattern.test(data.SensorId)) {
    results.push(data);
  }

  if (data.Children) {
    for (const child of data.Children) {
      results.push(...findSensorsByDriveIndex(child, driveType, driveIndex));
    }
  }

  return results;
}

export async function fetchPCData(hostname: string) {
  // Ensure port 8085 is included if not already specified
  const hostWithPort = hostname.includes(":") ? hostname : `${hostname}:8085`;
  const response = await fetch(`http://${hostWithPort}/data.json`);
  if (!response.ok) {
    throw new Error(`Failed to fetch data from ${hostname}`);
  }

  const data: SensorData = await response.json();

  // Extract only the required sensors
  const cpuTemp = findSensor(data, "/amdcpu/0/temperature/2");
  const cpuLoad = findSensor(data, "/amdcpu/0/load/0");
  const ramUsage = findSensor(data, "/ram/load/0");
  const gpuCoreTemp = findSensor(data, "/gpu-nvidia/0/temperature/0");
  const gpuCoreLoad = findSensor(data, "/gpu-nvidia/0/load/0");

  // Find all storage drive usage sensors (NVMe, SSD, HDD, and Disk)
  const nvmeUsageSensors = findAllSensors(data, /^\/nvme\/\d+\/load\/0$/);
  const ssdUsageSensors = findAllSensors(data, /^\/ssd\/\d+\/load\/0$/);
  const hddUsageSensors = findAllSensors(data, /^\/hdd\/\d+\/load\/0$/);
  const diskUsageSensors = findAllSensors(data, /^\/disk\/\d+\/load\/0$/);

  // Combine all drive sensors
  const allDriveSensors = [
    ...nvmeUsageSensors,
    ...ssdUsageSensors,
    ...hddUsageSensors,
    ...diskUsageSensors,
  ];

  const ssds = allDriveSensors.map((sensor) => {
    const usedPercentage = extractPercentage(sensor.Value);

    // Extract drive type and index from sensor ID
    const nvmeMatch = sensor.SensorId?.match(/\/(nvme)\/(\d+)\//);
    const ssdMatch = sensor.SensorId?.match(/\/(ssd)\/(\d+)\//);
    const hddMatch = sensor.SensorId?.match(/\/(hdd)\/(\d+)\//);
    const diskMatch = sensor.SensorId?.match(/\/(disk)\/(\d+)\//);

    const match = nvmeMatch || ssdMatch || hddMatch || diskMatch;
    const driveType = match?.[1] || "unknown";
    const driveIndex = match?.[2];

    // Find the drive name by traversing up the tree
    const driveName = sensor.SensorId
      ? findDriveName(data, sensor.SensorId)
      : null;

    // Try to find available space in GB by looking for related sensors
    let availableGB: number | null = null;
    let totalGB: number | null = null;

    if (driveIndex !== undefined) {
      // Look for sensors that might contain capacity information
      // Search for sensors with "Available" or "Free" in their text under this drive
      const driveSensors = findSensorsByDriveIndex(data, driveType, driveIndex);

      // Look for sensors that might have available space or total capacity
      for (const driveSensor of driveSensors) {
        const text = driveSensor.Text?.toLowerCase() || "";
        const value = driveSensor.Value;

        // Look for available/free space sensors
        if ((text.includes("available") || text.includes("free")) && value) {
          const gbValue = extractGB(value);
          if (gbValue !== null) {
            availableGB = gbValue;
          }
        }

        // Look for total capacity sensors
        if ((text.includes("total") || text.includes("capacity")) && value) {
          const gbValue = extractGB(value);
          if (gbValue !== null) {
            totalGB = gbValue;
          }
        }
      }

      // If we have total capacity and used percentage, calculate available space
      if (totalGB === null && usedPercentage !== null) {
        // Try to infer total capacity from drive name (e.g., "2TB SSD" = ~2000 GB, "2048G" = 2048 GB)
        if (driveName) {
          const tbMatch = driveName.match(/(\d+)\s*TB/i);
          const gbMatch =
            driveName.match(/(\d+)\s*GB/i) || driveName.match(/(\d+)G/i);

          if (tbMatch) {
            totalGB = parseFloat(tbMatch[1]) * 1000; // Convert TB to GB (approximate)
          } else if (gbMatch) {
            totalGB = parseFloat(gbMatch[1]);
          }
        }
      }

      // Calculate available space if we have total capacity and used percentage
      if (totalGB !== null && usedPercentage !== null && availableGB === null) {
        const usedGB = (totalGB * usedPercentage) / 100;
        availableGB = totalGB - usedGB;
      }
    }

    return {
      name:
        driveName || `${driveType.toUpperCase()} ${driveIndex || "Unknown"}`,
      used: sensor.Value || null,
      usedPercentage: usedPercentage,
      availableGB: availableGB !== null ? `${availableGB.toFixed(1)} GB` : null,
    };
  });

  return {
    cpuTemp: cpuTemp?.Value || null,
    cpuLoad: cpuLoad?.Value || null,
    ramUsage: ramUsage?.Value || null,
    gpuCoreTemp: gpuCoreTemp?.Value || null,
    gpuCoreLoad: gpuCoreLoad?.Value || null,
    ssds: ssds,
  };
}
