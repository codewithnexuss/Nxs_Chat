import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import './AppLayout.css';

export const AppLayout: React.FC = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="app-layout">
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            {/* Mobile Header for Sidebar Toggle */}
            <div className="mobile-header">
                <button className="menu-btn" onClick={() => setIsSidebarOpen(true)}>
                    <Menu size={24} />
                </button>
                <span className="mobile-app-title">NXS Chat</span>
            </div>

            <main className="main-content">
                <Outlet />
            </main>
            <BottomNav />
        </div>
    );
};
