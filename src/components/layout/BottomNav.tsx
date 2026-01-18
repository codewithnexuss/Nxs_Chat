import React from 'react';
import { NavLink } from 'react-router-dom';
import { MessageCircle, Search, Circle, Settings } from 'lucide-react';
import './BottomNav.css';

const navItems = [
    { icon: MessageCircle, label: 'Chats', path: '/home' },
    { icon: Search, label: 'Search', path: '/search' },
    { icon: Circle, label: 'Status', path: '/status' },
    { icon: Settings, label: 'Settings', path: '/settings' },
];

export const BottomNav: React.FC = () => {
    return (
        <nav className="bottom-nav">
            {navItems.map((item) => (
                <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
                >
                    <item.icon size={24} />
                    <span>{item.label}</span>
                </NavLink>
            ))}
        </nav>
    );
};
