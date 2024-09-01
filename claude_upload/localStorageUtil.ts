export interface Scan {
    url: string;
    result: string;
    safetyScore: number;
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
    scans.unshift(scan);
    saveScans(scans);
};

export const clearScans = (): void => {
    localStorage.removeItem(STORAGE_KEY);
};