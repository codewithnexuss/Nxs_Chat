export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            users: {
                Row: {
                    id: string
                    email: string
                    full_name: string
                    username: string
                    date_of_birth: string
                    gender: string
                    profile_picture: string | null
                    bio: string | null
                    is_profile_public: boolean
                    theme_settings: Json
                    username_last_changed: string | null
                    created_at: string
                    updated_at: string
                    last_seen: string | null
                    is_online: boolean
                }
                Insert: {
                    id?: string
                    email: string
                    full_name: string
                    username: string
                    date_of_birth: string
                    gender: string
                    profile_picture?: string | null
                    bio?: string | null
                    is_profile_public?: boolean
                    theme_settings?: Json
                    username_last_changed?: string | null
                    created_at?: string
                    updated_at?: string
                    last_seen?: string | null
                    is_online?: boolean
                }
                Update: {
                    id?: string
                    email?: string
                    full_name?: string
                    username?: string
                    date_of_birth?: string
                    gender?: string
                    profile_picture?: string | null
                    bio?: string | null
                    is_profile_public?: boolean
                    theme_settings?: Json
                    username_last_changed?: string | null
                    created_at?: string
                    updated_at?: string
                    last_seen?: string | null
                    is_online?: boolean
                }
            }
            chats: {
                Row: {
                    id: string
                    type: string
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    type: string
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    type?: string
                    created_at?: string
                    updated_at?: string
                }
            }
            chat_participants: {
                Row: {
                    id: string
                    chat_id: string
                    user_id: string
                    joined_at: string
                    left_at: string | null
                    is_active: boolean
                }
                Insert: {
                    id?: string
                    chat_id: string
                    user_id: string
                    joined_at?: string
                    left_at?: string | null
                    is_active?: boolean
                }
                Update: {
                    id?: string
                    chat_id?: string
                    user_id?: string
                    joined_at?: string
                    left_at?: string | null
                    is_active?: boolean
                }
            }
            messages: {
                Row: {
                    id: string
                    chat_id: string
                    sender_id: string
                    message_type: string
                    content: string
                    image_url: string | null
                    is_read: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    chat_id: string
                    sender_id: string
                    message_type: string
                    content: string
                    image_url?: string | null
                    is_read?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    chat_id?: string
                    sender_id?: string
                    message_type?: string
                    content?: string
                    image_url?: string | null
                    is_read?: boolean
                    created_at?: string
                    updated_at?: string
                }
            }
            status: {
                Row: {
                    id: string
                    user_id: string
                    content: string
                    visibility: string
                    created_at: string
                    expires_at: string
                    views_count: number
                }
                Insert: {
                    id?: string
                    user_id: string
                    content: string
                    visibility: string
                    created_at?: string
                    expires_at: string
                    views_count?: number
                }
                Update: {
                    id?: string
                    user_id?: string
                    content?: string
                    visibility?: string
                    created_at?: string
                    expires_at?: string
                    views_count?: number
                }
            }
            status_views: {
                Row: {
                    id: string
                    status_id: string
                    viewer_id: string
                    viewed_at: string
                }
                Insert: {
                    id?: string
                    status_id: string
                    viewer_id: string
                    viewed_at?: string
                }
                Update: {
                    id?: string
                    status_id?: string
                    viewer_id?: string
                    viewed_at?: string
                }
            }
            random_chat_queue: {
                Row: {
                    id: string
                    user_id: string
                    is_waiting: boolean
                    created_at: string
                    matched_at: string | null
                }
                Insert: {
                    id?: string
                    user_id: string
                    is_waiting?: boolean
                    created_at?: string
                    matched_at?: string | null
                }
                Update: {
                    id?: string
                    user_id?: string
                    is_waiting?: boolean
                    created_at?: string
                    matched_at?: string | null
                }
            }
            admins: {
                Row: {
                    id: string
                    email: string
                    password_hash: string
                    created_at: string
                    is_super_admin: boolean
                }
                Insert: {
                    id?: string
                    email: string
                    password_hash: string
                    created_at?: string
                    is_super_admin?: boolean
                }
                Update: {
                    id?: string
                    email?: string
                    password_hash?: string
                    created_at?: string
                    is_super_admin?: boolean
                }
            }
            analytics: {
                Row: {
                    id: string
                    date: string
                    total_users: number
                    active_users: number
                    total_messages: number
                    total_chats: number
                    new_users: number
                    random_chats_created: number
                    status_posted: number
                }
                Insert: {
                    id?: string
                    date: string
                    total_users?: number
                    active_users?: number
                    total_messages?: number
                    total_chats?: number
                    new_users?: number
                    random_chats_created?: number
                    status_posted?: number
                }
                Update: {
                    id?: string
                    date?: string
                    total_users?: number
                    active_users?: number
                    total_messages?: number
                    total_chats?: number
                    new_users?: number
                    random_chats_created?: number
                    status_posted?: number
                }
            }
        }
    }
}
