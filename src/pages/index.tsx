import Head from 'next/head';
import { Fragment, useEffect, useState } from 'react';
import axios from 'axios';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

export default function Home() {
    const [pageLoad, setPageLoad] = useState(false);
    const [url, setUrl] = useState('google.com');
    const [result, setResult] = useState('STATUS HERE');
    const [safetyScore, setSafetyScore] = useState(100);  // Процент доверия
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
            const analysisResult = await getUrlAnalysis(scanId);
            while (analysisResult.data.attributes.status != "completed") {
                setTimeout(async () => {
                }, 1000);
            }
            let score = ((analysisResult.data.attributes.stats.undetected + analysisResult.data.attributes.stats.harmless) / 92 * 100).toFixed(1);
            setSafetyScore(score);
            setScannedUrl(analysisResult.meta.url_info.url);
        }
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
                    <h1 className='font-bold sm:text-6xl text-4xl font-leaguespartan text-center'>
                        <span className="text-blue-500">Phishing</span> Website Detector 🕵🏻‍♂️
                    </h1>
                    <p className='text-white text-lg text-center mt-4'>
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
                                className="pl-2 block w-full rounded-md border-0 py-2 pr-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-700 sm:text-lg sm:leading-8"
                            />
                            <button onClick={handleCheck} className="ml-2 p-2 font-poppins rounded-md md:text-xl text-lg font-semibold bg-zinc-925 border-2 border-zinc-900 hover:border-blue-700 duration-500 ease-custom text-blue-100">
                                Check
                            </button>
                        </div>
                        <div className="flex w-full justify-around items-center mt-4">
                            <div className="text-lg">
                                <p className="text-white text-xl">Website is</p>
                                <p className="text-blue-500 font-bold text-2xl">{result}</p>
                                <p className="text-white text-xl mt-2">{scannedUrl}</p>
                            </div>
                            <div style={{ width: 150, height: 150 }}>
                                <CircularProgressbar
                                    value={safetyScore}
                                    text={`${safetyScore}%`}
                                    styles={buildStyles({
                                        textColor: 'white',
                                        pathColor: safetyScore > 50 ? 'green' : 'red',
                                        trailColor: 'black',
                                        textSize: '16px'
                                    })}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </>
    )
}
