import React, { useState, useEffect } from 'react';
import { Trash2, Eye, AlertTriangle } from 'lucide-react';
import { Avatar, Button, Modal } from '../../components/common';
import { supabase } from '../../lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import './Admin.css';

interface ReportedContent {
    id: string;
    type: 'message' | 'status';
    content: string;
    user: { full_name: string; username: string; profile_picture?: string };
    created_at: string;
}

export const ContentModeration: React.FC = () => {
    const [tab, setTab] = useState<'messages' | 'statuses'>('messages');
    const [content, setContent] = useState<ReportedContent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedContent, setSelectedContent] = useState<ReportedContent | null>(null);

    useEffect(() => {
        fetchContent();
    }, [tab]);

    const fetchContent = async () => {
        setIsLoading(true);
        try {
            if (tab === 'messages') {
                const { data } = await supabase
                    .from('messages')
                    .select(`
            id,
            content,
            created_at,
            sender:users!sender_id (full_name, username, profile_picture)
          `)
                    .order('created_at', { ascending: false })
                    .limit(50);

                if (data) {
                    setContent(data.map((m: any) => ({
                        id: m.id,
                        type: 'message' as const,
                        content: m.content,
                        user: m.sender,
                        created_at: m.created_at,
                    })));
                }
            } else {
                const { data } = await supabase
                    .from('status')
                    .select(`
            id,
            content,
            created_at,
            user:users (full_name, username, profile_picture)
          `)
                    .order('created_at', { ascending: false })
                    .limit(50);

                if (data) {
                    setContent(data.map((s: any) => ({
                        id: s.id,
                        type: 'status' as const,
                        content: s.content,
                        user: s.user,
                        created_at: s.created_at,
                    })));
                }
            }
        } catch (err) {
            console.error('Error fetching content:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const deleteContent = async (item: ReportedContent) => {
        if (!confirm('Are you sure you want to delete this content?')) return;

        try {
            const table = item.type === 'message' ? 'messages' : 'status';
            await supabase.from(table).delete().eq('id', item.id);
            setContent(prev => prev.filter(c => c.id !== item.id));
            setSelectedContent(null);
        } catch (err) {
            console.error('Error deleting content:', err);
        }
    };

    if (isLoading) {
        return (
            <div className="admin-loading">
                <div className="loader" />
                <p>Loading content...</p>
            </div>
        );
    }

    return (
        <div className="content-moderation-page">
            <div className="admin-page-header">
                <h1>Content Moderation</h1>
                <p>Review and moderate user-generated content</p>
            </div>

            {/* Tabs */}
            <div className="moderation-tabs">
                <button
                    className={`tab ${tab === 'messages' ? 'active' : ''}`}
                    onClick={() => setTab('messages')}
                >
                    Messages
                </button>
                <button
                    className={`tab ${tab === 'statuses' ? 'active' : ''}`}
                    onClick={() => setTab('statuses')}
                >
                    Statuses
                </button>
            </div>

            {/* Content List */}
            <div className="content-list">
                {content.length === 0 ? (
                    <div className="no-content">
                        <AlertTriangle size={48} />
                        <p>No content to review</p>
                    </div>
                ) : (
                    content.map(item => (
                        <div key={item.id} className="content-item">
                            <div className="content-header">
                                <Avatar
                                    src={item.user.profile_picture}
                                    name={item.user.full_name}
                                    size="sm"
                                />
                                <div className="content-user">
                                    <span className="name">{item.user.full_name}</span>
                                    <span className="time">
                                        {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                                    </span>
                                </div>
                            </div>
                            <p className="content-text">{item.content}</p>
                            <div className="content-actions">
                                <button
                                    className="btn btn-ghost btn-sm"
                                    onClick={() => setSelectedContent(item)}
                                >
                                    <Eye size={16} />
                                    View
                                </button>
                                <button
                                    className="btn btn-ghost btn-sm danger"
                                    onClick={() => deleteContent(item)}
                                >
                                    <Trash2 size={16} />
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* View Modal */}
            <Modal
                isOpen={!!selectedContent}
                onClose={() => setSelectedContent(null)}
                title="Content Details"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setSelectedContent(null)}>
                            Close
                        </Button>
                        <Button variant="danger" onClick={() => selectedContent && deleteContent(selectedContent)}>
                            Delete Content
                        </Button>
                    </>
                }
            >
                {selectedContent && (
                    <div className="content-detail-modal">
                        <div className="content-author">
                            <Avatar
                                src={selectedContent.user.profile_picture}
                                name={selectedContent.user.full_name}
                                size="lg"
                            />
                            <div>
                                <strong>{selectedContent.user.full_name}</strong>
                                <span>@{selectedContent.user.username}</span>
                            </div>
                        </div>
                        <div className="content-body">
                            <p>{selectedContent.content}</p>
                        </div>
                        <div className="content-meta">
                            <span>Type: {selectedContent.type}</span>
                            <span>Posted: {new Date(selectedContent.created_at).toLocaleString()}</span>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};
