import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Calendar, Shield, Ban, CheckCircle, MessageSquare, Eye } from 'lucide-react';
import { Avatar, Button } from '../../components/common';
import { supabase } from '../../lib/supabase';
import type { User } from '../../types';
import './Admin.css';

interface UserStats {
    totalChats: number;
    totalMessages: number;
    totalStatuses: number;
}

export const UserDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [user, setUser] = useState<User | null>(null);
    const [stats, setStats] = useState<UserStats>({ totalChats: 0, totalMessages: 0, totalStatuses: 0 });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (id) {
            fetchUserDetails(id);
        }
    }, [id]);

    const fetchUserDetails = async (userId: string) => {
        try {
            // Fetch user
            const { data: userData } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();

            if (userData) {
                setUser(userData as User);
            }

            // Fetch stats
            const [
                { count: chatCount },
                { count: messageCount },
                { count: statusCount },
            ] = await Promise.all([
                supabase.from('chat_participants').select('*', { count: 'exact', head: true }).eq('user_id', userId),
                supabase.from('messages').select('*', { count: 'exact', head: true }).eq('sender_id', userId),
                supabase.from('status').select('*', { count: 'exact', head: true }).eq('user_id', userId),
            ]);

            setStats({
                totalChats: chatCount || 0,
                totalMessages: messageCount || 0,
                totalStatuses: statusCount || 0,
            });
        } catch (err) {
            console.error('Error fetching user details:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleBan = async () => {
        if (!user) return;
        const newStatus = !user.is_banned;

        try {
            await supabase
                .from('users')
                .update({ is_banned: newStatus })
                .eq('id', user.id);

            setUser({ ...user, is_banned: newStatus });
        } catch (err) {
            console.error('Error toggling ban:', err);
        }
    };

    if (isLoading) {
        return (
            <div className="admin-loading">
                <div className="loader" />
                <p>Loading user details...</p>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="admin-error">
                <p>User not found</p>
                <Button onClick={() => navigate('/1234/admin/users')}>Go Back</Button>
            </div>
        );
    }

    return (
        <div className="user-details-page">
            <button className="back-button" onClick={() => navigate('/1234/admin/users')}>
                <ArrowLeft size={20} />
                Back to Users
            </button>

            <div className="user-details-card">
                <div className="user-details-header">
                    <Avatar
                        src={user.profile_picture}
                        name={user.full_name}
                        size="2xl"
                        isOnline={user.is_online}
                    />
                    <div className="user-details-info">
                        <h1>{user.full_name}</h1>
                        <span className="username">@{user.username}</span>
                        <div className="user-badges">
                            {user.is_banned && (
                                <span className="badge banned">
                                    <Ban size={14} />
                                    Banned
                                </span>
                            )}
                            {user.is_online && (
                                <span className="badge online">
                                    Online
                                </span>
                            )}
                            {user.is_profile_public ? (
                                <span className="badge public">Public Profile</span>
                            ) : (
                                <span className="badge private">Private Profile</span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="user-details-actions">
                    <Button
                        variant={user.is_banned ? 'primary' : 'danger'}
                        onClick={toggleBan}
                    >
                        {user.is_banned ? (
                            <>
                                <CheckCircle size={18} />
                                Unban User
                            </>
                        ) : (
                            <>
                                <Ban size={18} />
                                Ban User
                            </>
                        )}
                    </Button>
                </div>

                <div className="user-details-grid">
                    <div className="detail-item">
                        <Mail size={18} />
                        <div>
                            <label>Email</label>
                            <span>{user.email}</span>
                        </div>
                    </div>
                    <div className="detail-item">
                        <Calendar size={18} />
                        <div>
                            <label>Date of Birth</label>
                            <span>{user.date_of_birth || 'Not provided'}</span>
                        </div>
                    </div>
                    <div className="detail-item">
                        <Shield size={18} />
                        <div>
                            <label>Gender</label>
                            <span>{user.gender || 'Not provided'}</span>
                        </div>
                    </div>
                    <div className="detail-item">
                        <Calendar size={18} />
                        <div>
                            <label>Joined</label>
                            <span>{new Date(user.created_at).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>

                {user.bio && (
                    <div className="user-bio">
                        <label>Bio</label>
                        <p>{user.bio}</p>
                    </div>
                )}

                <div className="user-stats-grid">
                    <div className="stat-item">
                        <MessageSquare size={24} />
                        <span className="stat-value">{stats.totalChats}</span>
                        <span className="stat-label">Chats</span>
                    </div>
                    <div className="stat-item">
                        <MessageSquare size={24} />
                        <span className="stat-value">{stats.totalMessages}</span>
                        <span className="stat-label">Messages</span>
                    </div>
                    <div className="stat-item">
                        <Eye size={24} />
                        <span className="stat-value">{stats.totalStatuses}</span>
                        <span className="stat-label">Statuses</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
