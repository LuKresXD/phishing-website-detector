import { forwardRef } from 'react';
import { motion, MotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    icon?: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
                                                               children,
                                                               variant = 'primary',
                                                               size = 'md',
                                                               isLoading = false,
                                                               icon,
                                                               className = '',
                                                               disabled,
                                                               ...props
                                                           }, ref) => {
    const baseStyles = 'font-poppins rounded-md font-semibold transition-all duration-300 flex items-center justify-center';

    const variants = {
        primary: 'bg-zinc-925 border-2 border-zinc-900 hover:border-blue-700 text-blue-100',
        secondary: 'bg-zinc-800 border-2 border-zinc-700 hover:border-blue-600 text-blue-100',
        outline: 'bg-transparent border-2 border-zinc-700 hover:border-blue-600 text-blue-100'
    };

    const sizes = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-base',
        lg: 'px-6 py-3 text-lg'
    };

    return (
        <motion.button
            ref={ref}
            whileTap={{ scale: 0.98 }}
            className={`
                ${baseStyles}
                ${variants[variant]}
                ${sizes[size]}
                ${disabled || isLoading ? 'opacity-50 cursor-not-allowed' : ''}
                ${className}
            `}
            disabled={disabled || isLoading}
            {...(props as MotionProps)} // Explicit cast to MotionProps
        >
            {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : icon ? (
                <span className="mr-2">{icon}</span>
            ) : null}
            {children}
        </motion.button>
    );
});

Button.displayName = 'Button';

export default Button;
