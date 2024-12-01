import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { motion, AnimatePresence } from 'framer-motion';

interface ProgressProps {
    value: number;
    size?: 'sm' | 'md' | 'lg';
    showText?: boolean;
    className?: string;
    isLoading?: boolean;
    isIdle?: boolean;
}

const sizes = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32'
};

export default function Progress({
                                     value,
                                     size = 'md',
                                     showText = true,
                                     className = '',
                                     isLoading = false,
                                     isIdle = false
                                 }: ProgressProps) {
    const getColor = (value: number) => {
        const red = 255 - Math.round((255 * value) / 100);
        const green = Math.round((255 * value) / 100);
        return `rgb(${red}, ${green}, 0)`;
    };

    return (
        <div className={`${sizes[size]} ${className} relative`}>
            <AnimatePresence mode="wait">
                {isLoading ? (
                    <motion.div
                        key="loading"
                        className="absolute inset-0"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "linear"
                            }}
                        >
                            <CircularProgressbar
                                value={25}
                                styles={buildStyles({
                                    pathColor: '#3B82F6',
                                    trailColor: 'rgba(59, 130, 246, 0.1)',
                                    pathTransition: 'none'
                                })}
                            />
                        </motion.div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="result"
                        className="absolute inset-0"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <CircularProgressbar
                            value={value}
                            text={showText && !isIdle ? `${value.toFixed(1)}%` : ''}
                            styles={buildStyles({
                                textColor: isIdle ? '#3B82F6' : 'white',
                                pathColor: isIdle ? '#3B82F6' : getColor(value),
                                trailColor: isIdle ? 'rgba(59, 130, 246, 0.1)' : 'rgba(0, 0, 0, 0.2)',
                                textSize: '16px',
                                pathTransition: 'stroke-dashoffset 0.5s ease'
                            })}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}