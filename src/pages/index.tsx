import Head from 'next/head';
import { useState } from 'react';
import axios from 'axios';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import Navbar from "@/components/Navbar";
import { useInView } from 'react-intersection-observer';
import { motion } from "framer-motion";
import Typewriter from 'typewriter-effect';
import { addScan } from '@/utils/localStorageUtil';

export default function Home() {
    const [isLoading, setIsLoading] = useState(false);
    const [url, setUrl] = useState('https://google.com');
    const [virusTotalResult, setVirusTotalResult] = useState('Enter website');
    const [customResult, setCustomResult] = useState('Enter website');
    const [virusTotalSafetyScore, setVirusTotalSafetyScore] = useState(100);
    const [customSafetyScore, setCustomSafetyScore] = useState(100);
    const [scannedUrl, setScannedUrl] = useState('');

    function handleInput(e: any) {
        setUrl(e.target.value);
    }

    async function handleCheck() {
        setIsLoading(true);
        setVirusTotalResult('Checking...');
        setCustomResult('Checking...');
        const finalUrl = url;
        if (finalUrl) {
            try {
                await checkUrl(finalUrl);
            } catch (error) {
                console.error('Error during URL check:', error);
                setVirusTotalResult('Error');
                setCustomResult('Error');
            }
            setUrl('');
        }
        setIsLoading(false);
    }

    async function checkUrl(checkUrl: string) {
        let vtResult = 'Unknown';
        let vtScore = 0;
        let customScore = 0;
        let customResult = 'Unknown';

        try {
            setIsLoading(true);
            setVirusTotalResult('Checking...');
            setCustomResult('Checking...');

            // VirusTotal scan
            const vtScanId = await sendUrlToVirusTotal(checkUrl);
            if (vtScanId) {
                const virusTotalAnalysisResult = await waitForAnalysisCompletion(vtScanId);
                vtScore = Math.max(Number((100 - (virusTotalAnalysisResult.data.attributes.stats.malicious * 5 + virusTotalAnalysisResult.data.attributes.stats.suspicious * 3) / 92 * 100).toFixed(1)), 0.1);
                vtResult = vtScore < 50 ? 'Dangerous' : vtScore < 80 ? 'Moderate' : 'Safe';
                setVirusTotalSafetyScore(vtScore);
                setScannedUrl(virusTotalAnalysisResult.meta.url_info.url);
                setVirusTotalResult(vtResult);
            } else {
                throw new Error('Failed to get VirusTotal scan ID');
            }

            // Custom model scan
            const customResponse = await axios.post('/api/customScan', { url: checkUrl });
            if (customResponse.data && typeof customResponse.data.safetyScore === 'number') {
                customScore = customResponse.data.safetyScore;
                customResult = customResponse.data.result;
                setCustomSafetyScore(customScore);
                setCustomResult(customResult);
            } else {
                console.error('Invalid response from custom scan API:', customResponse.data);
                customScore = 0;
                customResult = 'Error';
            }

            const scanData = {
                url: checkUrl,
                virusTotalResult: vtResult,
                customResult: customResult,
                virusTotalSafetyScore: vtScore,
                customSafetyScore: customScore,
                date: new Date().toISOString()
            };
            console.log('Saving scan data:', scanData); // Отладочный вывод
            addScan(scanData);

        } catch (error) {
            console.error('Error during URL check:', error);
            setVirusTotalResult('Error');
            setCustomResult('Error');
            setVirusTotalSafetyScore(0);
            setCustomSafetyScore(0);

            addScan({
                url: checkUrl,
                virusTotalResult: 'Error',
                customResult: 'Error',
                virusTotalSafetyScore: 0,
                customSafetyScore: 0,
                date: new Date().toISOString()
            });
        }
    }

    async function sendUrlToVirusTotal(urlToCheck: string) {
        try {
            const response = await axios.post('/api/proxy', { url: urlToCheck });
            if (response.data && response.data.data && response.data.data.id) {
                return response.data.data.id;
            } else {
                throw new Error('Invalid response from VirusTotal API');
            }
        } catch (error) {
            console.error('Error sending URL to proxy:', error);
            throw new Error('Failed to send URL to VirusTotal');
        }
    }

    async function waitForAnalysisCompletion(analysisId: string) {
        const maxAttempts = 30;
        const delayBetweenAttempts = 2000; // 2 seconds

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            try {
                const response = await axios.get(`/api/proxy?id=${analysisId}`);
                if (response.data.data.attributes.status === 'completed') {
                    return response.data;
                }
            } catch (error) {
                console.error('Error getting URL analysis from proxy:', error);
            }

            // Wait before the next attempt
            await new Promise(resolve => setTimeout(resolve, delayBetweenAttempts));
        }

        throw new Error('Analysis did not complete in the expected time');
    }

    const [ref, inView] = useInView({
        threshold: 0.1,
        triggerOnce: true,
    });

    return (
        <>
            <Head>
                <title>Phishing Website Detector 🕵🏼</title>
                <link rel="stylesheet" href="https://unpkg.com/pattern.css@1.0.0/dist/pattern.min.css"/>
                <meta name="description" content="Check if a website is safe or a phishing attempt"/>
                <meta property='theme-color' content='#17171a'/>
                <meta name="viewport" content="width=device-width, initial-scale=1"/>
                <link rel="icon" href="/detective.ico"/>
            </Head>
            <Navbar/>
            <div className='flex flex-col min-h-screen justify-between'>
                <main
                    className='flex flex-col justify-center grow pattern-grid-lg text-primary overflow-x-hidden relative'>
                    <div className="absolute inset-0 z-0 overflow-hidden">
                        <div
                            className="absolute w-[120rem] h-[40rem] bg-blue-500 rounded-full opacity-10 blur-3xl top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
                    </div>
                    {isLoading && (
                        <div
                            className="fixed inset-0 z-50 flex items-center justify-center"
                        >
                            <div className="w-16 h-16 border-4 border-t-4 border-gray-700 border-t-white rounded-full animate-spin"></div>
                        </div>
                    )}
                    <motion.div
                        className={`container mx-auto px-4 sm:px-6 lg:px-8 brightness-100 transition-all relative z-10 ${isLoading ? 'brightness-50' : ''}`}
                        initial={{transform: 'translateY(30px)', opacity: 0}}
                        whileInView={{transform: 'translateY(0px)', opacity: 100}}
                        transition={{duration: 0.5, delay: 0.1, ease: [0.39, 0.21, 0.12, 0.96],}}
                        viewport={{amount: 0.1, once: true}}
                        ref={ref}
                    >
                        <h1 className='font-bold sm:text-6xl text-4xl font-poppins text-center text-text'>
                            <span className="text-blue-500">Phishing</span> <span className="text-blue-100">Website Detector 🕵️‍♂️</span>
                        </h1>
                        <p className='text-blue-100 text-lg text-center mt-4 font-poppins'>
                            {inView &&
                                <Typewriter
                                    options={{
                                        delay: 30,
                                        strings: ["Enter a URL below to check if the website is safe."],
                                        loop: false,
                                        autoStart: true,
                                        deleteSpeed: 604800000,
                                    }}
                                />}
                        </p>
                        <div className='w-full mx-auto pt-8 flex flex-col items-center'>
                            <div className="flex items-center w-full max-w-3xl mb-4">
                                <input
                                    type="text"
                                    name="url"
                                    id="url"
                                    value={url}
                                    placeholder="Enter URL..."
                                    onChange={handleInput}
                                    className="outline-none bg-zinc-800 block w-full outline- rounded-md border-0 p-2 text-blue-100 font-poppins shadow-sm ring-1 ring-inset ring-zinc-700 placeholder:text-gray-400 focus:ring-3 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 padding-left:1"
                                />
                                <button onClick={handleCheck}
                                        className="ml-2 p-2 font-poppins rounded-md md:text-xl text-lg font-semibold bg-zinc-925 border-2 border-zinc-900 hover:border-blue-700 duration-500 ease-custom text-blue-100">
                                    Check
                                </button>
                            </div>
                            <div className="relative w-full max-w-5xl mx-auto p-4 my-4">
                                <div className="flex flex-col lg:flex-row gap-8">
                                    <div className="flex-1 relative group">
                                        <div className="absolute inset-0 z-0">
                                            <div
                                                className="absolute w-full h-full bg-blue-500 rounded-full opacity-20 blur-2xl group-hover:translate-x-6 group-hover:translate-y-6 transition-all duration-300 ease-in-out"></div>
                                        </div>
                                        <div
                                            className="relative z-10 bg-[#313338] p-6 rounded-2xl shadow-lg aspect-[2/1] transition-all duration-300 ease-in-out transform group-hover:scale-105">
                                            <h2 className="text-2xl font-bold text-blue-300 mb-4">VirusTotal Scan</h2>
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <p className="text-blue-100 text-xl py-1">Result:</p>
                                                    <p className="text-blue-500 font-bold text-4xl font-poppins py-1">{virusTotalResult}</p>
                                                    <div className="text-blue-100/50 text-lg font-poppins py-2">
                                                        {scannedUrl.length > 25 ? `${scannedUrl.substring(0, 25)}...` : scannedUrl}
                                                    </div>
                                                </div>
                                                <div className="w-32 h-32">
                                                    <CircularProgressbar
                                                        value={virusTotalSafetyScore}
                                                        text={`${virusTotalSafetyScore}%`}
                                                        styles={buildStyles({
                                                            textColor: 'white',
                                                            pathColor: `rgb(${255 - Math.round((255 * virusTotalSafetyScore) / 100)}, ${Math.round((255 * virusTotalSafetyScore) / 100)}, 0)`,
                                                            trailColor: 'rgba(0, 0, 0, 0.2)',
                                                            textSize: '16px'
                                                        })}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex-1 relative group">
                                        <div className="absolute inset-0 z-0">
                                            <div
                                                className="absolute w-full h-full bg-blue-600 rounded-full opacity-20 blur-2xl group-hover:-translate-x-6 group-hover:-translate-y-6 transition-all duration-300 ease-in-out"></div>
                                        </div>
                                        <div
                                            className="relative z-10 bg-[#313338] p-6 rounded-2xl shadow-lg aspect-[2/1] transition-all duration-300 ease-in-out transform group-hover:scale-105">
                                            <h2 className="text-2xl font-bold text-blue-300 mb-4">My Own Model Scan</h2>
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <p className="text-blue-100 text-xl py-1">Result:</p>
                                                    <p className="text-blue-500 font-bold text-4xl font-poppins py-1">{customResult}</p>
                                                    <div className="text-blue-100/50 text-lg font-poppins py-2">
                                                        {scannedUrl.length > 25 ? `${scannedUrl.substring(0, 25)}...` : scannedUrl}
                                                    </div>
                                                </div>
                                                <div className="w-32 h-32">
                                                    <CircularProgressbar
                                                        value={customSafetyScore}
                                                        text={`${customSafetyScore}%`}
                                                        styles={buildStyles({
                                                            textColor: 'white',
                                                            pathColor: `rgb(${255 - Math.round((255 * customSafetyScore) / 100)}, ${Math.round((255 * customSafetyScore) / 100)}, 0)`,
                                                            trailColor: 'rgba(0, 0, 0, 0.2)',
                                                            textSize: '16px'
                                                        })}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </main>
                <footer>
                    <div className="h-0.5 w-full rounded-lg bg-gradient-to-r from-secondary via-accent to-secondary"/>
                    <h2 className="font-leaguespartan text-center font-semibold text-base text-text pt-2">
                        phishing.lukres.dev - Made with NextJS, TailwindCSS, and ❤ by Luka
                    </h2>
                </footer>
            </div>
        </>
    )
}