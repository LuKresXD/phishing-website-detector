// src/components/ui/Input.tsx

import { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    error?: boolean;
    helperText?: string;
    label?: string;
    fullWidth?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({
                                                            error,
                                                            helperText,
                                                            label,
                                                            fullWidth = true,
                                                            className = '',
                                                            ...props
                                                        }, ref) => {
    return (
        <div className={`${fullWidth ? 'w-full' : ''}`}>
            {label && (
                <label className="block text-sm font-medium text-blue-100 mb-1">
                    {label}
                </label>
            )}
            <input
                ref={ref}
                className={`
                    outline-none bg-zinc-800 block 
                    ${fullWidth ? 'w-full' : ''} 
                    outline- rounded-md border-0 p-2 
                    text-blue-100 font-poppins shadow-sm 
                    ring-1 ring-inset 
                    ${!error ? 'ring-zinc-700' : 'ring-red-500'} 
                    placeholder:text-gray-400 
                    focus:ring-3 focus:ring-inset focus:ring-blue-600 
                    sm:text-sm sm:leading-6
                    transition-all duration-200
                    ${className}
                `}
                {...props}
            />
            {helperText && (
                <p className={`mt-1 text-sm ${error ? 'text-red-500' : 'text-blue-100/70'}`}>
                    {helperText}
                </p>
            )}
        </div>
    );
});

Input.displayName = 'Input';

export default Input;