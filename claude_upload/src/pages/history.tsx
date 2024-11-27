import Head from 'next/head';
import { useEffect, useState } from 'react';
import Navbar from "@/components/Navbar";
import { useInView } from 'react-intersection-observer';
import { motion } from "framer-motion";
import { DatabaseIcon } from 'lucide-react';
import { Scan, getScans } from '@/utils/localStorageUtil';

const ITEMS_PER_PAGE = 5;

export default function HistoryPage() {
    const [history, setHistory] = useState<Scan[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [totalScans, setTotalScans] = useState(0);

    const [ref, inView] = useInView({
        threshold: 0.1,
        triggerOnce: true,
    });

    useEffect(() => {
        fetchHistory(currentPage);
    }, [currentPage]);

    function fetchHistory(page: number) {
        setIsLoading(true);
        const allScans = getScans();
        console.log('All scans:', allScans); // Отладочный вывод
        const startIndex = (page - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        const paginatedScans = allScans.slice(startIndex, endIndex);
        console.log('Paginated scans:', paginatedScans); // Отладочный вывод

        setHistory(paginatedScans);
        setTotalPages(Math.ceil(allScans.length / ITEMS_PER_PAGE));
        setTotalScans(allScans.length);
        setIsLoading(false);
    }

    function handlePrevious() {
        setCurrentPage(prev => Math.max(prev - 1, 1));
    }

    function handleNext() {
        setCurrentPage(prev => (prev < totalPages ? prev + 1 : prev));
    }

    const getSafetyScoreColor = (score: number | null | undefined) => {
        if (score === null || score === undefined) return 'text-gray-500';
        if (score >= 80) return 'text-green-500';
        if (score >= 50) return 'text-yellow-500';
        return 'text-red-500';
    };

    const formatSafetyScore = (score: number | null | undefined) => {
        if (score === null || score === undefined) return 'N/A';
        return `${score.toFixed(1)}%`;
    };

    function handleExport() {
        const allScans = getScans();
        const csvContent = [
            ['URL', 'Date', 'VirusTotal Result', 'Custom Result', 'VirusTotal Safety Score', 'Custom Safety Score'],
            ...allScans.map(scan => [
                scan.url,
                new Date(scan.date).toLocaleString(),
                scan.virusTotalResult,
                scan.customResult,
                scan.virusTotalSafetyScore !== null ? `${scan.virusTotalSafetyScore.toFixed(1)}%` : 'N/A',
                scan.customSafetyScore !== null ? `${scan.customSafetyScore.toFixed(1)}%` : 'N/A'
            ])
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'scan_history.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    return (
        <>
            <Head>
                <title>History 📜</title>
                <link rel="stylesheet" href="https://unpkg.com/pattern.css@1.0.0/dist/pattern.min.css"/>
                <meta name="description" content="View the history of scanned websites"/>
                <meta property='theme-color' content='#17171a'/>
                <meta name="viewport" content="width=device-width, initial-scale=1"/>
                <link rel="icon" href="/detective.ico"/>
            </Head>
            <Navbar />
            <div className='flex flex-col h-screen justify-between'>
                <main className='flex h-screen flex-col justify-center pattern-grid-lg text-primary overflow-x-hidden'>
                    <motion.div
                        className={`container mx-auto px-4 sm:px-6 lg:px-8 brightness-100 transition-all ${isLoading ? 'brightness-50' : ''}`}
                        initial={{transform: 'translateY(30px)', opacity: 0}}
                        whileInView={{transform: 'translateY(0px)', opacity: 100}}
                        transition={{duration: 0.5, delay: 0.1, ease: [0.39, 0.21, 0.12, 0.96]}}
                        viewport={{amount: 0.1, once: true}}
                        ref={ref}
                    >
                        <div className='max-w-5xl w-full mx-auto'>
                            {totalScans === 0 ? (
                                <div className="flex flex-col items-center justify-center mt-12 text-center">
                                    <DatabaseIcon className="w-24 h-24 text-blue-500 mb-6"/>
                                    <h2 className="text-4xl font-bold text-blue-100 mb-4 font-leaguespartan">No scans
                                        yet</h2>
                                    <p className="text-xl text-blue-300 max-w-lg font-poppins">
                                        Start scanning websites to build your history. Your scans will appear here.
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <h1 className='text-white font-bold sm:text-6xl text-4xl font-leaguespartan text-center'>
                                        History 📜
                                    </h1>
                                    <table className="min-w-full divide-y divide-zinc-800 mt-8">
                                        <thead>
                                        <tr>
                                            <th scope="col"
                                                className="font-poppins py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-blue-100 sm:pl-0">URL
                                            </th>
                                            <th scope="col"
                                                className="font-poppins px-3 py-3.5 text-left text-sm font-semibold text-blue-100">Date
                                            </th>
                                            <th scope="col"
                                                className="font-poppins px-3 py-3.5 text-left text-sm font-semibold text-blue-100">VirusTotal
                                                Result
                                            </th>
                                            <th scope="col"
                                                className="font-poppins px-3 py-3.5 text-left text-sm font-semibold text-blue-100">Custom
                                                Result
                                            </th>
                                            <th scope="col"
                                                className="font-poppins px-3 py-3.5 text-left text-sm font-semibold text-blue-100">VirusTotal
                                                Score
                                            </th>
                                            <th scope="col"
                                                className="font-poppins px-3 py-3.5 text-left text-sm font-semibold text-blue-100">Custom
                                                Score
                                            </th>
                                        </tr>
                                        </thead>
                                        <tbody className="divide-y divide-zinc-700">
                                        {isLoading ? (
                                            [...Array(5)].map((_, index) => (
                                                <tr key={index}>
                                                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-bold text-blue-700 font-poppins sm:pl-0 animate-pulse">?????</td>
                                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-blue-100 font-poppins animate-pulse">?????</td>
                                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-blue-100 font-poppins animate-pulse">?????</td>
                                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-blue-100 font-poppins animate-pulse">?????</td>
                                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-blue-100 font-poppins animate-pulse">?????</td>
                                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-blue-100 font-poppins animate-pulse">?????</td>
                                                </tr>
                                            ))
                                        ) : (
                                            history.map(({
                                                             date,
                                                             virusTotalResult,
                                                             customResult,
                                                             url,
                                                             virusTotalSafetyScore,
                                                             customSafetyScore
                                                         }, index) => (
                                                <tr key={index}>
                                                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-bold text-blue-700 font-poppins sm:pl-0">{url.length > 25 ? `${url.substring(0, 25)}...` : url}</td>
                                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-blue-100 font-poppins">{new Date(date).toLocaleString()}</td>
                                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-blue-100 font-poppins">{virusTotalResult}</td>
                                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-blue-100 font-poppins">{customResult || 'N/A'}</td>
                                                    <td className={`whitespace-nowrap px-3 py-4 text-sm font-poppins ${getSafetyScoreColor(virusTotalSafetyScore)}`}>
                                                        {formatSafetyScore(virusTotalSafetyScore)}
                                                    </td>
                                                    <td className={`whitespace-nowrap px-3 py-4 text-sm font-poppins ${getSafetyScoreColor(customSafetyScore)}`}>
                                                        {formatSafetyScore(customSafetyScore)}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                        </tbody>
                                    </table>
                                    <nav
                                        className="flex items-center justify-between border-t border-zinc-700 bg-transparent pt-3 px-2">
                                        <div className="flex flex-1 items-center gap-3">
                                            <button onClick={handlePrevious}
                                                    className="relative inline-flex items-center font-poppins rounded-md bg-zinc-800 border-[1px] border-zinc-700 hover:bg-zinc-700 hover:border-blue-700 duration-300 active:translate-y-1 px-3 py-2 text-sm font-semibold text-blue-100">
                                                <svg xmlns="http://www.w3.org/2000/svg"
                                                     className="fill-white h-6 w-6 mx-auto"
                                                     viewBox="0 0 16 16">
                                                    <path
                                                        d="m3.86 8.753 5.482 4.796c.646.566 1.658.106 1.658-.753V3.204a1 1 0 0 0-1.659-.753l-5.48 4.796a1 1 0 0 0 0 1.506z"></path>
                                                </svg>
                                            </button>
                                            <button onClick={handleNext}
                                                    className="relative inline-flex items-center font-poppins rounded-md bg-zinc-800 border-[1px] border-zinc-700 hover:bg-zinc-700 hover:border-blue-700 duration-300 active:translate-y-1 px-3 py-2 text-sm font-semibold text-blue-100">
                                                <svg xmlns="http://www.w3.org/2000/svg"
                                                     className="fill-white h-6 w-6 mx-auto"
                                                     viewBox="0 0 16 16">
                                                    <path
                                                        d="m12.14 8.753-5.482 4.796c-.646.566-1.658.106-1.658-.753V3.204a1 1 0 0 1 1.659-.753l5.48 4.796a1 1 0 0 1 0 1.506z"></path>
                                                </svg>
                                            </button>
                                            <p className="text-sm text-blue-100 font-poppins">
                                                Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, totalScans)} of {totalScans} scans
                                            </p>
                                        </div>
                                        <div className="flex justify-end mb-4">
                                            <button
                                                onClick={handleExport}
                                                className="relative inline-flex items-center font-poppins rounded-md bg-zinc-800 border-[1px] border-zinc-700 hover:bg-zinc-700 hover:border-blue-700 duration-300 active:translate-y-1 px-4 py-2 text-sm font-semibold text-blue-100"
                                            >
                                                Export CSV
                                            </button>
                                        </div>
                                    </nav>
                                </>
                            )}
                        </div>
                    </motion.div>
                </main>
                <footer>
                    <div className="h-0.5 w-full rounded-lg bg-gradient-to-r from-secondary via-accent to-secondary"/>
                    <h2 className="font-leaguespartan text-center font-semibold text-base text-text pt-2">
                        phishing.lukres.dev - Made with NextJS, TailwindCSS, and ♥ by Luka
                    </h2>
                </footer>
            </div>
        </>
    );
}