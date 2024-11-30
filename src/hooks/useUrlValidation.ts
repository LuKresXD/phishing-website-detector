import { useState, useEffect } from 'react';

export function useUrlValidation(url: string) {
    const [isValid, setIsValid] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Reset validation state for empty input
        if (!url.trim()) {
            setIsValid(false);
            setError('Please enter a URL');
            return;
        }

        // Strict URL pattern requiring http/https protocol
        const urlPattern = /^https?:\/\/(([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}|localhost|\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(:\d+)?(\/[-a-z0-9\._~:/?#[\]@!$&'()*+,;=%]*)?$/i;

        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            setIsValid(false);
            setError('URL must start with http:// or https://');
            return;
        }

        if (!urlPattern.test(url)) {
            setIsValid(false);
            setError('Please enter a valid URL (e.g., https://example.com)');
            return;
        }

        try {
            new URL(url);
            setIsValid(true);
            setError(null);
        } catch {
            setIsValid(false);
            setError('Invalid URL format. Please ensure the URL is correct');
        }
    }, [url]);

    return { isValid, error };
}