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

export default function Home() {
    // State management with separate loading states
    const [vtLoading, setVtLoading] = useState(false);
    const [mlLoading, setMlLoading] = useState(false);
    const [scanState, setScanState] = useState({
        virusTotalResult: 'Enter website',
        customResult: 'Enter website',
        virusTotalSafetyScore: 100,
        customSafetyScore: 100,
        scannedUrl: ''
    });
    const [error, setError] = useState<string | null>(null);
    const [hasScanned, setHasScanned] = useState(false);

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
        setHasScanned(true);
        setVtLoading(true);
        setMlLoading(true);
        setError(null);

        const finalUrl = url.startsWith('http://') || url.startsWith('https://')
            ? url
            : `http://${url}`;

        // Set initial state with the URL immediately
        setScanState(prev => ({
            ...prev,
            scannedUrl: finalUrl
        }));

        // Run ML model scan
        axios.post('/api/customScan', { url: finalUrl }, { timeout: 30000 })
            .then(customResponse => {
                if (customResponse.data?.safetyScore) {
                    setScanState(prev => ({
                        ...prev,
                        customSafetyScore: customResponse.data.safetyScore,
                        customResult: customResponse.data.result
                    }));
                }
            })
            .catch(error => {
                console.error('ML scan error:', error);
                setScanState(prev => ({
                    ...prev,
                    customResult: 'Error occurred',
                    customSafetyScore: 0
                }));
            })
            .finally(() => {
                setMlLoading(false);
            });

        // Run VirusTotal scan
        try {
            const vtScanId = await sendUrlToVirusTotal(finalUrl);
            const vtResult = await waitForAnalysisCompletion(vtScanId);
            const vtScore = Math.max(
                Number(
                    (100 - (vtResult.data.attributes.stats.malicious * 5 +
                            vtResult.data.attributes.stats.suspicious * 3) / 92 * 100
                    ).toFixed(1)
                ),
                0.1
            );

            setScanState(prev => ({
                ...prev,
                virusTotalSafetyScore: vtScore,
                virusTotalResult: vtScore < 50 ? 'Dangerous' : vtScore < 80 ? 'Moderate' : 'Safe'
            }));

            // Save scan history only after both scans complete
            const scanData = {
                url: finalUrl,
                virusTotalResult: vtScore < 50 ? 'Dangerous' : vtScore < 80 ? 'Moderate' : 'Safe',
                customResult: scanState.customResult,
                virusTotalSafetyScore: vtScore,
                customSafetyScore: scanState.customSafetyScore,
                date: new Date().toISOString()
            };
            addScan(scanData);

        } catch (error) {
            console.error('VirusTotal scan error:', error);
            setScanState(prev => ({
                ...prev,
                virusTotalResult: 'Error occurred',
                virusTotalSafetyScore: 0
            }));
            setError(error instanceof Error ? error.message : 'An unexpected error occurred');
        } finally {
            setVtLoading(false);
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
                <h1 className='font-bold sm:text-6xl text-4xl font-poppins text-center text-text mt-8 mb-6'>
                    <span className="text-blue-500">Phishing</span>
                    <span className="text-blue-100"> Website Detector 🕵️‍♂</span>
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
                        isLoading={vtLoading || mlLoading}
                    />
                </div>

                <ResultsDisplay
                    virusTotalResult={scanState.virusTotalResult}
                    customResult={scanState.customResult}
                    virusTotalSafetyScore={scanState.virusTotalSafetyScore}
                    customSafetyScore={scanState.customSafetyScore}
                    scannedUrl={scanState.scannedUrl}
                    isLoading={{
                        virusTotal: vtLoading,
                        customModel: mlLoading
                    }}
                    hasScanned={hasScanned}
                />

                <ModelInfo/>
            </motion.div>
        </Layout>
    );
}