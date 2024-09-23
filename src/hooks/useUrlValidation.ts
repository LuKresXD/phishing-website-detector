import { useState, useEffect } from 'react';

export function useUrlValidation(url: string) {
    const [isValid, setIsValid] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!url.trim()) {
            setIsValid(false);
            setError('Please enter a URL');
            return;
        }

        const urlPattern = /^(https?:\/\/)?(([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}|localhost|\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(:\d+)?(\/[-a-z0-9\._~:/?#[\]@!$&'()*+,;=%]*)?$/i;

        if (!urlPattern.test(url)) {
            setIsValid(false);
            setError('Please enter a valid URL (e.g., https://example.com or http://192.168.1.1)');
            return;
        }

        try {
            new URL(url);
            setIsValid(true);
            setError(null);
        } catch {
            try {
                new URL(`http://${url}`);
                setIsValid(true);
                setError(null);
            } catch {
                setIsValid(false);
                setError('Invalid URL format. Please ensure the URL is correct');
            }
        }
    }, [url]);

    return { isValid, error };
}