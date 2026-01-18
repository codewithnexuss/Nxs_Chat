import React, { useState, useEffect } from 'react';
import { Plus, Eye, Users, Globe } from 'lucide-react';
import { Avatar, Button, Modal, Textarea } from '../components/common';
import { Header } from '../components/layout';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { formatDistanceToNow } from 'date-fns';
import type { StatusWithUser } from '../types';
import './Status.css';

export const Status: React.FC = () => {
    const { user } = useAuthStore();
    const [statuses, setStatuses] = useState<StatusWithUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newStatus, setNewStatus] = useState('');
    const [visibility, setVisibility] = useState<'contacts' | 'anyone'>('anyone');
    const [isPosting, setIsPosting] = useState(false);

    useEffect(() => {
        fetchStatuses();

        // Subscribe to status changes
        const channel = supabase
            .channel('status-updates')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'status' },
                () => fetchStatuses()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchStatuses = async () => {
        try {
            const { data, error } = await supabase
                .from('status')
                .select(`
          *,
          user:users (*)
        `)
                .gte('expires_at', new Date().toISOString())
                .order('created_at', { ascending: false });

            if (error) throw error;
            setStatuses(data as StatusWithUser[]);
        } catch (err) {
            console.error('Error fetching statuses:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePostStatus = async () => {
        if (!newStatus.trim() || !user?.id) return;

        setIsPosting(true);
        try {
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + 24);

            const { error } = await supabase
                .from('status')
                .insert({
                    user_id: user.id,
                    content: newStatus.trim(),
                    visibility,
                    expires_at: expiresAt.toISOString(),
                } as any);

            if (error) throw error;

            setNewStatus('');
            setShowCreateModal(false);
            fetchStatuses();
        } catch (err) {
            console.error('Error posting status:', err);
        } finally {
            setIsPosting(false);
        }
    };

    return (
        <div className="status-page">
            <Header
                title="Status"
                rightAction={
                    <button
                        className="btn btn-primary btn-sm"
                        onClick={() => setShowCreateModal(true)}
                    >
                        <Plus size={18} />
                        Post
                    </button>
                }
            />

            <div className="page-content">
                <div className="page-header-desktop">
                    <h2>Status</h2>
                    <Button onClick={() => setShowCreateModal(true)} leftIcon={<Plus size={18} />}>
                        Post Status
                    </Button>
                </div>

                {isLoading ? (
                    <div className="status-loading">
                        <div className="loader" />
                    </div>
                ) : statuses.length === 0 ? (
                    <div className="status-empty">
                        <div className="empty-icon">📝</div>
                        <h3>No statuses yet</h3>
                        <p>Share what's on your mind</p>
                        <Button onClick={() => setShowCreateModal(true)}>
                            Post Status
                        </Button>
                    </div>
                ) : (
                    <div className="status-list">
                        {statuses.map((status) => (
                            <div key={status.id} className="status-card-modern">
                                <div className="status-header">
                                    <Avatar
                                        src={status.user.profile_picture}
                                        name={status.user.full_name}
                                        size="md"
                                    />
                                    <div className="status-user-info">
                                        <span className="status-user-name">{status.user.full_name}</span>
                                        <div className="status-meta-row">
                                            <span className="status-time">
                                                {formatDistanceToNow(new Date(status.created_at), { addSuffix: true })}
                                            </span>
                                            <span className="status-visibility-dot" />
                                            <div className="status-visibility-icon">
                                                {status.visibility === 'anyone' ? (
                                                    <Globe size={12} />
                                                ) : (
                                                    <Users size={12} />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="status-content-body">
                                    <p>{status.content}</p>
                                </div>
                                <div className="status-footer-modern">
                                    <div className="status-stat">
                                        <Eye size={14} />
                                        <span>{status.views_count} views</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <Modal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                title="Create Status"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setShowCreateModal(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handlePostStatus}
                            isLoading={isPosting}
                            disabled={!newStatus.trim()}
                        >
                            Post
                        </Button>
                    </>
                }
            >
                <div className="create-status-form">
                    <Textarea
                        placeholder="What's on your mind?"
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value)}
                        rows={4}
                    />
                    <div className="visibility-options">
                        <label className="visibility-label">Who can see this?</label>
                        <div className="visibility-buttons">
                            <button
                                className={`visibility-btn ${visibility === 'contacts' ? 'active' : ''}`}
                                onClick={() => setVisibility('contacts')}
                            >
                                <Users size={16} />
                                Chat Contacts
                            </button>
                            <button
                                className={`visibility-btn ${visibility === 'anyone' ? 'active' : ''}`}
                                onClick={() => setVisibility('anyone')}
                            >
                                <Globe size={16} />
                                Anyone
                            </button>
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
