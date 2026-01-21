import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, Smile, ArrowLeft, MoreVertical, Ban, Trash2, ShieldAlert, Paperclip, FileText, Camera, Download, Pencil, Reply, X } from 'lucide-react';
import { Avatar } from '../components/common';
import { useChatStore } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { supabase } from '../lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import EmojiPicker, { type EmojiClickData, Theme as EmojiTheme } from 'emoji-picker-react';
import { useDrag } from '@use-gesture/react';
import { motion, useAnimation } from 'framer-motion';
import type { User, MessageWithSender } from '../types';
import './ChatWindow.css';

const SwipeableMessage = ({
    msg,
    user,
    onSwipeReply,
    onEdit,
    onDelete,
    activeMessageMenu,
    setActiveMessageMenu
}: {
    msg: MessageWithSender;
    user: User | null;
    onSwipeReply: (msg: MessageWithSender) => void;
    onEdit: (msg: MessageWithSender) => void;
    onDelete: (msgId: string) => void;
    activeMessageMenu: string | null;
    setActiveMessageMenu: (id: string | null) => void;
}) => {
    const controls = useAnimation();
    const isSentByMe = msg.sender_id === user?.id;
    const isMedia = msg.message_type === 'image' || msg.message_type === 'video';

    const bind = useDrag(({ active, movement: [x], cancel }) => {
        // Only allow swipe right
        if (x < 0) return;

        // Trigger threshold
        if (active && x > 50) {
            onSwipeReply(msg);
            cancel(); // Stop dragging
        }

        controls.start({ x: active ? x : 0, transition: { type: 'spring', stiffness: 500, damping: 30 } });
    }, {
        axis: 'x',
        filterTaps: true,
        from: () => [0, 0],
        rubberband: true
    });

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div
            id={`msg-${msg.id}`}
            className={`message-bubble-wrapper ${isSentByMe ? 'sent' : 'received'}`}
            onMouseEnter={() => setActiveMessageMenu(msg.id)}
            onMouseLeave={() => setActiveMessageMenu(null)}
            {...(isSentByMe ? {} : bind()) as any}
            style={{ touchAction: 'pan-y' }}
        >
            <motion.div
                animate={controls}
                className={`message-bubble ${isSentByMe ? 'sent' : 'received'} ${msg.is_deleted ? 'deleted' : ''} ${isMedia ? 'has-media' : ''}`}
            >
                {!isSentByMe && (
                    <div className="swipe-indicator">
                        <Reply size={16} />
                    </div>
                )}

                {msg.reply_to && !msg.is_deleted && (
                    <div className="message-reply-preview" onClick={(e) => {
                        e.stopPropagation();
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
                        <span className="message-time-overlay">
                            {formatTime(msg.created_at)}
                        </span>
                    </div>
                )}

                {msg.message_type === 'video' && msg.file_url && !msg.is_deleted && (
                    <div className="message-video-container">
                        <video controls className="message-video">
                            <source src={msg.file_url} type="video/mp4" />
                            Your browser does not support the video tag.
                        </video>
                        <span className="message-time-overlay">
                            {formatTime(msg.created_at)}
                        </span>
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

                {msg.message_type === 'text' && (
                    <div className="message-content-text">
                        {msg.content}
                        <span className="message-time">
                            {formatTime(msg.created_at)}
                            {new Date(msg.updated_at).getTime() > new Date(msg.created_at).getTime() + 2000 && !msg.is_deleted && " • Edited"}
                        </span>
                    </div>
                )}

                {msg.message_type === 'file' && (
                    <div className="message-footer">
                        <span className="message-time">
                            {formatTime(msg.created_at)}
                        </span>
                    </div>
                )}

            </motion.div>

            {!msg.is_deleted && activeMessageMenu === msg.id && (
                <div className={`message-actions-overlay visible`}>

                    {isSentByMe && msg.message_type === 'text' && (
                        <button className="action-btn" onClick={() => onEdit(msg)} title="Edit">
                            <Pencil size={18} />
                        </button>
                    )}
                    {isSentByMe && (
                        <button className="action-btn danger" onClick={() => onDelete(msg.id)} title="Delete">
                            <Trash2 size={18} />
                        </button>
                    )}
                    <button className="action-btn" onClick={() => onSwipeReply(msg)} title="Reply">
                        <Reply size={18} />
                    </button>
                </div>
            )}
        </div>
    );
};


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
    const cameraInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [otherUser, setOtherUser] = useState<User | null>(null);
    const [isBlocked, setIsBlocked] = useState(false);
    const [showMenu, setShowMenu] = useState(false);

    // Message Actions State
    const [replyingTo, setReplyingTo] = useState<MessageWithSender | null>(null);
    const [editingMessage, setEditingMessage] = useState<MessageWithSender | null>(null);
    const [activeMessageMenu, setActiveMessageMenu] = useState<string | null>(null);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'; // Reset height
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
        }
    }, [newMessage]);

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
    }, [messages.length, replyingTo]); // added replyingTo to scroll if needed, mainly layout shift

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
            // Reset height after send
            if (textareaRef.current) textareaRef.current.style.height = 'auto';
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
        // Focus input
        setTimeout(() => textareaRef.current?.focus(), 100);
    };

    const startEdit = (msg: MessageWithSender) => {
        if (msg.message_type !== 'text') return;
        setEditingMessage(msg);
        setReplyingTo(null);
        setNewMessage(msg.content);
        setActiveMessageMenu(null);
        setTimeout(() => textareaRef.current?.focus(), 100);
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
            console.error('Error uploading file:', err);
            alert(`Failed to upload file: ${(err as any).message || 'Unknown error'}`);
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
        // Do not close emoji picker immediately? User preference usually to keep open for multiple
        // setShowEmojiPicker(false); 
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
                        <SwipeableMessage
                            key={msg.id}
                            msg={msg}
                            user={user}
                            onSwipeReply={startReply}
                            onEdit={startEdit}
                            onDelete={handleDelete}
                            activeMessageMenu={activeMessageMenu}
                            setActiveMessageMenu={setActiveMessageMenu}
                        />
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
                        <button className="input-action-btn" style={{ width: 32, height: 32 }} onClick={() => setReplyingTo(null)}>
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
                        <button className="input-action-btn" style={{ width: 32, height: 32 }} onClick={() => {
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
                        multiple={false}
                    />
                    <input
                        type="file"
                        ref={cameraInputRef}
                        accept="image/*,video/*"
                        capture="environment"
                        style={{ display: 'none' }}
                        onChange={handleFileUpload}
                    />

                    <div className="relative">
                        <button
                            className="input-action-btn"
                            disabled={isBlocked || isUploading}
                            onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                        >
                            <Paperclip size={22} className={showAttachmentMenu ? 'text-primary' : ''} />
                        </button>
                        {showAttachmentMenu && (
                            <div className="attachment-menu">
                                <button className="attachment-menu-item" onClick={() => {
                                    setShowAttachmentMenu(false);
                                    if (cameraInputRef.current) cameraInputRef.current.click();
                                }}>
                                    <Camera size={20} />
                                    <span>Camera</span>
                                </button>
                                <button className="attachment-menu-item" onClick={() => {
                                    setShowAttachmentMenu(false);
                                    if (fileInputRef.current) fileInputRef.current.click();
                                }}>
                                    <FileText size={20} />
                                    <span>Document</span>
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="relative">
                        <button
                            className="input-action-btn"
                            disabled={isBlocked || isUploading}
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        >
                            <Smile size={22} className={showEmojiPicker ? 'text-primary' : ''} />
                        </button>
                        {showEmojiPicker && (
                            <div className="emoji-picker-container">
                                <EmojiPicker
                                    onEmojiClick={handleEmojiClick}
                                    theme={mode === 'dark' ? EmojiTheme.DARK : EmojiTheme.LIGHT}
                                    lazyLoadEmojis={true}
                                />
                            </div>
                        )}
                    </div>

                    <div className="input-wrapper">
                        <textarea
                            ref={textareaRef}
                            className="message-input"
                            placeholder={
                                isBlocked
                                    ? "You cannot send messages to a blocked user"
                                    : isUploading
                                        ? "Uploading file..."
                                        : "Type a message..."
                            }
                            value={newMessage}
                            onChange={(e) => {
                                setNewMessage(e.target.value);
                            }}
                            onKeyDown={handleKeyPress}
                            disabled={isBlocked || isUploading}
                            rows={1}
                        />
                    </div>

                    <button
                        className={`input-action-btn send-btn ${newMessage.trim() ? 'active' : ''}`}
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

