import Head from 'next/head';
import { Fragment, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Navbar from "@/components/Navbar";
import axios from 'axios';

export default function HistoryPage() {
    const [history, setHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchHistory() {
            try {
                const { data } = await axios.get('/api/history');
                setHistory(data);
                setIsLoading(false);
            } catch (error) {
                console.error('Failed to fetch history:', error);
                setIsLoading(false);
            }
        }

        fetchHistory();
    }, []);

    return (
        <>
            <Head>
                <title>History 🕵🏻‍♂️</title>
                <link rel="stylesheet" href="https://unpkg.com/pattern.css@1.0.0/dist/pattern.min.css"/>
                <meta name="description" content="View the history of scanned websites"/>
                <meta property='theme-color' content='#17171a'/>
                <meta name="viewport" content="width=device-width, initial-scale=1"/>
                <link rel="icon" href="/detective.ico"/>
            </Head>
            <Navbar />
            <main className='flex h-screen flex-col justify-center pattern-grid-lg text-primary overflow-x-hidden'>
                <div className='max-w-5xl w-full mx-auto'>
                    <h1 className='text-white font-bold sm:text-6xl text-4xl font-leaguespartan text-center'>
                        History 🚧
                    </h1>
                    <table className="min-w-full divide-y divide-zinc-800 mt-8">
                        <thead>
                            <tr>
                                <th scope="col" className="font-poppins py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-blue-100 sm:pl-0">URL</th>
                                <th scope="col" className="font-poppins px-3 py-3.5 text-left text-sm font-semibold text-blue-100">Date</th>
                                <th scope="col" className="font-poppins px-3 py-3.5 text-left text-sm font-semibold text-blue-100">Result</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-700">
                            {isLoading ? (
                                <tr>
                                    <td className="text-center py-4 text-sm text-blue-100">Loading...</td>
                                </tr>
                            ) : history.length > 0 ? (
                                history.map((item, index) => (
                                    <tr key={index}>
                                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-bold text-blue-700 font-poppins sm:pl-0">{item.url}</td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-blue-100 font-poppins">{new Date(item.date).toLocaleDateString()}</td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-blue-100 font-poppins">{item.result}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="3" className="text-center py-4 text-sm text-blue-100">No history found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </main>
        </>
    );
}
