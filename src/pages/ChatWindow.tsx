import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, Smile, ArrowLeft, MoreVertical, Ban, Trash2, ShieldAlert } from 'lucide-react';
import { Avatar } from '../components/common';
import { useChatStore } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import type { User } from '../types';
import './ChatWindow.css';

export const ChatWindow: React.FC = () => {
    const { chatId } = useParams<{ chatId: string }>();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { messages, fetchMessages, sendMessage, addMessage, chats, fetchChats } = useChatStore();
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [otherUser, setOtherUser] = useState<User | null>(null);
    const [isBlocked, setIsBlocked] = useState(false);
    const [showMenu, setShowMenu] = useState(false);

    useEffect(() => {
        if (chatId) {
            fetchMessages(chatId);

            // Fetch chat details if not in store
            const chat = chats.find(c => c.id === chatId);
            if (chat) {
                const participant = chat.participants.find(p => p.user_id !== user?.id);
                const other = participant?.user || null;
                setOtherUser(other);

                if (other && user) {
                    checkBlockStatus(user.id, other.id);
                }
            } else if (user?.id) {
                // If chat not found in store, fetch chats to populate it
                fetchChats(user.id);
            }
        }
    }, [chatId, fetchMessages, fetchChats, chats, user?.id]);

    const checkBlockStatus = async (blockerId: string, blockedId: string) => {
        const { data } = await supabase
            .from('user_blocks')
            .select('id')
            .eq('blocker_id', blockerId)
            .eq('blocked_id', blockedId)
            .single();

        setIsBlocked(!!data);
    };

    const toggleBlock = async () => {
        if (!user || !otherUser) return;

        try {
            if (isBlocked) {
                await supabase
                    .from('user_blocks')
                    .delete()
                    .eq('blocker_id', user.id)
                    .eq('blocked_id', otherUser.id);
                setIsBlocked(false);
            } else {
                await supabase
                    .from('user_blocks')
                    .insert({ blocker_id: user.id, blocked_id: otherUser.id });
                setIsBlocked(true);
            }
            setShowMenu(false);
        } catch (err) {
            console.error('Error toggling block:', err);
        }
    };

    useEffect(() => {
        // Subscribe to new messages
        if (!chatId) return;

        console.log('ChatWindow: Subscribing to real-time messages for chat:', chatId);

        const channel = supabase
            .channel(`chat_messages:${chatId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `chat_id=eq.${chatId}`,
                },
                async (payload) => {
                    console.log('ChatWindow: New message received via real-time:', payload.new);

                    if (payload.new.sender_id !== user?.id) {
                        // Check if message already exists in state to avoid duplicates
                        const exists = useChatStore.getState().messages.some(m => m.id === payload.new.id);
                        if (exists) return;

                        // Fetch the sender info
                        const { data } = await supabase
                            .from('users')
                            .select('*')
                            .eq('id', payload.new.sender_id)
                            .single();

                        if (data) {
                            addMessage({
                                ...(payload.new as any),
                                sender: data as User
                            });
                        }
                    }
                }
            )
            .subscribe((status) => {
                console.log('ChatWindow: Subscription status:', status);
            });

        return () => {
            console.log('ChatWindow: Unsubscribing from real-time messages');
            supabase.removeChannel(channel);
        };
    }, [chatId, user?.id, addMessage]);

    useEffect(() => {
        // Scroll to bottom with a slight delay to ensure content is rendered
        const timer = setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
        return () => clearTimeout(timer);
    }, [messages]);

    const handleSend = async () => {
        if (!newMessage.trim() || !chatId || !user?.id) return;

        setIsSending(true);
        try {
            await sendMessage(chatId, user.id, newMessage.trim());
            setNewMessage('');
        } catch (err) {
            console.error('Error sending message:', err);
        } finally {
            setIsSending(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="chat-window">
            <div className="chat-header">
                <button className="btn btn-ghost btn-icon" onClick={() => navigate('/home')}>
                    <ArrowLeft size={20} />
                </button>
                {otherUser && (
                    <div className="chat-header-user">
                        <Avatar
                            src={otherUser.profile_picture}
                            name={otherUser.full_name}
                            size="md"
                            isOnline={otherUser.is_online}
                        />
                        <div className="chat-header-info">
                            <span className="chat-header-name">{otherUser.full_name}</span>
                            <span className="chat-header-status">
                                {otherUser.is_online ? 'Online' : 'Offline'}
                            </span>
                        </div>
                    </div>
                )}
                <div className="chat-header-actions">
                    <div className="relative">
                        <button
                            className="btn btn-ghost btn-icon"
                            onClick={() => setShowMenu(!showMenu)}
                        >
                            <MoreVertical size={20} />
                        </button>
                        {showMenu && (
                            <div className="chat-menu">
                                <button className="menu-item" onClick={toggleBlock}>
                                    <Ban size={16} />
                                    {isBlocked ? 'Unblock User' : 'Block User'}
                                </button>
                                <button className="menu-item danger">
                                    <Trash2 size={16} />
                                    Delete Chat
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="messages-container">
                {messages.length === 0 ? (
                    <div className="messages-empty">
                        <p>No messages yet. Say hello! 👋</p>
                    </div>
                ) : (
                    messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`message-bubble ${msg.sender_id === user?.id ? 'sent' : 'received'}`}
                        >
                            <p>{msg.content}</p>
                            <span className="message-time">
                                {(() => {
                                    try {
                                        return formatDistanceToNow(new Date(msg.created_at), { addSuffix: true });
                                    } catch (e) {
                                        return 'Just now';
                                    }
                                })()}
                            </span>
                        </div>
                    ))
                )}
                {isBlocked && (
                    <div className="blocked-banner">
                        <ShieldAlert size={16} />
                        <span>You have blocked this user</span>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className={`message-input-container ${isBlocked ? 'disabled' : ''}`}>
                <button className="btn btn-ghost btn-icon" disabled={isBlocked}>
                    <Smile size={22} />
                </button>
                <input
                    type="text"
                    className="message-input"
                    placeholder={isBlocked ? "You cannot send messages to a blocked user" : "Type a message..."}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    disabled={isBlocked}
                />
                <button
                    className={`btn btn-primary btn-icon send-btn ${isBlocked ? 'disabled' : ''}`}
                    onClick={handleSend}
                    disabled={!newMessage.trim() || isSending || isBlocked}
                >
                    <Send size={20} />
                </button>
            </div>
        </div>
    );
};
