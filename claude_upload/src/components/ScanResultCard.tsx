import { motion } from 'framer-motion';
import Card from './ui/Card';
import Progress from './ui/Progress';

interface ScanResultCardProps {
    title: string;
    result: string;
    safetyScore: number;
    scannedUrl: string;
    isLoading?: boolean;
    hasScanned?: boolean;
}

export default function ScanResultCard({
                                           title,
                                           result,
                                           safetyScore,
                                           scannedUrl,
                                           isLoading = false,
                                           hasScanned = false
                                       }: ScanResultCardProps) {
    const cardVariants = {
        hidden: {
            opacity: 0,
            y: 20,
            scale: 0.95
        },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
                duration: 0.4,
                ease: [0.23, 1, 0.32, 1]
            }
        }
    };

    const contentVariants = {
        hidden: {
            opacity: 0,
            transition: {
                duration: 0.1
            }
        },
        visible: {
            opacity: 1,
            transition: {
                duration: 0.3,
                ease: "easeOut"
            }
        }
    };

    return (
        <Card className="h-full">
            <motion.div
                initial="hidden"
                animate="visible"
                variants={cardVariants}
                className="h-full relative overflow-hidden"
            >
                <motion.div
                    variants={contentVariants}
                    initial={isLoading ? "hidden" : "visible"}
                    animate="visible"
                >
                    <h2 className="text-2xl font-bold text-blue-300 mb-6">{title}</h2>
                    <div className="flex justify-between items-start gap-4">
                        <div className="flex-1 min-w-0">
                            <p className="text-blue-100 text-xl py-1">Result:</p>
                            {!hasScanned ? (
                                <p className="text-blue-500 font-bold text-4xl font-poppins py-1">
                                    Waiting for URL...
                                </p>
                            ) : (
                                <p className={`text-blue-500 font-bold text-4xl font-poppins py-1 truncate
                                    ${isLoading ? 'animate-pulse' : ''}`}
                                >
                                    {isLoading ? 'Analyzing...' : result}
                                </p>
                            )}
                            <div
                                className={`text-blue-100/50 text-lg font-poppins py-2 truncate
                                    ${!hasScanned ? '' : isLoading ? 'animate-pulse' : ''}`}
                                title={scannedUrl}
                            >
                                {!hasScanned ? (
                                    'Enter a URL above to scan'
                                ) : isLoading ? (
                                    'Scanning URL...'
                                ) : (
                                    scannedUrl || 'No URL scanned'
                                )}
                            </div>
                        </div>
                        <div className="flex-shrink-0">
                            <Progress
                                value={safetyScore}
                                size="lg"
                                className="min-w-[96px]"
                                isLoading={isLoading}
                                isIdle={!hasScanned}
                            />
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </Card>
    );
}