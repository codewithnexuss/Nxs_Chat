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

interface SidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
    const { user, signOut } = useAuthStore();

    return (
        <>
            {/* Mobile Overlay */}
            <div
                className={`sidebar-overlay ${isOpen ? 'visible' : ''}`}
                onClick={onClose}
            />

            <aside className={`sidebar ${isOpen ? 'mobile-open' : ''}`}>
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
                            onClick={onClose}
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
                        <div className="sidebar-user-info">
                            <span className="user-name">{user?.full_name || 'User'}</span>
                            <span className="user-status">Online</span>
                        </div>
                    </div>
                    <button className="logout-btn" onClick={signOut} title="Logout">
                        <LogOut size={20} />
                    </button>
                </div>
            </aside>
        </>
    );
};

