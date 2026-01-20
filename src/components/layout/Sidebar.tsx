import React from 'react';
import { NavLink } from 'react-router-dom';
import { MessageSquare, Search, Circle, Settings, LogOut } from 'lucide-react';
import { Avatar } from '../common';
import { useAuthStore } from '../../store/authStore';
import './Sidebar.css';

const navItems = [
    { icon: MessageSquare, label: 'Chats', path: '/home' },
    { icon: Search, label: 'Search', path: '/search' },
    { icon: Circle, label: 'Status', path: '/status' },
    { icon: Settings, label: 'Settings', path: '/settings' },
];

export const Sidebar: React.FC = () => {
    const { user, signOut } = useAuthStore();

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <div className="sidebar-logo-icon">
                    <MessageSquare size={24} />
                </div>
            </div>

            <nav className="sidebar-nav">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                        title={item.label}
                    >
                        <item.icon size={22} />
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="sidebar-footer">
                <div className="sidebar-user-trigger" title={user?.full_name}>
                    <Avatar
                        src={user?.profile_picture}
                        name={user?.full_name || 'User'}
                        size="md"
                        isOnline
                    />
                </div>
                <button className="logout-btn" onClick={signOut} title="Logout">
                    <LogOut size={20} />
                </button>
            </div>
        </aside>
    );
};

