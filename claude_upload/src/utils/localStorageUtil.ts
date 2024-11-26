export interface Scan {
    url: string;
    virusTotalResult: string;
    customResult: string;
    virusTotalSafetyScore: number;
    customSafetyScore: number;
    date: string;
}

const STORAGE_KEY = 'scanHistory';

export const saveScans = (scans: Scan[]): void => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scans));
};

export const getScans = (): Scan[] => {
    const scans = localStorage.getItem(STORAGE_KEY);
    console.log('Raw scans from localStorage:', scans); // Отладочный вывод
    return scans ? JSON.parse(scans) : [];
};

export const addScan = (scan: Scan): void => {
    const scans = getScans();
    scans.unshift(scan);
    console.log('Scans after adding new scan:', scans); // Отладочный вывод
    saveScans(scans);
};