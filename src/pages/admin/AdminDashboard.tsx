import React, { useState, useEffect } from 'react';
import { Users, MessageSquare, Activity, TrendingUp, Eye } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import './Admin.css';

interface DashboardStats {
    totalUsers: number;
    activeUsers: number;
    totalChats: number;
    totalMessages: number;
    totalStatuses: number;
}

interface RecentActivity {
    type: 'user' | 'message' | 'status';
    description: string;
    time: string;
}

export const AdminDashboard: React.FC = () => {
    const [stats, setStats] = useState<DashboardStats>({
        totalUsers: 0,
        activeUsers: 0,
        totalChats: 0,
        totalMessages: 0,
        totalStatuses: 0,
    });
    const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            // Fetch counts
            const [
                { count: userCount },
                { count: activeCount },
                { count: chatCount },
                { count: messageCount },
                { count: statusCount },
            ] = await Promise.all([
                supabase.from('users').select('*', { count: 'exact', head: true }),
                supabase.from('users').select('*', { count: 'exact', head: true }).eq('is_online', true),
                supabase.from('chats').select('*', { count: 'exact', head: true }),
                supabase.from('messages').select('*', { count: 'exact', head: true }),
                supabase.from('status').select('*', { count: 'exact', head: true }).gte('expires_at', new Date().toISOString()),
            ]);

            setStats({
                totalUsers: userCount || 0,
                activeUsers: activeCount || 0,
                totalChats: chatCount || 0,
                totalMessages: messageCount || 0,
                totalStatuses: statusCount || 0,
            });

            // Fetch recent users
            const { data: recentUsers } = await supabase
                .from('users')
                .select('full_name, created_at')
                .order('created_at', { ascending: false })
                .limit(5);

            if (recentUsers) {
                setRecentActivity(recentUsers.map(u => ({
                    type: 'user' as const,
                    description: `New user: ${u.full_name}`,
                    time: new Date(u.created_at).toLocaleString(),
                })));
            }
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const statCards = [
        { label: 'Total Users', value: stats.totalUsers, icon: Users, color: '#3b82f6' },
        { label: 'Active Now', value: stats.activeUsers, icon: Activity, color: '#22c55e' },
        { label: 'Total Chats', value: stats.totalChats, icon: MessageSquare, color: '#8b5cf6' },
        { label: 'Messages', value: stats.totalMessages, icon: TrendingUp, color: '#f59e0b' },
        { label: 'Active Statuses', value: stats.totalStatuses, icon: Eye, color: '#ec4899' },
    ];

    if (isLoading) {
        return (
            <div className="admin-loading">
                <div className="loader" />
                <p>Loading dashboard...</p>
            </div>
        );
    }

    return (
        <div className="admin-dashboard">
            <div className="admin-page-header">
                <h1>Dashboard</h1>
                <p>Overview of NXS Chat application</p>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
                {statCards.map((stat, index) => (
                    <div key={index} className="stat-card">
                        <div className="stat-icon" style={{ background: `${stat.color}20`, color: stat.color }}>
                            <stat.icon size={24} />
                        </div>
                        <div className="stat-info">
                            <span className="stat-value">{stat.value.toLocaleString()}</span>
                            <span className="stat-label">{stat.label}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Recent Activity */}
            <div className="dashboard-section">
                <h2>Recent Activity</h2>
                <div className="activity-list">
                    {recentActivity.length === 0 ? (
                        <p className="no-activity">No recent activity</p>
                    ) : (
                        recentActivity.map((activity, index) => (
                            <div key={index} className="activity-item">
                                <div className={`activity-icon ${activity.type}`}>
                                    {activity.type === 'user' && <Users size={16} />}
                                    {activity.type === 'message' && <MessageSquare size={16} />}
                                    {activity.type === 'status' && <Eye size={16} />}
                                </div>
                                <div className="activity-content">
                                    <span>{activity.description}</span>
                                    <span className="activity-time">{activity.time}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
