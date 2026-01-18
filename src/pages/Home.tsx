import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search as SearchIcon } from 'lucide-react';
import { Avatar } from '../components/common';
import { Header } from '../components/layout';
import { useChatStore } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '../lib/supabase';
import './Home.css';

export const Home: React.FC = () => {
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuthStore();
    const { chats, fetchChats, isLoading } = useChatStore();
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (user?.id) {
            console.log('Home: user.id identified, fetching chats for:', user.id);
            fetchChats(user.id);

            // Subscribe to chat-related changes
            const channel = supabase
                .channel('home-updates')
                .on(
                    'postgres_changes',
                    { event: '*', schema: 'public', table: 'messages' },
                    () => fetchChats(user.id)
                )
                .on(
                    'postgres_changes',
                    { event: '*', schema: 'public', table: 'chat_participants', filter: `user_id=eq.${user.id}` },
                    () => fetchChats(user.id)
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [user?.id, fetchChats]);

    const filteredChats = (chats || []).filter(chat => {
        const otherParticipant = chat.participants.find(p => p.user_id !== user?.id);
        if (!otherParticipant) return false;
        const name = otherParticipant.user.full_name.toLowerCase();
        const username = otherParticipant.user.username.toLowerCase();
        return name.includes(searchQuery.toLowerCase()) || username.includes(searchQuery.toLowerCase());
    });

    const getOtherUser = (chat: typeof chats[0]) => {
        const participant = chat.participants.find(p => p.user_id !== user?.id);
        return participant?.user;
    };

    return (
        <div className="home-page">
            <Header title="Chats" />

            <div className="page-content">
                <div className="page-header-desktop">
                    <h2>Chats</h2>
                </div>

                <div className="search-bar-container">
                    <div className="search-bar">
                        <SearchIcon size={18} />
                        <input
                            type="text"
                            placeholder="Search chats..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {isLoading || (isAuthenticated && !user && useAuthStore.getState().isLoading) || (user && !chats.length && useChatStore.getState().isLoading) ? (
                    <div className="chats-loading">
                        <div className="loader" />
                        <p>Loading chats...</p>
                    </div>
                ) : isAuthenticated && !user ? (
                    <div className="chats-empty">
                        <div className="empty-icon">👤</div>
                        <h3>Profile not found</h3>
                        <p>We couldn't find your profile. Please try completing your setup.</p>
                        <button
                            className="btn btn-primary"
                            onClick={() => navigate('/signup/username')}
                        >
                            Complete Setup
                        </button>
                    </div>
                ) : filteredChats.length === 0 ? (
                    <div className="chats-empty">
                        <div className="empty-icon">💬</div>
                        <h3>No chats yet</h3>
                        <p>Start a conversation by searching for users</p>
                        <button
                            className="btn btn-primary"
                            onClick={() => navigate('/search')}
                        >
                            Find Users
                        </button>
                    </div>
                ) : (
                    <div className="chat-list">
                        {filteredChats.map((chat) => {
                            const otherUser = getOtherUser(chat);
                            if (!otherUser) return null;

                            return (
                                <div
                                    key={chat.id}
                                    className="chat-list-item"
                                    onClick={() => navigate(`/chat/${chat.id}`)}
                                >
                                    <Avatar
                                        src={otherUser.profile_picture}
                                        name={otherUser.full_name}
                                        size="lg"
                                        isOnline={otherUser.is_online}
                                    />
                                    <div className="chat-info">
                                        <span className="chat-name">{otherUser.full_name}</span>
                                        <span className="chat-last-message">
                                            {chat.last_message?.content || 'No messages yet'}
                                        </span>
                                    </div>
                                    <div className="chat-meta">
                                        {chat.last_message && (
                                            <span className="chat-time">
                                                {formatDistanceToNow(new Date(chat.last_message.created_at), { addSuffix: false })}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};
