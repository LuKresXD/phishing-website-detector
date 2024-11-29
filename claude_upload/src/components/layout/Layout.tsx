import Head from 'next/head';
import Navbar from '@/components/Navbar';
import { motion } from 'framer-motion';

interface LayoutProps {
    children: React.ReactNode;
    title?: string;
    description?: string;
}

export default function Layout({
                                   children,
                                   title = 'Phishing Website Detector 🕵️‍',
                                   description = 'Check if a website is safe or a phishing attempt'
                               }: LayoutProps) {
    return (
        <>
            <Head>
                <title>{title}</title>
                <link rel="stylesheet" href="https://unpkg.com/pattern.css@1.0.0/dist/pattern.min.css"/>
                <meta name="description" content={description}/>
                <meta property='theme-color' content='#17171a'/>
                <meta name="viewport" content="width=device-width, initial-scale=1"/>
                <link rel="icon" href="/detective.ico"/>
            </Head>

            <Navbar />

            <div className='flex flex-col min-h-screen justify-between'>
                <main className='flex flex-col justify-center grow pattern-grid-lg text-primary overflow-x-hidden relative'>
                    {/* Smoothed background effects */}
                    <div className="fixed inset-0 z-0 overflow-hidden">
                        {/* Main centered gradient - smoother transition */}
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(28,100,242,0.06),rgba(28,100,242,0)_100%)]" />

                        {/* Top area gradient - extended and smoothed */}
                        <div className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-[radial-gradient(circle_at_50%_50%,rgba(28,100,242,0.03),transparent_80%)]" />

                        {/* Bottom area gradient - extended and smoothed */}
                        <div className="absolute -bottom-1/2 -right-1/2 w-[200%] h-[200%] bg-[radial-gradient(circle_at_30%_70%,rgba(28,100,242,0.04),transparent_80%)]" />

                        {/* Subtle animated gradient */}
                        <div className="absolute inset-0 opacity-[0.02]">
                            <div className="absolute inset-0 bg-[linear-gradient(to_right,transparent,rgba(28,100,242,0.05),transparent)] animate-subtle-wave" />
                        </div>

                        {/* Ultra-subtle noise texture */}
                        <div className="absolute inset-0 bg-noise opacity-[0.01] mix-blend-soft-light" />
                    </div>

                    <motion.div
                        className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10"
                        initial={{transform: 'translateY(30px)', opacity: 0}}
                        animate={{transform: 'translateY(0px)', opacity: 100}}
                        transition={{duration: 0.5, ease: [0.39, 0.21, 0.12, 0.96]}}
                    >
                        {children}
                    </motion.div>
                </main>

                <footer>
                    <div className="h-0.5 w-full rounded-lg bg-gradient-to-r from-secondary via-accent to-secondary"/>
                    <h2 className="font-leaguespartan text-center font-semibold text-base text-text pt-2">
                        phishing.lukres.dev - Made with NextJS, TailwindCSS, and ❤ by Luka
                    </h2>
                </footer>
            </div>

            <style jsx global>{`
                @keyframes subtle-wave {
                    0% {
                        transform: translateX(-100%) rotate(-5deg);
                    }
                    100% {
                        transform: translateX(100%) rotate(5deg);
                    }
                }

                .animate-subtle-wave {
                    animation: subtle-wave 12s linear infinite;
                }

                .bg-noise {
                    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
                }
            `}</style>
        </>
    );
}