import { useState } from 'react';
import { useInView } from 'react-intersection-observer';
import { motion } from "framer-motion";
import Typewriter from 'typewriter-effect';
import axios from 'axios';
import Layout from "@/components/layout/Layout";
import UrlScanner from "@/components/UrlScanner";
import ResultsDisplay from "@/components/ResultsDisplay";
import ModelInfo from "@/components/ModelInfo";
import { addScan } from '@/utils/localStorageUtil';
import ErrorDisplay from '@/components/ui/ErrorDisplay';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

// Interface for the scan state
interface ScanState {
    virusTotalResult: string;
    customResult: string;
    virusTotalSafetyScore: number;
    customSafetyScore: number;
    scannedUrl: string;
}

export default function Home() {
    // State management
    const [isLoading, setIsLoading] = useState(false);
    const [scanState, setScanState] = useState<ScanState>({
        virusTotalResult: 'Enter website',
        customResult: 'Enter website',
        virusTotalSafetyScore: 100,
        customSafetyScore: 100,
        scannedUrl: ''
    });
    const [error, setError] = useState<string | null>(null);

    // Intersection observer for animations
    const [ref, inView] = useInView({
        threshold: 0.1,
        triggerOnce: true,
    });

    // API handlers
    const sendUrlToVirusTotal = async (url: string) => {
        try {
            const response = await axios.post('/api/proxy', { url });
            if (response.data?.data?.id) {
                return response.data.data.id;
            }
            throw new Error('Invalid response from VirusTotal API');
        } catch (error: any) {
            if (error.response?.status === 429) {
                throw new Error('Rate limit exceeded. Please wait a moment before trying again.');
            }
            throw error;
        }
    };

    const waitForAnalysisCompletion = async (analysisId: string) => {
        const maxAttempts = 30;
        const delayBetweenAttempts = 2000;

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const response = await axios.get(`/api/proxy?id=${analysisId}`);
            if (response.data.data.attributes.status === 'completed') {
                return response.data;
            }
            await new Promise(resolve => setTimeout(resolve, delayBetweenAttempts));
        }
        throw new Error('Analysis timed out');
    };

    // Main scan handler
    const handleScanSubmit = async (url: string) => {
        setIsLoading(true);
        setError(null);
        setScanState(prev => ({
            ...prev,
            virusTotalResult: 'Checking...',
            customResult: 'Checking...'
        }));

        try {
            const finalUrl = url.startsWith('http://') || url.startsWith('https://')
                ? url
                : `http://${url}`;

            // Run both scans concurrently
            const [vtScanId, customResponse] = await Promise.all([
                sendUrlToVirusTotal(finalUrl),
                axios.post('/api/customScan', { url: finalUrl }, { timeout: 30000 })
            ]);

            let vtScore = 100;
            let vtResult = 'Safe';
            let scannedUrl = finalUrl;

            // Process VirusTotal results
            if (vtScanId) {
                const vtResponse = await waitForAnalysisCompletion(vtScanId);
                vtScore = Math.max(
                    Number(
                        (100 - (vtResponse.data.attributes.stats.malicious * 5 +
                                vtResponse.data.attributes.stats.suspicious * 3) / 92 * 100
                        ).toFixed(1)
                    ),
                    0.1
                );
                vtResult = vtScore < 50 ? 'Dangerous' : vtScore < 80 ? 'Moderate' : 'Safe';
                scannedUrl = vtResponse.meta.url_info.url || finalUrl;
            }

            // Process custom model results
            const customSafetyScore = customResponse.data.safetyScore;
            const customResult = customResponse.data?.result || 'Safe';

            // Update state with results
            setScanState({
                virusTotalResult: vtResult,
                customResult: customResult,
                virusTotalSafetyScore: vtScore,
                customSafetyScore: customSafetyScore,
                scannedUrl: scannedUrl
            });

            // Save scan history
            const scanData = {
                url: scannedUrl,
                virusTotalResult: vtResult,
                customResult: customResult,
                virusTotalSafetyScore: vtScore,
                customSafetyScore: customSafetyScore,
                date: new Date().toISOString()
            };
            addScan(scanData);

        } catch (error: any) {
            console.error('Scan error:', error);
            setError(error instanceof Error ? error.message : 'An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Layout>
            <motion.div
                className="space-y-8 relative"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                ref={ref}
            >
                {/* Clean loading overlay */}
                {isLoading && (
                    <motion.div
                        className="fixed inset-0 z-50 flex items-center justify-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2 }}
                    >
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
                        <div className="relative z-50 bg-zinc-900/90 rounded-lg p-8 border border-zinc-700/50 shadow-xl">
                            <LoadingSpinner size="lg" />
                            <p className="text-blue-100 mt-4 text-center font-poppins">
                                Scanning website...
                            </p>
                        </div>
                    </motion.div>
                )}

                {/* Main content - no blur or brightness changes */}
                <div className={isLoading ? 'pointer-events-none' : ''}>
                    {/* Title with increased spacing */}
                    <h1 className='font-bold sm:text-6xl text-4xl font-poppins text-center text-text mt-8 mb-6'>
                        <span className="text-blue-500">Phishing</span>
                        <span className="text-blue-100"> Website Detector 🕵️‍</span>
                    </h1>
                    <p className='text-blue-100 text-lg text-center font-poppins mb-8'>
                        {inView && (
                            <Typewriter
                                options={{
                                    delay: 30,
                                    strings: ["Enter a URL below to check if the website is safe."],
                                    loop: false,
                                    autoStart: true,
                                    deleteSpeed: 604800000,
                                }}
                            />
                        )}
                    </p>

                    <div className="space-y-4 mt-8">
                        {error && (
                            <ErrorDisplay
                                message={error}
                                onDismiss={() => setError(null)}
                            />
                        )}
                        <UrlScanner
                            onScanSubmit={handleScanSubmit}
                            isLoading={isLoading}
                        />
                    </div>

                    <ResultsDisplay
                        virusTotalResult={scanState.virusTotalResult}
                        customResult={scanState.customResult}
                        virusTotalSafetyScore={scanState.virusTotalSafetyScore}
                        customSafetyScore={scanState.customSafetyScore}
                        scannedUrl={scanState.scannedUrl}
                        isLoading={isLoading}
                    />

                    <ModelInfo/>
                </div>
            </motion.div>
        </Layout>
    );
}