import React, { useState, useEffect } from 'react';
import { BarChart3, Users, MessageSquare, Eye } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import './Admin.css';

interface AnalyticsData {
    date: string;
    users: number;
    messages: number;
    statuses: number;
}

export const AdminAnalytics: React.FC = () => {
    const [period, setPeriod] = useState<'7d' | '30d' | 'all'>('7d');
    const [data, setData] = useState<AnalyticsData[]>([]);
    const [totals, setTotals] = useState({
        users: 0,
        messages: 0,
        statuses: 0,
        chats: 0,
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchAnalytics();
    }, [period]);

    const fetchAnalytics = async () => {
        setIsLoading(true);
        try {
            // Get date range
            const now = new Date();
            let startDate = new Date();
            if (period === '7d') {
                startDate.setDate(now.getDate() - 7);
            } else if (period === '30d') {
                startDate.setDate(now.getDate() - 30);
            } else {
                startDate = new Date('2020-01-01');
            }

            // Fetch analytics data
            const { data: analyticsData } = await supabase
                .from('analytics')
                .select('*')
                .gte('date', startDate.toISOString().split('T')[0])
                .order('date', { ascending: true });

            if (analyticsData) {
                setData(analyticsData.map((d: any) => ({
                    date: d.date,
                    users: d.new_users || 0,
                    messages: d.messages_sent || 0,
                    statuses: d.statuses_created || 0,
                })));
            }

            // Fetch totals
            const [
                { count: userCount },
                { count: messageCount },
                { count: statusCount },
                { count: chatCount },
            ] = await Promise.all([
                supabase.from('users').select('*', { count: 'exact', head: true }),
                supabase.from('messages').select('*', { count: 'exact', head: true }),
                supabase.from('status').select('*', { count: 'exact', head: true }),
                supabase.from('chats').select('*', { count: 'exact', head: true }),
            ]);

            setTotals({
                users: userCount || 0,
                messages: messageCount || 0,
                statuses: statusCount || 0,
                chats: chatCount || 0,
            });
        } catch (err) {
            console.error('Error fetching analytics:', err);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="admin-loading">
                <div className="loader" />
                <p>Loading analytics...</p>
            </div>
        );
    }

    return (
        <div className="analytics-page">
            <div className="admin-page-header">
                <h1>Analytics</h1>
                <p>Application usage statistics</p>
            </div>

            {/* Period Selector */}
            <div className="period-selector">
                <button
                    className={`period-btn ${period === '7d' ? 'active' : ''}`}
                    onClick={() => setPeriod('7d')}
                >
                    Last 7 Days
                </button>
                <button
                    className={`period-btn ${period === '30d' ? 'active' : ''}`}
                    onClick={() => setPeriod('30d')}
                >
                    Last 30 Days
                </button>
                <button
                    className={`period-btn ${period === 'all' ? 'active' : ''}`}
                    onClick={() => setPeriod('all')}
                >
                    All Time
                </button>
            </div>

            {/* Total Stats */}
            <div className="analytics-totals">
                <div className="total-card">
                    <Users size={24} />
                    <span className="total-value">{totals.users.toLocaleString()}</span>
                    <span className="total-label">Total Users</span>
                </div>
                <div className="total-card">
                    <MessageSquare size={24} />
                    <span className="total-value">{totals.messages.toLocaleString()}</span>
                    <span className="total-label">Total Messages</span>
                </div>
                <div className="total-card">
                    <Eye size={24} />
                    <span className="total-value">{totals.statuses.toLocaleString()}</span>
                    <span className="total-label">Total Statuses</span>
                </div>
                <div className="total-card">
                    <MessageSquare size={24} />
                    <span className="total-value">{totals.chats.toLocaleString()}</span>
                    <span className="total-label">Total Chats</span>
                </div>
            </div>

            {/* Simple Chart Representation */}
            <div className="analytics-chart-section">
                <h2>Activity Over Time</h2>
                {data.length === 0 ? (
                    <div className="no-data">
                        <BarChart3 size={48} />
                        <p>No analytics data available for this period</p>
                        <p className="hint">Analytics are recorded daily when users interact with the app</p>
                    </div>
                ) : (
                    <div className="simple-chart">
                        {data.map((day, idx) => (
                            <div key={idx} className="chart-bar-group">
                                <div className="chart-bars">
                                    <div
                                        className="chart-bar users"
                                        style={{ height: `${Math.min(day.users * 10, 100)}px` }}
                                        title={`Users: ${day.users}`}
                                    />
                                    <div
                                        className="chart-bar messages"
                                        style={{ height: `${Math.min(day.messages, 100)}px` }}
                                        title={`Messages: ${day.messages}`}
                                    />
                                    <div
                                        className="chart-bar statuses"
                                        style={{ height: `${Math.min(day.statuses * 5, 100)}px` }}
                                        title={`Statuses: ${day.statuses}`}
                                    />
                                </div>
                                <span className="chart-label">{new Date(day.date).getDate()}</span>
                            </div>
                        ))}
                    </div>
                )}
                <div className="chart-legend">
                    <span className="legend-item"><span className="dot users" /> Users</span>
                    <span className="legend-item"><span className="dot messages" /> Messages</span>
                    <span className="legend-item"><span className="dot statuses" /> Statuses</span>
                </div>
            </div>
        </div>
    );
};
