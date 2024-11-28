// src/components/ui/ErrorDisplay.tsx

import { AlertCircle, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ErrorDisplayProps {
    message: string;
    type?: 'error' | 'warning';
    onDismiss?: () => void;
}

export default function ErrorDisplay({ message, type = 'error', onDismiss }: ErrorDisplayProps) {
    const bgColor = type === 'error' ? 'bg-red-500/10' : 'bg-yellow-500/10';
    const borderColor = type === 'error' ? 'border-red-500/20' : 'border-yellow-500/20';
    const textColor = type === 'error' ? 'text-red-500' : 'text-yellow-500';

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`w-full rounded-lg ${bgColor} ${borderColor} border p-4 mb-4`}
            >
                <div className="flex items-start space-x-3">
                    {type === 'error' ? (
                        <XCircle className={`${textColor} h-5 w-5 flex-shrink-0`} />
                    ) : (
                        <AlertCircle className={`${textColor} h-5 w-5 flex-shrink-0`} />
                    )}
                    <div className="flex-1 space-y-1">
                        <p className={`text-sm ${textColor}`}>{message}</p>
                    </div>
                    {onDismiss && (
                        <button
                            onClick={onDismiss}
                            className={`${textColor} hover:${textColor}/80 transition-colors`}
                        >
                            <XCircle className="h-5 w-5" />
                        </button>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    );
}