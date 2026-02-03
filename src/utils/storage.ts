import { gzip, ungzip } from 'pako';

export interface ImpactArrow {
  id: string;
  x: number;
  y: number;
  rotation: number;
}

export interface VehicleData {
  policyholder: {
    surname: string;
    firstname: string;
    address: string;
    postalCode: string;
    country: string;
    phoneEmail: string;
  };
  vehicle: {
    vehicleType: 'vehicle' | 'trailer';
    make: string;
    model: string;
    registrationNumber: string;
    countryOfRegistration: string;
  };
  insurance: {
    insuranceCompanyName: string;
    policyNumber: string;
    greenCardNumber: string;
    greenCardValidFrom: string;
    greenCardValidTo: string;
    branch: string;
    branchAddress: string;
    branchCountry: string;
    branchPhone: string;
    comprehensiveInsurance: string;
  };
  driver: {
    surname: string;
    firstname: string;
    dateOfBirth: string;
    address: string;
    country: string;
    phone: string;
    licenceNumber: string;
    licenceCategory: string;
    licenceValidUntil: string;
  };
  impactMarkers: ImpactArrow[];
  visibleDamage: string;
  circumstances: {
    parked: boolean;
    stopped: boolean;
    openedDoor: boolean;
    parking: boolean;
    leavingParkingArea: boolean;
    enteringParkingArea: boolean;
    enteringRoundabout: boolean;
    drivingRoundabout: boolean;
    rearEndCollision: boolean;
    drivingParallel: boolean;
    changingLanes: boolean;
    overtaking: boolean;
    turningRight: boolean;
    turningLeft: boolean;
    reversing: boolean;
    enteredOppositeLane: boolean;
    comingFromRight: boolean;
    failedToYield: boolean;
  };
  additionalNotes: string;
}

export interface VehicleTemplate {
  id?: number;
  name: string;
  vehicleLabel: 'vehicleA' | 'vehicleB';
  data: VehicleData;
  createdAt: string;
}

// Storage and data utilities
export interface AccidentReport {
  section1: {
    dateOfAccident: string;
    timeOfAccident: string;
    state: string;
    city: string;
    location: string;
  };
  section2: {
    injuries: string; // 'yes' | 'no' | ''
    damageOtherVehicles: string; // 'yes' | 'no' | ''
    damageOtherItems: string; // 'yes' | 'no' | ''
    witnesses: string;
  };
  vehicleA: VehicleData & { createdAt?: string };
  vehicleB: VehicleData & { createdAt?: string };
  signatures: {
    driverA: string; // Base64 encoded image data or empty string
    driverB: string; // Base64 encoded image data or empty string
  };
  createdAt: string;
}

// LocalStorage and IndexedDB utilities
const DB_NAME = 'AccidentReportDB';
const TEMPLATE_STORE_NAME = 'vehicleTemplates';
const IMPACT_MARKER_STORE_NAME = 'impactMarkerImages';
const DB_VERSION = 12;

export const initializeDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('initializeDB error:', request.error);
      reject(request.error);
    };
    request.onsuccess = () => {
      console.log('Database initialized successfully');
      resolve(request.result);
    };
    request.onupgradeneeded = (event) => {
      console.log('Database upgrade needed');
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(TEMPLATE_STORE_NAME)) {
        console.log('Creating TEMPLATE_STORE_NAME');
        db.createObjectStore(TEMPLATE_STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains(IMPACT_MARKER_STORE_NAME)) {
        console.log('Creating IMPACT_MARKER_STORE_NAME');
        db.createObjectStore(IMPACT_MARKER_STORE_NAME);
      }
    };
  });
};

// QR Code compression for full accident reports
export const compressReport = (report: AccidentReport): string => {
  const compressed = JSON.stringify(report);
  return btoa(compressed); // Base64 encoding
};

export const decompressReport = (compressed: string): AccidentReport => {
  const json = atob(compressed);
  return JSON.parse(json);
};

// Vehicle Template utilities
export const saveVehicleTemplate = async (template: VehicleTemplate): Promise<number> => {
  const db = await initializeDB();
  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction([TEMPLATE_STORE_NAME], 'readwrite');
      const store = transaction.objectStore(TEMPLATE_STORE_NAME);
      const templateToSave = { ...template, createdAt: new Date().toISOString() };
      const request = store.add(templateToSave);

      request.onerror = () => {
        console.error('saveVehicleTemplate error:', request.error);
        reject(request.error);
      };
      request.onsuccess = () => {
        console.log('saveVehicleTemplate success');
        resolve(request.result as number);
      };
      
      transaction.onerror = () => {
        console.error('Transaction error:', transaction.error);
        reject(transaction.error);
      };
    } catch (error) {
      console.error('saveVehicleTemplate exception:', error);
      reject(error);
    }
  });
};

export const getVehicleTemplate = async (id: number): Promise<VehicleTemplate | undefined> => {
  const db = await initializeDB();
  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction([TEMPLATE_STORE_NAME], 'readonly');
      const store = transaction.objectStore(TEMPLATE_STORE_NAME);
      const request = store.get(id);

      request.onerror = () => {
        console.error('getVehicleTemplate error:', request.error);
        reject(request.error);
      };
      request.onsuccess = () => {
        console.log('getVehicleTemplate success:', request.result);
        resolve(request.result);
      };
      
      transaction.onerror = () => {
        console.error('Transaction error:', transaction.error);
        reject(transaction.error);
      };
    } catch (error) {
      console.error('getVehicleTemplate exception:', error);
      reject(error);
    }
  });
};

export const getAllVehicleTemplates = async (): Promise<VehicleTemplate[]> => {
  const db = await initializeDB();
  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction([TEMPLATE_STORE_NAME], 'readonly');
      const store = transaction.objectStore(TEMPLATE_STORE_NAME);
      const request = store.getAll();

      let resolved = false;

      request.onerror = () => {
        console.error('getAllVehicleTemplates error:', request.error);
        if (!resolved) {
          resolved = true;
          reject(request.error);
        }
      };
      request.onsuccess = () => {
        console.log('getAllVehicleTemplates success:', request.result);
        if (!resolved) {
          resolved = true;
          resolve(request.result);
        }
      };
      
      transaction.oncomplete = () => {
        console.log('getAllVehicleTemplates transaction complete');
      };
      
      transaction.onerror = () => {
        console.error('Transaction error:', transaction.error);
        if (!resolved) {
          resolved = true;
          reject(transaction.error);
        }
      };
    } catch (error) {
      console.error('getAllVehicleTemplates exception:', error);
      reject(error);
    }
  });
};

export const deleteVehicleTemplate = async (id: number): Promise<void> => {
  const db = await initializeDB();
  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction([TEMPLATE_STORE_NAME], 'readwrite');
      const store = transaction.objectStore(TEMPLATE_STORE_NAME);
      const request = store.delete(id);

      request.onerror = () => {
        console.error('deleteVehicleTemplate error:', request.error);
        reject(request.error);
      };
      request.onsuccess = () => {
        console.log('deleteVehicleTemplate success');
        resolve();
      };
      
      transaction.onerror = () => {
        console.error('Transaction error:', transaction.error);
        reject(transaction.error);
      };
    } catch (error) {
      console.error('deleteVehicleTemplate exception:', error);
      reject(error);
    }
  });
};

export const compressVehicleData = (data: VehicleData): string => {
  // 4-char identifier: 'SDON' (Sprava Dopravnej Nehody - Slovak for Accident Report)
  const IDENTIFIER = 'SDON';
  
  // Minimize data for better compression with Gzip
  // Using numeric section IDs to match form structure: 6=policyholder, 7=vehicle, 8=insurance, 9=driver, 10=impactMarkers, 11=visibleDamage, 12=circumstances, 14=additionalNotes
  
  // Compress impact markers: round coordinates to integers and use sequential IDs
  const compressedImpactMarkers = data.impactMarkers.map((arrow, index) => ({
    i: index + 1, // Sequential ID (1, 2, 3...)
    x: Math.round(arrow.x),
    y: Math.round(arrow.y),
    r: Math.round(arrow.rotation),
  }));
  
  const minimal = {
    "6": {
      "a": data.policyholder.surname,
      "b": data.policyholder.firstname,
      "c": data.policyholder.address,
      "d": data.policyholder.postalCode,
      "e": data.policyholder.country,
      "f": data.policyholder.phoneEmail,
    },
    "7": {
      "a": data.vehicle.vehicleType,
      "b": data.vehicle.make,
      "c": data.vehicle.model,
      "d": data.vehicle.registrationNumber,
      "e": data.vehicle.countryOfRegistration,
    },
    "8": {
      "a": data.insurance.insuranceCompanyName,
      "b": data.insurance.policyNumber,
      "c": data.insurance.greenCardNumber,
      "d": data.insurance.greenCardValidFrom,
      "e": data.insurance.greenCardValidTo,
      "f": data.insurance.branch,
      "g": data.insurance.branchAddress,
      "h": data.insurance.branchCountry,
      "i": data.insurance.branchPhone,
      "j": data.insurance.comprehensiveInsurance,
    },
    "9": {
      "a": data.driver.surname,
      "b": data.driver.firstname,
      "c": data.driver.dateOfBirth,
      "d": data.driver.address,
      "e": data.driver.country,
      "f": data.driver.phone,
      "g": data.driver.licenceNumber,
      "h": data.driver.licenceCategory,
      "i": data.driver.licenceValidUntil,
    },
    "10": compressedImpactMarkers,
    "11": data.visibleDamage,
    // Compress circumstances to a bit string
    "12": Object.values(data.circumstances).map(v => v ? '1' : '0').join(''),
    "14": data.additionalNotes,
  };
  
  const json = JSON.stringify(minimal);
  const compressed = gzip(json);
  // Convert binary to base64 for QR code
  const base64Data = btoa(String.fromCharCode.apply(null, Array.from(compressed)));
  // Add identifier prefix
  return IDENTIFIER + base64Data;
};

export const decompressVehicleData = (compressed: string): VehicleData => {
  // Strip the 4-char identifier prefix
  const IDENTIFIER = 'SDON';
  if (!compressed.startsWith(IDENTIFIER)) {
    throw new Error('Invalid QR code data: wrong identifier');
  }
  const base64Data = compressed.substring(IDENTIFIER.length);
  
  // Convert base64 back to binary
  const binary = atob(base64Data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  // Decompress gzip
  const json = ungzip(bytes, { to: 'string' });
  const data = JSON.parse(json);
  
  // Reconstruct policyholder object from section 6 (keys a-f)
  const sec6 = data["6"] || {};
  const policyholder = {
    surname: sec6.a || '',
    firstname: sec6.b || '',
    address: sec6.c || '',
    postalCode: sec6.d || '',
    country: sec6.e || '',
    phoneEmail: sec6.f || '',
  };
  
  // Reconstruct vehicle object from section 7 (keys a-e)
  const sec7 = data["7"] || {};
  const vehicle = {
    vehicleType: (sec7.a || 'vehicle') as 'vehicle' | 'trailer',
    make: sec7.b || '',
    model: sec7.c || '',
    registrationNumber: sec7.d || '',
    countryOfRegistration: sec7.e || '',
  };
  
  // Reconstruct insurance object from section 8 (keys a-j)
  const sec8 = data["8"] || {};
  const insurance = {
    insuranceCompanyName: sec8.a || '',
    policyNumber: sec8.b || '',
    greenCardNumber: sec8.c || '',
    greenCardValidFrom: sec8.d || '',
    greenCardValidTo: sec8.e || '',
    branch: sec8.f || '',
    branchAddress: sec8.g || '',
    branchCountry: sec8.h || '',
    branchPhone: sec8.i || '',
    comprehensiveInsurance: sec8.j || '',
  };
  
  // Reconstruct driver object from section 9 (keys a-i)
  const sec9 = data["9"] || {};
  const driver = {
    surname: sec9.a || '',
    firstname: sec9.b || '',
    dateOfBirth: sec9.c || '',
    address: sec9.d || '',
    country: sec9.e || '',
    phone: sec9.f || '',
    licenceNumber: sec9.g || '',
    licenceCategory: sec9.h || '',
    licenceValidUntil: sec9.i || '',
  };
  
  // Restore impact markers from section 10 (sequential IDs with coordinates)
  const impactMarkers = (data["10"] || []).map((arrow: any) => ({
    id: `marker-${arrow.i}-${Date.now()}`,
    x: arrow.x || 0,
    y: arrow.y || 0,
    rotation: arrow.r || 0,
  }));
  
  // Reconstruct circumstances object from section 12 bit string
  const circumstancesStr = data["12"] || '010101010101010101';
  const circumstances = {
    parked: circumstancesStr[0] === '1',
    stopped: circumstancesStr[1] === '1',
    openedDoor: circumstancesStr[2] === '1',
    parking: circumstancesStr[3] === '1',
    leavingParkingArea: circumstancesStr[4] === '1',
    enteringParkingArea: circumstancesStr[5] === '1',
    enteringRoundabout: circumstancesStr[6] === '1',
    drivingRoundabout: circumstancesStr[7] === '1',
    rearEndCollision: circumstancesStr[8] === '1',
    drivingParallel: circumstancesStr[9] === '1',
    changingLanes: circumstancesStr[10] === '1',
    overtaking: circumstancesStr[11] === '1',
    turningRight: circumstancesStr[12] === '1',
    turningLeft: circumstancesStr[13] === '1',
    reversing: circumstancesStr[14] === '1',
    enteredOppositeLane: circumstancesStr[15] === '1',
    comingFromRight: circumstancesStr[16] === '1',
    failedToYield: circumstancesStr[17] === '1',
  };
  
  return {
    policyholder,
    vehicle,
    insurance,
    driver,
    impactMarkers,
    visibleDamage: data["11"] || '',
    circumstances,
    additionalNotes: data["14"] || '',
  };
};

export const exportVehicleJSON = (data: VehicleData, label: string): void => {
  const dataStr = JSON.stringify(data, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `vehicle_${label}_${new Date().getTime()}.json`;
  link.click();
  URL.revokeObjectURL(url);
};

// Split vehicle data into multiple QR codes when data is too large
export const splitVehicleDataIntoQRs = (vehicleData: VehicleData, partCount: number): string[] => {
  const compressed = compressVehicleData(vehicleData);
  
  // If requesting only 1 part or data already fits, return as-is
  if (partCount <= 1) {
    return [compressed];
  }
  
  // Calculate size per part - divide data equally among parts
  const baseSize = Math.floor(compressed.length / partCount);
  
  const parts: string[] = [];
  let currentIndex = 0;
  
  for (let i = 1; i <= partCount; i++) {
    const isLastPart = i === partCount;
    const sliceSize = isLastPart 
      ? compressed.length - currentIndex 
      : baseSize;
    
    const dataPart = compressed.substring(currentIndex, currentIndex + sliceSize);
    const partMarker = `[${i}/${partCount}]`;
    const qrData = partMarker + dataPart;
    
    parts.push(qrData);
    currentIndex += sliceSize;
  }
  
  return parts;
};

// Reconstruct vehicle data from split QR parts
export const reconstructFromQRParts = (parts: string[]): VehicleData | null => {
  try {
    const sortedParts = parts.map(part => {
      const match = part.match(/^\[(\d+)\/(\d+)\](.*)$/);
      if (!match) return null;
      return {
        index: parseInt(match[1]),
        total: parseInt(match[2]),
        data: match[3]
      };
    }).filter((p): p is {index: number; total: number; data: string} => p !== null);
    
    if (sortedParts.length === 0) return null;
    
    const total = sortedParts[0].total;
    if (sortedParts.length !== total) return null;
    
    const reconstructed = sortedParts
      .sort((a, b) => a.index - b.index)
      .map(p => p.data)
      .join('');
    
    return decompressVehicleData(reconstructed);
  } catch (error) {
    console.error('Failed to reconstruct from QR parts:', error);
    return null;
  }
};

// ===== Impact Marker Images Storage =====
// Separate storage for large base64 image data to keep form data clean
// Note: IMPACT_MARKER_STORE_NAME is defined above with other DB constants

/**
 * Store impact marker image in IndexedDB
 * @param vehicleLabel 'vehicleA' or 'vehicleB'
 * @param imageData base64 PNG data URL
 */
export const saveImpactMarkerImage = async (vehicleLabel: 'vehicleA' | 'vehicleB', imageData: string): Promise<void> => {
  try {
    const db = await initializeDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([IMPACT_MARKER_STORE_NAME], 'readwrite');
      const store = transaction.objectStore(IMPACT_MARKER_STORE_NAME);
      
      const data = {
        vehicleLabel,
        imageData,
        savedAt: new Date().toISOString(),
      };
      
      // Use vehicleLabel as key to replace any existing image
      const request = store.put(data, vehicleLabel);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to save impact marker image:', error);
    throw error;
  }
};

/**
 * Retrieve impact marker image from IndexedDB
 * @param vehicleLabel 'vehicleA' or 'vehicleB'
 * @returns base64 PNG data URL or null if not found
 */
export const getImpactMarkerImage = async (vehicleLabel: 'vehicleA' | 'vehicleB'): Promise<string | null> => {
  try {
    const db = await initializeDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([IMPACT_MARKER_STORE_NAME], 'readonly');
      const store = transaction.objectStore(IMPACT_MARKER_STORE_NAME);
      const request = store.get(vehicleLabel);
      
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.imageData : null);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to retrieve impact marker image:', error);
    return null;
  }
};

/**
 * Delete impact marker image from IndexedDB
 * @param vehicleLabel 'vehicleA' or 'vehicleB'
 */
export const deleteImpactMarkerImage = async (vehicleLabel: 'vehicleA' | 'vehicleB'): Promise<void> => {
  try {
    const db = await initializeDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([IMPACT_MARKER_STORE_NAME], 'readwrite');
      const store = transaction.objectStore(IMPACT_MARKER_STORE_NAME);
      const request = store.delete(vehicleLabel);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to delete impact marker image:', error);
    throw error;
  }
};

/**
 * Clear all impact marker images from IndexedDB
 */
export const clearAllImpactMarkerImages = async (): Promise<void> => {
  try {
    const db = await initializeDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([IMPACT_MARKER_STORE_NAME], 'readwrite');
      const store = transaction.objectStore(IMPACT_MARKER_STORE_NAME);
      const request = store.clear();
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to clear impact marker images:', error);
    throw error;
  }
};
