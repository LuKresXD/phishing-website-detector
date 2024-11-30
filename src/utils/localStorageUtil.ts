export interface Scan {
    url: string;
    virusTotalResult: string;
    customResult: string;
    virusTotalSafetyScore: number;
    customSafetyScore: number;
    date: string;
}

const STORAGE_KEY = 'scanHistory';

export const getScans = (): Scan[] => {
    try {
        const scans = localStorage.getItem(STORAGE_KEY);
        return scans ? JSON.parse(scans) : [];
    } catch (error) {
        console.error('Error reading scan history:', error);
        return [];
    }
};

export const addScan = (scan: Scan): void => {
    try {
        const scans = getScans();
        scans.unshift(scan); // Add new scan at the beginning

        // Keep only the last 100 scans to prevent storage issues
        const trimmedScans = scans.slice(0, 100);

        localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmedScans));
    } catch (error) {
        console.error('Error saving scan:', error);
    }
};

export const clearScans = (): void => {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
        console.error('Error clearing scan history:', error);
    }
};