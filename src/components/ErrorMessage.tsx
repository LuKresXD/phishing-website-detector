import React from 'react';
import { XCircle } from 'lucide-react';

interface ErrorMessageProps {
    message: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => {
    return (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <div className="flex items-center">
                <XCircle className="w-5 h-5 mr-2" />
                <span className="block sm:inline">{message}</span>
            </div>
        </div>
    );
};

export default ErrorMessage;