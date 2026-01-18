import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Header.css';

interface HeaderProps {
    title: string;
    showBack?: boolean;
    rightAction?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({ title, showBack = false, rightAction }) => {
    const navigate = useNavigate();

    return (
        <header className="header">
            <div className="header-left">
                {showBack && (
                    <button className="btn btn-ghost btn-icon" onClick={() => navigate(-1)}>
                        <ArrowLeft size={20} />
                    </button>
                )}
                <h1 className="header-title">{title}</h1>
            </div>
            {rightAction && <div className="header-right">{rightAction}</div>}
        </header>
    );
};
