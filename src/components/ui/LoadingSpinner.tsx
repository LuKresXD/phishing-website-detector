// src/components/ui/LoadingSpinner.tsx

import { motion } from "framer-motion";

interface LoadingSpinnerProps {
    fullScreen?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

export default function LoadingSpinner({ fullScreen = false, size = 'md' }: LoadingSpinnerProps) {
    const sizes = {
        sm: 'w-8 h-8',
        md: 'w-12 h-12',
        lg: 'w-16 h-16'
    };

    const Spinner = (
        <motion.div
            className={`${sizes[size]} border-4 border-zinc-700 rounded-full`}
            style={{ borderTopColor: 'white' }}
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
    );

    if (fullScreen) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
                {Spinner}
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center p-4">
            {Spinner}
        </div>
    );
}