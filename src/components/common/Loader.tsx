import React from 'react';

interface LoaderProps {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export const Loader: React.FC<LoaderProps> = ({ size = 'md', className = '' }) => {
    const sizeClass = size === 'sm' ? 'loader-sm' : size === 'lg' ? 'loader-lg' : '';
    return <div className={`loader ${sizeClass} ${className}`} />;
};

interface LoadingScreenProps {
    message?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ message = 'Loading...' }) => {
    return (
        <div className="loading-screen">
            <Loader size="lg" />
            <p className="text-muted">{message}</p>
        </div>
    );
};
