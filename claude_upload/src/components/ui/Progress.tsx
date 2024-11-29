import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

interface ProgressProps {
    value: number;
    size?: 'sm' | 'md' | 'lg';
    showText?: boolean;
    className?: string;
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
                                     className = ''
                                 }: ProgressProps) {
    // Calculate color based on value
    const getColor = (value: number) => {
        const red = 255 - Math.round((255 * value) / 100);
        const green = Math.round((255 * value) / 100);
        return `rgb(${red}, ${green}, 0)`;
    };

    return (
        <div className={`${sizes[size]} ${className}`}>
            <CircularProgressbar
                value={value}
                text={showText ? `${value.toFixed(1)}%` : undefined}
                styles={buildStyles({
                    textColor: 'white',
                    pathColor: getColor(value),
                    trailColor: 'rgba(0, 0, 0, 0.2)',
                    textSize: '16px'
                })}
            />
        </div>
    );
}