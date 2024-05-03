import Head from 'next/head';
import { Fragment, useEffect, useState } from 'react';
import axios from 'axios';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

export default function Home() {
    const [pageLoad, setPageLoad] = useState(false);
    const [url, setUrl] = useState('google.com');
    const [result, setResult] = useState('STATUS HERE');
    const [safetyScore, setSafetyScore] = useState(100);
    const [analysisId, setAnalysisId] = useState('');
    const [scannedUrl, setScannedUrl] = useState('');

    function handleInput(e: any) {
        setUrl(e.target.value);
    }

    async function handleCheck() {
        const finalUrl = url;
        if (finalUrl) {
            checkVirusTotal(finalUrl);
            setUrl('');
        }
    }

    async function checkVirusTotal(checkUrl: string) {
        const scanId = await sendUrlToVirusTotal(checkUrl);
        if (scanId) {
            const analysisResult = await waitForAnalysisCompletion(scanId);
            let score = Math.max(Number((100 - (analysisResult.data.attributes.stats.malicious * 5 + analysisResult.data.attributes.stats.suspicious * 3) / 92 * 100).toFixed(1)), 0.1);
            setSafetyScore(score);
            setScannedUrl(analysisResult.meta.url_info.url);
            if (score < 50) {
                setResult('Dangerous');
            } else if (score < 80){
                setResult('Moderate');
            } else {
                setResult('Safe');
            }
        }
    }

    async function waitForAnalysisCompletion(scanId: string) {
        const analysisResult = await getUrlAnalysis(scanId);
        if (analysisResult.data.attributes.status !== "completed") {
            await new Promise(resolve => setTimeout(resolve, 1000));
            return await waitForAnalysisCompletion(scanId);
        }
        return analysisResult;
    }


    async function sendUrlToVirusTotal(urlToCheck: string) {
        console.log(urlToCheck);
        const options = {
            method: 'POST',
            url: 'https://www.virustotal.com/api/v3/urls',
            headers: {
                'x-apikey': '009cfb8c691d07ff2b4a7bcb43affc9c372d3ffcacd4f51f3fb7b2676ce057b7',
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            data: `url=${encodeURIComponent(urlToCheck)}`
        };
        try {
            const response = await axios(options);
            return response.data.data.id;
        } catch (error) {
            console.error('Error sending URL to VirusTotal:', error);
            return null;
        }
    }

    async function getUrlAnalysis(analysisId: string) {
        const options = {
            method: 'GET',
            url: `https://www.virustotal.com/api/v3/analyses/${analysisId}`,
            headers: {
                'x-apikey': '009cfb8c691d07ff2b4a7bcb43affc9c372d3ffcacd4f51f3fb7b2676ce057b7'
            }
        };
        try {
            const response = await axios(options);
            return response.data;
        } catch (error) {
            console.error('Error getting URL analysis from VirusTotal:', error);
            return null;
        }
    }


    return (
        <>
            <Head>
                <title>Phishing Website Detector 🕵🏻‍♂️</title>
                <link rel="stylesheet" href="https://unpkg.com/pattern.css@1.0.0/dist/pattern.min.css"/>
                <meta name="description" content="Check if a website is safe or a phishing attempt"/>
                <meta property='theme-color' content='#17171a'/>
                <meta name="viewport" content="width=device-width, initial-scale=1"/>
                <link rel="icon" href="/favicon.ico"/>
            </Head>
            <main className='flex h-screen flex-col justify-center pattern-grid-lg text-primary overflow-x-hidden'>
                <div className='container mx-auto px-4 sm:px-6 lg:px-8'>
                    <h1 className='font-bold sm:text-6xl text-4xl font-poppins text-center'>
                        <span className="text-blue-500">Phishing</span> <span className="text-blue-100">Website Detector 🕵🏻‍♂️</span>
                    </h1>
                    <p className='text-blue-100 text-lg text-center mt-4'>
                        Enter a URL below to check if the website is safe.
                    </p>
                    <div className='w-full mx-auto pt-8 flex flex-col items-center'>
                        <div className="flex items-center w-full mb-4">
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
                        <div
                            className="relative md:scale-100 min-[460px]:scale-[0.8] min-[400px]:scale-[0.7] scale-[0.6] mx-3.5 duration-500">
                            <div
                                className="absolute inset-0 bg-transparent pattern-dots-md rounded-md transform-gpu scale-125 translate-x-8 translate-y-8"
                                style={{
                                    backgroundImage: "radial-gradient(circle, #1d4ed8 1px, transparent 1px)",
                                    backgroundSize: "10px 10px"
                                }}></div>
                            <div
                                className="relative bg-[#313338] p-4 w-[30rem] h-full flex flex-col rounded-md xs:-translate-x-8 xs:-translate-y-8 translate-y-0 translate-x-0"
                                style={{opacity: 1}}>
                                <div className="flex w-full justify-around items-center">
                                    <div className="text-lg">
                                        <p className="text-blue-100 text-xl mt-2">Website is</p>
                                        <p className="text-blue-500 font-bold text-2xl mt-2">{result}</p>
                                        <p className="text-blue-100 text-xl mt-2">{scannedUrl}</p>
                                    </div>
                                    <div style={{width: 150, height: 150}}>
                                        <CircularProgressbar
                                            value={safetyScore}
                                            text={`${safetyScore}%`}
                                            styles={buildStyles({
                                                textColor: 'white',
                                                pathColor: `rgb(${255 - Math.round((255 * safetyScore) / 100)}, ${Math.round((255 * safetyScore) / 100)}, 0)`,
                                                trailColor: 'black',
                                                textSize: '16px'
                                            })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </main>
        </>
    )
}
