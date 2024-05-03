import Head from 'next/head';
import { Fragment, useEffect, useState } from 'react';
import axios from 'axios';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

export default function Home() {
    const [pageLoad, setPageLoad] = useState(false);
    const [url, setUrl] = useState('');
    const [result, setResult] = useState('');
    const [trustScore, setTrustScore] = useState(0);

    useEffect(() => {
        setPageLoad(true);
    }, []);

    function handleInput(e: any) {
        setUrl(e.target.value);
    }

    async function handleCheck(e: any) {
        if (e.key === 'Enter' && url) {
            try {
                const options = {
                    method: 'GET',
                    url: 'https://wot-web-risk-and-safe-browsing.p.rapidapi.com/targets',
                    params: { t: url },
                    headers: {
                        'X-RapidAPI-Key': '14d7fefb20msha71cbd15fc9ba01p116d5bjsn1e89aca46f0e',
                        'X-RapidAPI-Host': 'wot-web-risk-and-safe-browsing.p.rapidapi.com'
                    }
                };
                const response = await axios.request(options);
                if (response.data && response.data.length > 0 && response.data[0].safety) {
                    const safety = response.data[0].safety.status;
                    const trustPercent = response.data[0].safety.reputations || 0; // Используйте этот процент в индикаторе
                    setTrustScore(trustPercent);
                    setResult(`URL Safety Status: ${safety}`);
                } else {
                    setResult('No safety data available for this URL');
                    setTrustScore(0);
                }
            } catch (error) {
                console.error('Error fetching from WOT API:', error);
                setResult('Failed to check the URL due to an error.');
                setTrustScore(0);
            }
            setUrl('');
        }
    }

    return (
        <>
            <Head>
                <title>Phishing Website Detector</title>
                <link rel="stylesheet" href="https://unpkg.com/pattern.css@1.0.0/dist/pattern.min.css"/>
                <meta name="description" content="Check if a website is safe or a phishing attempt"/>
                <meta property='theme-color' content='#17171a'/>
                <meta name="viewport" content="width=device-width, initial-scale=1"/>
                <link rel="icon" href="/favicon.ico"/>
            </Head>
            <main className='flex h-screen flex-col justify-center pattern-grid-lg text-primary overflow-x-hidden'>
                <div className='max-w-5xl w-full mx-auto'>
                    <h1 className={`${pageLoad ? 'animate-fade-in-top' : 'opacity-0'} text-white font-bold sm:text-6xl text-4xl font-leaguespartan text-center`}>
                        Phishing Website Detector 👋
                    </h1>
                    <div className={`${pageLoad ? 'animate-fade-in-bottom' : 'opacity-0'} w-1/2 mx-auto pt-8`}>
                        <label htmlFor="url" className="block font-leaguespartan text-sm font-medium leading-6 text-white">
                            Check URL for Phishing
                        </label>
                        <div className="relative mt-2 flex items-center">
                            <input
                                type="text"
                                name="url"
                                id="url"
                                value={url}
                                placeholder="Enter URL..."
                                onChange={handleInput}
                                onKeyDown={handleCheck}
                                className="pl-2 block w-full rounded-md border-0 py-1.5 pr-14 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-700 sm:text-sm sm:leading-6"
                            />
                            <div style={{ width: 100, height: 100, marginTop: '20px' }}>
                                <CircularProgressbar
                                    value={trustScore}
                                    text={`${trustScore}%`}
                                    styles={buildStyles({
                                        strokeLinecap: 'butt',
                                        textSize: '16px',
                                        pathColor: trustScore > 50 ? 'green' : 'red',
                                        textColor: 'white',
                                        trailColor: '#d6d6d6',
                                    })}
                                />
                            </div>
                        </div>
                        <p className="mt-4 text-white font-leaguespartan text-sm">{result}</p>
                    </div>
                </div>
            </main>
        </>
    )
}
