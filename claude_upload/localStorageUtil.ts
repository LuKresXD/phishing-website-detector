// src/utils/localStorageUtil.ts

export interface Scan {
    url: string;
    virusTotalResult: string;
    customResult: string;
    virusTotalSafetyScore: number | null;
    customSafetyScore: number | null;
    date: string;
}

const STORAGE_KEY = 'scanHistory';

export const saveScans = (scans: Scan[]): void => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scans));
};

export const getScans = (): Scan[] => {
    const scans = localStorage.getItem(STORAGE_KEY);
    return scans ? JSON.parse(scans) : [];
};

export const addScan = (scan: Scan): void => {
    const scans = getScans();
    scans.unshift(scan); // Add new scan to the beginning of the array
    saveScans(scans);
};