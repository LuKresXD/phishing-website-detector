import { motion } from 'framer-motion';
import ScanResultCard from './ScanResultCard';

interface ResultsDisplayProps {
    virusTotalResult: string;
    customResult: string;
    virusTotalSafetyScore: number;
    customSafetyScore: number;
    scannedUrl: string;
    isLoading: {
        virusTotal: boolean;
        customModel: boolean;
    };
    hasScanned: boolean;
}

export default function ResultsDisplay({
                                           virusTotalResult,
                                           customResult,
                                           virusTotalSafetyScore,
                                           customSafetyScore,
                                           scannedUrl,
                                           isLoading,
                                           hasScanned
                                       }: ResultsDisplayProps) {
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2
            }
        }
    };

    return (
        <motion.div
            className='w-full max-w-6xl mx-auto px-4'
            initial="hidden"
            animate="visible"
            variants={containerVariants}
        >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ScanResultCard
                    title="VirusTotal Scan"
                    result={virusTotalResult}
                    safetyScore={virusTotalSafetyScore}
                    scannedUrl={scannedUrl}
                    isLoading={isLoading.virusTotal}
                    hasScanned={hasScanned}
                />
                <ScanResultCard
                    title="My Own Model Scan"
                    result={customResult}
                    safetyScore={customSafetyScore}
                    scannedUrl={scannedUrl}
                    isLoading={isLoading.customModel}
                    hasScanned={hasScanned}
                />
            </div>
        </motion.div>
    );
}