import { useState } from 'react';
import { useUrlValidation } from '@/hooks/useUrlValidation';
import ErrorDisplay from '@/components/ui/ErrorDisplay';
import Button from '@/components/ui/Button';
import { Search } from 'lucide-react';

interface UrlScannerProps {
    onScanSubmit: (url: string) => Promise<void>;
    isLoading: boolean;
}

export default function UrlScanner({ onScanSubmit, isLoading }: UrlScannerProps) {
    const [url, setUrl] = useState('');
    const { isValid, error: urlError } = useUrlValidation(url);

    const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        setUrl(e.target.value);
    };

    const handleSubmit = async () => {
        if (isValid) {
            await onScanSubmit(url);
            setUrl('');
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && isValid && !isLoading) {
            handleSubmit();
        }
    };

    return (
        <div className='w-full mx-auto flex flex-col items-center'>
            <div className="flex flex-col sm:flex-row items-center w-full max-w-3xl mb-4">
                <input
                    type="text"
                    name="url"
                    id="url"
                    value={url}
                    placeholder="Enter URL (e.g., example.com or 192.168.1.1)"
                    onChange={handleInput}
                    onKeyPress={handleKeyPress}
                    className={`outline-none bg-zinc-800 block w-full outline- rounded-md border-0 p-2 text-blue-100 font-poppins shadow-sm ring-1 ring-inset ${!url || isValid ? 'ring-zinc-700' : 'ring-red-500'} placeholder:text-gray-400 focus:ring-3 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 mb-2 sm:mb-0 sm:mr-2`}
                />
                <Button
                    onClick={handleSubmit}
                    disabled={!isValid}
                    isLoading={isLoading}
                    icon={<Search className="h-4 w-4" />}
                    size="lg"
                    className="w-full sm:w-auto h-12"
                >
                    Check
                </Button>
            </div>

            {urlError && url && !isValid && (
                <ErrorDisplay
                    message={urlError}
                    type="warning"
                />
            )}
        </div>
    );
}