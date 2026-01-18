import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search as SearchIcon, Shuffle, Lock, Globe } from 'lucide-react';
import { Avatar, Button } from '../components/common';
import { Header } from '../components/layout';
import { supabase } from '../lib/supabase';
import { useChatStore } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';
import type { User } from '../types';
import './Search.css';

export const Search: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { createChat } = useChatStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;

        setIsSearching(true);
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .or(`username.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%`)
                .neq('id', user?.id)
                .limit(20);

            if (error) throw error;
            setSearchResults(data as User[]);
        } catch (err) {
            console.error('Search error:', err);
        } finally {
            setIsSearching(false);
        }
    };

    const handleStartChat = async (targetUser: User) => {
        if (!user?.id) return;

        setIsConnecting(true);
        try {
            const chat = await createChat(user.id, targetUser.id);
            navigate(`/chat/${chat.id}`);
        } catch (err) {
            console.error('Error starting chat:', err);
        } finally {
            setIsConnecting(false);
        }
    };

    const handleRandomChat = async () => {
        if (!user?.id) return;
        navigate('/random-chat');
    };

    return (
        <div className="search-page">
            <Header title="Search" />

            <div className="page-content">
                <div className="page-header-desktop">
                    <h2>Search</h2>
                </div>

                {/* Random Chat Button */}
                <div className="random-chat-section">
                    <button className="random-chat-btn" onClick={handleRandomChat}>
                        <Shuffle size={24} />
                        <div className="random-chat-text">
                            <span className="random-chat-title">Random Chat</span>
                            <span className="random-chat-desc">Meet someone new instantly</span>
                        </div>
                    </button>
                </div>

                {/* Search Bar */}
                <div className="search-input-container">
                    <div className="search-bar">
                        <SearchIcon size={18} />
                        <input
                            type="text"
                            placeholder="Search by username or name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                    </div>
                    <Button onClick={handleSearch} isLoading={isSearching}>
                        Search
                    </Button>
                </div>

                {/* Search Results */}
                <div className="search-results">
                    {searchResults.length === 0 && searchQuery && !isSearching && (
                        <div className="no-results">
                            <p>No users found matching "{searchQuery}"</p>
                        </div>
                    )}

                    {searchResults.map((result) => (
                        <div key={result.id} className="search-result-item">
                            <Avatar
                                src={result.profile_picture}
                                name={result.full_name}
                                size="lg"
                                isOnline={result.is_online}
                            />
                            <div className="result-info">
                                <div className="result-name">
                                    {result.full_name}
                                    {result.is_profile_public ? (
                                        <Globe size={14} className="visibility-icon public" />
                                    ) : (
                                        <Lock size={14} className="visibility-icon private" />
                                    )}
                                </div>
                                <span className="result-username">@{result.username}</span>
                                {result.is_profile_public && result.bio && (
                                    <p className="result-bio">{result.bio}</p>
                                )}
                            </div>
                            <Button
                                size="sm"
                                onClick={() => handleStartChat(result)}
                                isLoading={isConnecting}
                            >
                                Chat
                            </Button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
