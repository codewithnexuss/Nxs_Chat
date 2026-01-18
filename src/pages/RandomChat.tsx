import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shuffle, X, Send, Smile } from 'lucide-react';
import { Avatar, Button } from '../components/common';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { formatDistanceToNow } from 'date-fns';
import type { User } from '../types';
import './RandomChat.css';

type ConnectionStatus = 'idle' | 'searching' | 'connected' | 'disconnected';

interface RandomMessage {
    id: string;
    content: string;
    sender_id: string;
    created_at: string;
}

export const RandomChat: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [status, setStatus] = useState<ConnectionStatus>('idle');
    const [matchedUser, setMatchedUser] = useState<User | null>(null);
    const [messages, setMessages] = useState<RandomMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [chatId, setChatId] = useState<string | null>(null);

    const startSearching = async () => {
        if (!user?.id) return;
        setStatus('searching');

        try {
            // Add to queue
            const { data: queueEntry, error: queueError } = await supabase
                .from('random_chat_queue')
                .insert({ user_id: user.id })
                .select()
                .single();

            if (queueError) throw queueError;

            // Look for another waiting user
            const { data: waitingUsers, error: searchError } = await supabase
                .from('random_chat_queue')
                .select('*, user:users(*)')
                .eq('is_waiting', true)
                .neq('user_id', user.id)
                .order('created_at', { ascending: true })
                .limit(1);

            if (searchError) throw searchError;

            if (waitingUsers && waitingUsers.length > 0) {
                const match = waitingUsers[0];

                // Create random chat
                const { data: newChat, error: chatError } = await supabase
                    .from('chats')
                    .insert({ type: 'random' })
                    .select()
                    .single();

                if (chatError) throw chatError;

                // Add participants
                await supabase.from('chat_participants').insert([
                    { chat_id: newChat.id, user_id: user.id },
                    { chat_id: newChat.id, user_id: match.user_id }
                ]);

                // Update queue entries
                await supabase
                    .from('random_chat_queue')
                    .update({ is_waiting: false, matched_at: new Date().toISOString() })
                    .in('id', [queueEntry.id, match.id]);

                setChatId(newChat.id);
                setMatchedUser(match.user as unknown as User);
                setStatus('connected');
            } else {
                // Wait for match - subscribe to updates
                const channel = supabase
                    .channel(`queue:${queueEntry.id}`)
                    .on('postgres_changes', {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'random_chat_queue',
                        filter: `id=eq.${queueEntry.id}`
                    }, async (payload: any) => {
                        if (payload.new.matched_at) {
                            // Find the chat we're now part of
                            const { data: participation } = await supabase
                                .from('chat_participants')
                                .select('chat_id, chats(*)')
                                .eq('user_id', user.id)
                                .order('joined_at', { ascending: false })
                                .limit(1)
                                .single();

                            if (participation) {
                                // Get the other user
                                const { data: otherParticipant } = await supabase
                                    .from('chat_participants')
                                    .select('user:users(*)')
                                    .eq('chat_id', participation.chat_id)
                                    .neq('user_id', user.id)
                                    .single();

                                if (otherParticipant) {
                                    setChatId(participation.chat_id);
                                    setMatchedUser(otherParticipant.user as unknown as User);
                                    setStatus('connected');
                                }
                            }
                        }
                    })
                    .subscribe();

                return () => {
                    supabase.removeChannel(channel);
                };
            }
        } catch (err) {
            console.error('Error starting random chat:', err);
            setStatus('idle');
        }
    };

    const disconnect = async () => {
        if (chatId && user?.id) {
            // Mark participation as inactive
            await supabase
                .from('chat_participants')
                .update({ is_active: false, left_at: new Date().toISOString() })
                .eq('chat_id', chatId)
                .eq('user_id', user.id);
        }

        setStatus('disconnected');
        setMatchedUser(null);
        setMessages([]);
        setChatId(null);
    };

    const sendMessage = async () => {
        if (!newMessage.trim() || !chatId || !user?.id) return;

        try {
            const { data, error } = await supabase
                .from('messages')
                .insert({
                    chat_id: chatId,
                    sender_id: user.id,
                    content: newMessage.trim(),
                    message_type: 'text'
                })
                .select()
                .single();

            if (error) throw error;

            setMessages(prev => [...prev, data as RandomMessage]);
            setNewMessage('');
        } catch (err) {
            console.error('Error sending message:', err);
        }
    };

    // Subscribe to messages
    useEffect(() => {
        if (!chatId) return;

        const channel = supabase
            .channel(`random-chat:${chatId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `chat_id=eq.${chatId}`
            }, (payload: any) => {
                if (payload.new.sender_id !== user?.id) {
                    setMessages(prev => [...prev, payload.new as RandomMessage]);
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [chatId, user?.id]);

    return (
        <div className="random-chat-page">
            {status === 'idle' && (
                <div className="random-idle">
                    <div className="random-icon">
                        <Shuffle size={48} />
                    </div>
                    <h2>Random Chat</h2>
                    <p>Connect with a random user instantly</p>
                    <Button size="lg" onClick={startSearching}>
                        Start Searching
                    </Button>
                    <Button variant="ghost" onClick={() => navigate('/search')}>
                        Go Back
                    </Button>
                </div>
            )}

            {status === 'searching' && (
                <div className="random-searching">
                    <div className="search-animation">
                        <div className="pulse-circle"></div>
                        <Shuffle size={32} />
                    </div>
                    <h2>Searching...</h2>
                    <p>Looking for someone to chat with</p>
                    <Button variant="ghost" onClick={() => {
                        setStatus('idle');
                        // Clean up queue entry
                        if (user?.id) {
                            supabase
                                .from('random_chat_queue')
                                .delete()
                                .eq('user_id', user.id)
                                .eq('is_waiting', true);
                        }
                    }}>
                        Cancel
                    </Button>
                </div>
            )}

            {status === 'connected' && matchedUser && (
                <div className="random-connected">
                    <div className="random-header">
                        <div className="matched-info">
                            <Avatar
                                src={matchedUser.profile_picture}
                                name={matchedUser.full_name}
                                size="md"
                            />
                            <div>
                                <h3>{matchedUser.full_name}</h3>
                                <span>@{matchedUser.username}</span>
                            </div>
                        </div>
                        <Button variant="danger" size="sm" onClick={disconnect}>
                            <X size={16} />
                            Disconnect
                        </Button>
                    </div>

                    <div className="connected-banner">
                        <span>✨ Connected successfully! Say hello!</span>
                    </div>

                    <div className="random-messages">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`message-bubble ${msg.sender_id === user?.id ? 'sent' : 'received'}`}
                            >
                                <p>{msg.content}</p>
                                <span className="message-time">
                                    {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className="random-input-container">
                        <button className="btn btn-ghost btn-icon">
                            <Smile size={22} />
                        </button>
                        <input
                            type="text"
                            placeholder="Type a message..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                        />
                        <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                            <Send size={18} />
                        </Button>
                    </div>
                </div>
            )}

            {status === 'disconnected' && (
                <div className="random-disconnected">
                    <h2>Chat Ended</h2>
                    <p>The conversation has been disconnected</p>
                    <Button onClick={() => setStatus('idle')}>
                        Find Someone New
                    </Button>
                    <Button variant="ghost" onClick={() => navigate('/search')}>
                        Go Back
                    </Button>
                </div>
            )}
        </div>
    );
};
