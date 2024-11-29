import { motion } from 'framer-motion';
import ScanResultCard from './ScanResultCard';

interface ResultsDisplayProps {
    virusTotalResult: string;
    customResult: string;
    virusTotalSafetyScore: number;
    customSafetyScore: number;
    scannedUrl: string;
    isLoading: boolean;
}

export default function ResultsDisplay({
                                           virusTotalResult,
                                           customResult,
                                           virusTotalSafetyScore,
                                           customSafetyScore,
                                           scannedUrl,
                                           isLoading
                                       }: ResultsDisplayProps) {
    return (
        <div className="w-full max-w-6xl mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ScanResultCard
                    title="VirusTotal Scan"
                    result={virusTotalResult}
                    safetyScore={virusTotalSafetyScore}
                    scannedUrl={scannedUrl}
                />

                <ScanResultCard
                    title="My Own Model Scan"
                    result={customResult}
                    safetyScore={customSafetyScore}
                    scannedUrl={scannedUrl}
                />
            </div>
        </div>
    );
}