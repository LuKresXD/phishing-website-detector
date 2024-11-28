import { motion } from 'framer-motion';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    hover?: boolean;
    onClick?: () => void;
}

export default function Card({ children, className = '', hover = true, onClick }: CardProps) {
    return (
        <div className="relative group w-full">
            {hover && (
                <div className="absolute inset-0 z-0">
                    <div
                        className="absolute w-full h-full bg-blue-500 rounded-2xl opacity-20 blur-2xl
                        group-hover:translate-x-6 group-hover:translate-y-6 transition-all duration-300 ease-in-out"
                    />
                </div>
            )}
            <motion.div
                onClick={onClick}
                className={`
                    relative z-10 bg-[#313338] p-8
                    rounded-2xl shadow-lg min-h-[200px]
                    transition-all duration-300 ease-in-out 
                    transform ${hover ? 'group-hover:scale-[1.02]' : ''}
                    ${onClick ? 'cursor-pointer' : ''}
                    ${className}
                `}
                whileHover={onClick ? { scale: 1.02 } : undefined}
                whileTap={onClick ? { scale: 0.98 } : undefined}
            >
                {children}
            </motion.div>
        </div>
    );
}