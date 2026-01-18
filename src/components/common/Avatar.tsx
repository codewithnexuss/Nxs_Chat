import React from 'react';
import { User } from 'lucide-react';

interface AvatarProps {
    src?: string | null;
    name?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
    isOnline?: boolean;
    className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
    src,
    name = '',
    size = 'md',
    isOnline,
    className = '',
}) => {
    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const sizeClass = `avatar-${size}`;

    return (
        <div
            className={`avatar ${sizeClass} ${isOnline ? 'avatar-online' : ''} ${className}`}
            style={{ position: 'relative' }}
        >
            {src ? (
                <img src={src} alt={name} />
            ) : name ? (
                getInitials(name)
            ) : (
                <User size={size === 'sm' ? 16 : size === 'lg' ? 24 : size === 'xl' ? 32 : size === '2xl' ? 48 : 20} />
            )}
        </div>
    );
};
