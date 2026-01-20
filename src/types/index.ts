// Database Types
export interface User {
    id: string;
    email: string;
    full_name: string;
    username: string;
    date_of_birth: string;
    gender: 'male' | 'female' | 'other';
    profile_picture: string | null;
    bio: string | null;
    is_profile_public: boolean;
    theme_settings: ThemeSettings;
    username_last_changed: string | null;
    created_at: string;
    updated_at: string;
    last_seen: string | null;
    is_online: boolean;
    is_banned?: boolean;
}

export interface ThemeSettings {
    mode: 'light' | 'dark' | 'auto';
    primaryColor: string;
}

export interface Chat {
    id: string;
    type: 'private' | 'random';
    created_at: string;
    updated_at: string;
}

export interface ChatParticipant {
    id: string;
    chat_id: string;
    user_id: string;
    joined_at: string;
    left_at: string | null;
    is_active: boolean;
}

export interface Message {
    id: string;
    chat_id: string;
    sender_id: string;
    message_type: 'text' | 'image' | 'emoji' | 'file' | 'video';
    content: string;
    image_url: string | null;
    file_url?: string | null;
    parent_id: string | null;
    is_read: boolean;
    is_deleted: boolean;
    created_at: string;
    updated_at: string;
}

export interface Status {
    id: string;
    user_id: string;
    content: string;
    visibility: 'contacts' | 'anyone';
    created_at: string;
    expires_at: string;
    views_count: number;
}

export interface StatusView {
    id: string;
    status_id: string;
    viewer_id: string;
    viewed_at: string;
}

export interface RandomChatQueue {
    id: string;
    user_id: string;
    is_waiting: boolean;
    created_at: string;
    matched_at: string | null;
}

export interface Admin {
    id: string;
    email: string;
    password_hash: string;
    created_at: string;
    is_super_admin: boolean;
}

export interface Analytics {
    id: string;
    date: string;
    total_users: number;
    active_users: number;
    total_messages: number;
    total_chats: number;
    new_users: number;
    random_chats_created: number;
    status_posted: number;
}

// Extended types with relations
export interface ChatWithParticipants extends Chat {
    participants: (ChatParticipant & { user: User })[];
    last_message?: Message;
}

export interface MessageWithSender extends Message {
    sender: User;
    reply_to?: MessageWithSender | null;
}

export interface StatusWithUser extends Status {
    user: User;
}
