import { motion } from "framer-motion";

export default function Navbar() {
    return (
        <>
            <motion.header
                className="flex justify-center items-center w-full fixed px-4 top-0 z-50 pt-4"
                initial={{ transform: 'translateY(-30px)', opacity: 0 }}
                animate={{ transform: 'translateY(0px)', opacity: 100 }}
                transition={{ duration: 0.5, delay: 0.1, ease: [0.39, 0.21, 0.12, 0.96], }}
            >
                <nav style={{ boxShadow: '0 0 30px 2.5px #0a0a0a' }} className="flex h-14 max-w-[46rem] w-screen bg-gradient-to-br from-primary/90 to to-secondary/90 backdrop-blur-md rounded-lg border-1 border-accent px-4">
                    <div className="flex flex-row items-center justify-between w-full">
                        <div className="flex flex-row gap-2 items-center">
                            <img
                                onClick={() => window.location.href = 'https://lukres.dev'}
                                draggable={false}
                                className="h-10 w-10"
                                src="/me.png"
                                alt="Logo"
                            />
                            <button
                                onClick={() => window.location.href = '/'}
                                className="p-2 duration-300 text-text text-lg font-medium hover:bg-secondary font-leaguespartan rounded-md"
                            >
                                Home
                            </button>
                            <button
                                onClick={() => window.location.href = '/history'}
                                className="p-2 duration-300 text-text text-lg font-medium hover:bg-secondary font-leaguespartan rounded-md"
                            >
                                History
                            </button>
                        </div>
                        <div className="min-[330px]:flex hidden flex-row gap-2 items-center">
                            <a
                                draggable={false}
                                href="https://github.com/LuKresXD/phishing-website-detector"
                                target="_blank"
                                className="p-2 duration-300 text-text text-lg font-medium hover:bg-secondary font-leaguespartan rounded-md"
                            >
                                Source
                            </a>
                        </div>
                    </div>
                </nav>
            </motion.header>
            {/* Add spacing below navbar */}
            <div className="h-24" /> {/* This creates space below the fixed navbar */}
        </>
    );
}