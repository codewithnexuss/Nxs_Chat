import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, X, Eye } from 'lucide-react';
import { Avatar } from '../components/common';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { formatDistanceToNow } from 'date-fns';
import type { StatusWithUser } from '../types';
import './StatusViewer.css';

export const StatusViewer: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [statuses, setStatuses] = useState<StatusWithUser[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        fetchStatuses();
    }, []);

    useEffect(() => {
        // Find index of current status
        if (id && statuses.length > 0) {
            const index = statuses.findIndex(s => s.id === id);
            if (index !== -1) setCurrentIndex(index);
        }
    }, [id, statuses]);

    useEffect(() => {
        // Auto-progress timer (5 seconds per status)
        const timer = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    // Move to next status
                    if (currentIndex < statuses.length - 1) {
                        setCurrentIndex(currentIndex + 1);
                        return 0;
                    } else {
                        navigate('/status');
                        return 100;
                    }
                }
                return prev + 2; // 2% every 100ms = 5 seconds total
            });
        }, 100);

        return () => clearInterval(timer);
    }, [currentIndex, statuses.length, navigate]);

    useEffect(() => {
        // Track view
        const currentStatus = statuses[currentIndex];
        if (currentStatus && user?.id && currentStatus.user_id !== user.id) {
            supabase
                .from('status_views')
                .insert({ status_id: currentStatus.id, viewer_id: user.id })
                .then(() => {
                    // Update view count
                    supabase
                        .from('status')
                        .update({ views_count: (currentStatus.views_count || 0) + 1 })
                        .eq('id', currentStatus.id);
                });
        }
    }, [currentIndex, statuses, user?.id]);

    const fetchStatuses = async () => {
        const { data, error } = await supabase
            .from('status')
            .select(`*, user:users(*)`)
            .gte('expires_at', new Date().toISOString())
            .order('created_at', { ascending: false });

        if (!error && data) {
            setStatuses(data as StatusWithUser[]);
        }
    };

    const goNext = () => {
        if (currentIndex < statuses.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setProgress(0);
        } else {
            navigate('/status');
        }
    };

    const goPrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
            setProgress(0);
        }
    };

    const currentStatus = statuses[currentIndex];

    if (!currentStatus) {
        return (
            <div className="status-viewer-loading">
                <div className="loader" />
            </div>
        );
    }

    return (
        <div className="status-viewer">
            {/* Progress bars */}
            <div className="status-progress-container">
                {statuses.map((_, idx) => (
                    <div key={idx} className="status-progress-bar">
                        <div
                            className="status-progress-fill"
                            style={{
                                width: idx < currentIndex ? '100%' :
                                    idx === currentIndex ? `${progress}%` : '0%'
                            }}
                        />
                    </div>
                ))}
            </div>

            {/* Header */}
            <div className="status-viewer-header">
                <div className="status-viewer-user">
                    <Avatar
                        src={currentStatus.user.profile_picture}
                        name={currentStatus.user.full_name}
                        size="md"
                    />
                    <div className="status-viewer-info">
                        <span className="username">{currentStatus.user.full_name}</span>
                        <span className="time">
                            {formatDistanceToNow(new Date(currentStatus.created_at), { addSuffix: true })}
                        </span>
                    </div>
                </div>
                <button className="close-btn" onClick={() => navigate('/status')}>
                    <X size={24} />
                </button>
            </div>

            {/* Content */}
            <div className="status-viewer-content">
                <p>{currentStatus.content}</p>
            </div>

            {/* Navigation */}
            <div className="status-navigation">
                <button
                    className="nav-area nav-prev"
                    onClick={goPrev}
                    disabled={currentIndex === 0}
                >
                    <ChevronLeft size={32} />
                </button>
                <button
                    className="nav-area nav-next"
                    onClick={goNext}
                >
                    <ChevronRight size={32} />
                </button>
            </div>

            {/* Footer - View count (only for own status) */}
            {currentStatus.user_id === user?.id && (
                <div className="status-viewer-footer">
                    <Eye size={16} />
                    <span>{currentStatus.views_count} views</span>
                </div>
            )}
        </div>
    );
};
