import Head from 'next/head';
import { Fragment, useEffect, useState } from 'react';

export default function Home() {
    const [pageLoad, setPageLoad] = useState(false);
    const [url, setUrl] = useState('');

    useEffect(() => {
        setPageLoad(true);
    }, []);

    function handleInput(e: any) {
        setUrl(e.target.value);
    }

    function handleCheck(e: any) {
        if (e.key === 'Enter') {
            // Подключим функцию для проверки URL через API здесь
            console.log('Проверяем URL:', url);
            // Пока что мы просто очистим поле ввода
            setUrl('');
        }
    }

    return (
        <>
            <Head>
                <title>Phishing Website Detector</title>
                <link href="https://unpkg.com/pattern.css@1.0.0/dist/pattern.min.css" rel="stylesheet"/>
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
                        <label htmlFor="url"
                               className="block font-leaguespartan text-sm font-medium leading-6 text-white">
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
                                className=" pl-2 block w-full rounded-md border-0 py-1.5 pr-14 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-700 sm:text-sm sm:leading-6"
                            />
                        </div>
                    </div>
                </div>
            </main>
        </>
    )
}
