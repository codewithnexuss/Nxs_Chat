import React from 'react';
import { NavLink } from 'react-router-dom';
import { MessageCircle, Search, Circle, Settings, LogOut } from 'lucide-react';
import { Avatar } from '../common';
import { useAuthStore } from '../../store/authStore';
import './Sidebar.css';

const navItems = [
    { icon: MessageCircle, label: 'Chats', path: '/home' },
    { icon: Search, label: 'Search', path: '/search' },
    { icon: Circle, label: 'Status', path: '/status' },
    { icon: Settings, label: 'Settings', path: '/settings' },
];

export const Sidebar: React.FC = () => {
    const { user, signOut } = useAuthStore();

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <h1 className="sidebar-logo">NXS Chat</h1>
            </div>

            <nav className="sidebar-nav">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                    >
                        <item.icon size={20} />
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="sidebar-footer">
                <div className="sidebar-user">
                    <Avatar
                        src={user?.profile_picture}
                        name={user?.full_name || 'User'}
                        size="md"
                        isOnline
                    />
                    <div className="sidebar-user-info">
                        <span className="sidebar-user-name">
                            {useAuthStore.getState().isLoading
                                ? 'Loading profile...'
                                : user?.full_name || 'Guest User'}
                        </span>
                        {user?.username && <span className="sidebar-user-username">@{user.username}</span>}
                    </div>
                </div>
                <button className="btn btn-ghost btn-icon" onClick={signOut} title="Logout">
                    <LogOut size={18} />
                </button>
            </div>
        </aside>
    );
};
