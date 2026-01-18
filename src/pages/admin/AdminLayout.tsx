import React, { useState, useEffect } from 'react';
import { useNavigate, Link, Outlet, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, Users, MessageSquare, Settings,
    LogOut, Shield, BarChart3, Menu, X, Sun, Moon
} from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';
import './Admin.css';

interface AdminSession {
    id: string;
    username: string;
    role: string;
}

export const AdminLayout: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [admin, setAdmin] = useState<AdminSession | null>(null);
    const { mode, toggleMode } = useThemeStore();

    useEffect(() => {
        const session = sessionStorage.getItem('adminSession');
        if (!session) {
            navigate('/admin-login');
            return;
        }
        setAdmin(JSON.parse(session));
    }, [navigate]);

    const handleLogout = () => {
        sessionStorage.removeItem('adminSession');
        navigate('/admin-login');
    };

    const navItems = [
        { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/admin/users', icon: Users, label: 'Users' },
        { path: '/admin/moderation', icon: MessageSquare, label: 'Moderation' },
        { path: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
        { path: '/admin/settings', icon: Settings, label: 'Settings' },
    ];

    if (!admin) return null;

    return (
        <div className="admin-layout">
            {/* Mobile header */}
            <header className="admin-mobile-header">
                <button className="btn btn-ghost btn-icon" onClick={() => setSidebarOpen(true)}>
                    <Menu size={24} />
                </button>
                <h1>Admin Panel</h1>
                <Shield size={24} />
            </header>

            {/* Sidebar */}
            <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div className="admin-sidebar-header">
                    <Shield size={32} />
                    <span>NXS Admin</span>
                    <button
                        className="btn btn-ghost btn-icon sidebar-close"
                        onClick={() => setSidebarOpen(false)}
                    >
                        <X size={20} />
                    </button>
                </div>

                <nav className="admin-nav">
                    {navItems.map(item => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`admin-nav-item ${location.pathname === item.path ? 'active' : ''}`}
                            onClick={() => setSidebarOpen(false)}
                        >
                            <item.icon size={20} />
                            <span>{item.label}</span>
                        </Link>
                    ))}
                </nav>

                <div className="admin-sidebar-footer">
                    <div className="admin-footer-left">
                        <button className="btn btn-ghost btn-icon theme-toggle" onClick={toggleMode} title="Toggle Theme">
                            {mode === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                        </button>
                        <div className="admin-info">
                            <span className="admin-name">{admin.username}</span>
                            <span className="admin-role">{admin.role}</span>
                        </div>
                    </div>
                    <button className="btn btn-ghost btn-icon" onClick={handleLogout} title="Logout">
                        <LogOut size={20} />
                    </button>
                </div>
            </aside>

            {/* Overlay */}
            {sidebarOpen && (
                <div className="admin-overlay" onClick={() => setSidebarOpen(false)} />
            )}

            {/* Main content */}
            <main className="admin-main">
                <Outlet />
            </main>
        </div>
    );
};
