import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, Smile, ArrowLeft, MoreVertical, Ban, Trash2, ShieldAlert, Paperclip, FileText, Image as ImageIcon, Video as VideoIcon, Download, X as CloseIcon, Pencil, Reply, X } from 'lucide-react';
import { Avatar } from '../components/common';
import { useChatStore } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { supabase } from '../lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import EmojiPicker, { type EmojiClickData, Theme as EmojiTheme } from 'emoji-picker-react';
import type { User, MessageWithSender } from '../types';
import './ChatWindow.css';

export const ChatWindow: React.FC = () => {
    const { chatId } = useParams<{ chatId: string }>();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const {
        messages, fetchMessages, sendMessage, addMessage, chats, fetchChats,
        deleteMessage, editMessage
    } = useChatStore();
    const { mode } = useThemeStore();
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [otherUser, setOtherUser] = useState<User | null>(null);
    const [isBlocked, setIsBlocked] = useState(false);
    const [showMenu, setShowMenu] = useState(false);

    // Message Actions State
    const [replyingTo, setReplyingTo] = useState<MessageWithSender | null>(null);
    const [editingMessage, setEditingMessage] = useState<MessageWithSender | null>(null);
    const [activeMessageMenu, setActiveMessageMenu] = useState<string | null>(null);

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
                                sender: data as User,
                                reply_to: payload.new.parent_id ? useChatStore.getState().messages.find(m => m.id === payload.new.parent_id) : null
                            });
                        }
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'messages',
                    filter: `chat_id=eq.${chatId}`,
                },
                async (payload) => {
                    console.log('ChatWindow: Message updated:', payload.new);
                    const currentMessages = useChatStore.getState().messages;
                    const existingMsg = currentMessages.find(m => m.id === payload.new.id);

                    if (existingMsg) {
                        useChatStore.getState().updateMessage({
                            ...existingMsg,
                            ...(payload.new as any),
                            reply_to: payload.new.parent_id ? currentMessages.find(m => m.id === payload.new.parent_id) : null
                        });
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'DELETE',
                    schema: 'public',
                    table: 'messages',
                    filter: `chat_id=eq.${chatId}`,
                },
                (payload) => {
                    console.log('ChatWindow: Message deleted:', payload.old);
                    useChatStore.getState().removeMessage(payload.old.id);
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
            if (editingMessage) {
                await editMessage(editingMessage.id, newMessage.trim());
                setEditingMessage(null);
            } else {
                await sendMessage(chatId, user.id, newMessage.trim(), 'text', undefined, undefined, replyingTo?.id);
                setReplyingTo(null);
            }
            setNewMessage('');
            setShowEmojiPicker(false);
        } catch (err) {
            console.error('Error sending/editing message:', err);
        } finally {
            setIsSending(false);
        }
    };

    const startReply = (msg: MessageWithSender) => {
        setReplyingTo(msg);
        setEditingMessage(null);
        setActiveMessageMenu(null);
    };

    const startEdit = (msg: MessageWithSender) => {
        if (msg.message_type !== 'text') return;
        setEditingMessage(msg);
        setReplyingTo(null);
        setNewMessage(msg.content);
        setActiveMessageMenu(null);
    };

    const handleDelete = async (msgId: string) => {
        if (window.confirm('Are you sure you want to delete this message?')) {
            try {
                await deleteMessage(msgId);
                setActiveMessageMenu(null);
            } catch (err) {
                console.error('Error deleting message:', err);
            }
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !chatId || !user?.id) return;

        // Validation
        const maxSize = 50 * 1024 * 1024; // 50MB
        if (file.size > maxSize) {
            alert('File size exceeds 50MB limit');
            return;
        }

        setIsUploading(true);
        setShowAttachmentMenu(false);

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
            const filePath = `${chatId}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('chat-attachments')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('chat-attachments')
                .getPublicUrl(filePath);

            let messageType: 'image' | 'video' | 'file' = 'file';
            if (file.type.startsWith('image/')) messageType = 'image';
            else if (file.type.startsWith('video/')) messageType = 'video';

            await sendMessage(
                chatId,
                user.id,
                file.name,
                messageType,
                messageType === 'image' ? publicUrl : undefined,
                publicUrl
            );

        } catch (err) {
            console.error('Error uploading file:', err);
            alert('Failed to upload file');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    useEffect(() => {
        // Subscribe to other user's status changes
        if (!otherUser?.id) return;

        const channel = supabase
            .channel(`user_status:${otherUser.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'users',
                    filter: `id=eq.${otherUser.id}`,
                },
                (payload) => {
                    const updatedUser = payload.new as User;
                    setOtherUser(prev => prev ? { ...prev, ...updatedUser } : null);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [otherUser?.id]);

    const handleEmojiClick = (emojiData: EmojiClickData) => {
        setNewMessage(prev => prev + emojiData.emoji);
        setShowEmojiPicker(false);
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
                            <span className={`chat-header-status ${otherUser.is_online ? 'online' : 'offline'}`}>
                                {otherUser.is_online ? (
                                    'Online'
                                ) : (
                                    otherUser.last_seen
                                        ? `Offline - ${formatDistanceToNow(new Date(otherUser.last_seen), { addSuffix: true })}`
                                        : 'Offline'
                                )}
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
                            id={`msg-${msg.id}`}
                            className={`message-bubble-wrapper ${msg.sender_id === user?.id ? 'sent' : 'received'}`}
                            onMouseEnter={() => setActiveMessageMenu(msg.id)}
                            onMouseLeave={() => setActiveMessageMenu(null)}
                        >
                            <div className={`message-bubble ${msg.sender_id === user?.id ? 'sent' : 'received'} ${msg.is_deleted ? 'deleted' : ''}`}>
                                {msg.reply_to && !msg.is_deleted && (
                                    <div className="message-reply-preview" onClick={() => {
                                        const el = document.getElementById(`msg-${msg.parent_id}`);
                                        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                    }}>
                                        <span className="reply-user">{msg.reply_to.sender?.full_name}</span>
                                        <p className="reply-content">{msg.reply_to.content}</p>
                                    </div>
                                )}

                                {msg.message_type === 'image' && msg.image_url && !msg.is_deleted && (
                                    <div className="message-image-container">
                                        <img
                                            src={msg.image_url}
                                            alt="Sent image"
                                            className="message-image"
                                            onClick={() => window.open(msg.image_url!, '_blank')}
                                        />
                                    </div>
                                )}

                                {msg.message_type === 'video' && msg.file_url && !msg.is_deleted && (
                                    <div className="message-video-container">
                                        <video controls className="message-video">
                                            <source src={msg.file_url} type="video/mp4" />
                                            Your browser does not support the video tag.
                                        </video>
                                    </div>
                                )}

                                {msg.message_type === 'file' && msg.file_url && !msg.is_deleted && (
                                    <div className="message-file-container">
                                        <div className="message-file-info">
                                            <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                                <FileText size={20} />
                                            </div>
                                            <div className="message-file-details">
                                                <span className="message-file-name">{msg.content}</span>
                                            </div>
                                        </div>
                                        <a
                                            href={msg.file_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-2 hover:bg-black/5 rounded-full transition-colors text-primary"
                                            download
                                        >
                                            <Download size={18} />
                                        </a>
                                    </div>
                                )}

                                {msg.message_type === 'text' && <p>{msg.content}</p>}

                                <div className="message-footer">
                                    <span className="message-time">
                                        {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                                        {msg.updated_at !== msg.created_at && !msg.is_deleted && " • Edited"}
                                    </span>
                                </div>
                            </div>

                            {!msg.is_deleted && (
                                <div className={`message-actions-overlay ${activeMessageMenu === msg.id ? 'visible' : ''}`}>
                                    <button className="action-btn" onClick={() => startReply(msg)} title="Reply">
                                        <Reply size={18} />
                                    </button>
                                    {msg.sender_id === user?.id && msg.message_type === 'text' && (
                                        <button className="action-btn" onClick={() => startEdit(msg)} title="Edit">
                                            <Pencil size={18} />
                                        </button>
                                    )}
                                    {msg.sender_id === user?.id && (
                                        <button className="action-btn danger" onClick={() => handleDelete(msg.id)} title="Delete">
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </div>
                            )}
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

            <div className="input-area-wrapper">
                {replyingTo && (
                    <div className="reply-preview-bar">
                        <div className="reply-info">
                            <span>Replying to {replyingTo.sender?.full_name}</span>
                            <p>{replyingTo.content}</p>
                        </div>
                        <button className="logout-btn" style={{ width: 32, height: 32 }} onClick={() => setReplyingTo(null)}>
                            <X size={16} />
                        </button>
                    </div>
                )}

                {editingMessage && (
                    <div className="reply-preview-bar editing">
                        <div className="reply-info">
                            <span>Editing message</span>
                            <p>{editingMessage.content}</p>
                        </div>
                        <button className="logout-btn" style={{ width: 32, height: 32 }} onClick={() => {
                            setEditingMessage(null);
                            setNewMessage('');
                        }}>
                            <X size={16} />
                        </button>
                    </div>
                )}

                <div className={`message-input-container ${(isBlocked || isUploading) ? 'disabled' : ''}`}>
                    <input
                        type="file"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        onChange={handleFileUpload}
                    />

                    <div className="relative">
                        <button
                            className="logout-btn"
                            style={{ width: 44, height: 44 }}
                            disabled={isBlocked || isUploading}
                            onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                        >
                            <Paperclip size={22} className={showAttachmentMenu ? 'text-primary' : ''} />
                        </button>
                        {showAttachmentMenu && (
                            <div className="attachment-menu">
                                <button className="attachment-menu-item" onClick={() => { fileInputRef.current?.click(); setShowAttachmentMenu(false); }}>
                                    <ImageIcon size={20} />
                                    <span>Image</span>
                                </button>
                                <button className="attachment-menu-item" onClick={() => { fileInputRef.current?.click(); setShowAttachmentMenu(false); }}>
                                    <VideoIcon size={20} />
                                    <span>Video</span>
                                </button>
                                <button className="attachment-menu-item" onClick={() => { fileInputRef.current?.click(); setShowAttachmentMenu(false); }}>
                                    <FileText size={20} />
                                    <span>File</span>
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="relative">
                        <button
                            className="logout-btn"
                            style={{ width: 44, height: 44 }}
                            disabled={isBlocked || isUploading}
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        >
                            <Smile size={22} className={showEmojiPicker ? 'text-primary' : ''} />
                        </button>
                        {showEmojiPicker && (
                            <div className="emoji-picker-container" style={{ position: 'absolute', bottom: '100%', left: 0, zIndex: 1000, marginBottom: 12 }}>
                                <div className="emoji-picker-header">
                                    <button className="logout-btn" style={{ width: 32, height: 32 }} onClick={() => setShowEmojiPicker(false)}>
                                        <CloseIcon size={18} />
                                    </button>
                                </div>
                                <EmojiPicker
                                    onEmojiClick={handleEmojiClick}
                                    theme={mode === 'dark' ? EmojiTheme.DARK : EmojiTheme.LIGHT}
                                    lazyLoadEmojis={true}
                                />
                            </div>
                        )}
                    </div>

                    <input
                        type="text"
                        className="message-input"
                        placeholder={
                            isBlocked
                                ? "You cannot send messages to a blocked user"
                                : isUploading
                                    ? "Uploading file..."
                                    : "Type a message..."
                        }
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={handleKeyPress}
                        disabled={isBlocked || isUploading}
                    />

                    <button
                        className={`logout-btn ${newMessage.trim() ? 'active' : ''}`}
                        style={{
                            width: 44,
                            height: 44,
                            background: newMessage.trim() ? 'var(--primary)' : 'transparent',
                            color: newMessage.trim() ? 'var(--text-on-primary)' : 'var(--text-secondary)'
                        }}
                        onClick={handleSend}
                        disabled={!newMessage.trim() || isSending || isBlocked || isUploading}
                    >
                        <Send size={20} />
                    </button>
                </div>
            </div>

        </div>
    );
};

