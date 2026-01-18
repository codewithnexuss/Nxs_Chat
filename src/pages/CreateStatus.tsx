import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Globe } from 'lucide-react';
import { Button, Textarea } from '../components/common';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import './CreateStatus.css';

export const CreateStatus: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [content, setContent] = useState('');
    const [visibility, setVisibility] = useState<'contacts' | 'anyone'>('anyone');
    const [isPosting, setIsPosting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim() || !user?.id) return;

        setIsPosting(true);
        setError('');

        try {
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + 24);

            const { error: insertError } = await supabase
                .from('status')
                .insert({
                    user_id: user.id,
                    content: content.trim(),
                    visibility,
                    expires_at: expiresAt.toISOString(),
                });

            if (insertError) throw insertError;
            navigate('/status');
        } catch (err: any) {
            setError(err.message || 'Failed to post status');
        } finally {
            setIsPosting(false);
        }
    };

    return (
        <div className="create-status-page">
            <header className="create-status-header">
                <button className="btn btn-ghost btn-icon" onClick={() => navigate(-1)}>
                    <ArrowLeft size={20} />
                </button>
                <h1>Create Status</h1>
                <div style={{ width: 40 }} />
            </header>

            <form onSubmit={handleSubmit} className="create-status-form">
                {error && <div className="auth-error">{error}</div>}

                <div className="status-input-section">
                    <label>What's on your mind?</label>
                    <Textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Share your thoughts..."
                        rows={6}
                    />
                    <span className="char-count">{content.length} / 500</span>
                </div>

                <div className="visibility-section">
                    <label>Who can see this?</label>

                    <div className="visibility-options-grid">
                        <button
                            type="button"
                            className={`visibility-option-card ${visibility === 'contacts' ? 'active' : ''}`}
                            onClick={() => setVisibility('contacts')}
                        >
                            <Users size={24} />
                            <strong>Chat Contacts</strong>
                            <p>Only people you've chatted with</p>
                        </button>

                        <button
                            type="button"
                            className={`visibility-option-card ${visibility === 'anyone' ? 'active' : ''}`}
                            onClick={() => setVisibility('anyone')}
                        >
                            <Globe size={24} />
                            <strong>Anyone</strong>
                            <p>All app users can see</p>
                        </button>
                    </div>
                </div>

                <div className="create-status-actions">
                    <Button
                        type="submit"
                        size="lg"
                        className="w-full"
                        isLoading={isPosting}
                        disabled={!content.trim()}
                    >
                        Post Status
                    </Button>
                </div>
            </form>
        </div>
    );
};
