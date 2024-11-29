import Card from './ui/Card';
import Progress from './ui/Progress';
import { motion } from 'framer-motion';

interface ScanResultCardProps {
    title: string;
    result: string;
    safetyScore: number;
    scannedUrl: string;
}

export default function ScanResultCard({
                                           title,
                                           result,
                                           safetyScore,
                                           scannedUrl
                                       }: ScanResultCardProps) {
    return (
        <Card className="h-full">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="h-full"
            >
                <h2 className="text-2xl font-bold text-blue-300 mb-6">{title}</h2>
                <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                        <p className="text-blue-100 text-xl py-1">Result:</p>
                        <p className="text-blue-500 font-bold text-4xl font-poppins py-1 truncate">
                            {result}
                        </p>
                        <div className="text-blue-100/50 text-lg font-poppins py-2 truncate" title={scannedUrl}>
                            {scannedUrl || 'No URL scanned'}
                        </div>
                    </div>
                    <div className="flex-shrink-0">
                        <Progress
                            value={safetyScore}
                            size="lg"
                            className="min-w-[96px]"
                        />
                    </div>
                </div>
            </motion.div>
        </Card>
    );
}