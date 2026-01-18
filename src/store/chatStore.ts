import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Chat, Message, ChatWithParticipants, MessageWithSender, User } from '../types';

interface ChatState {
    chats: ChatWithParticipants[];
    activeChat: ChatWithParticipants | null;
    messages: MessageWithSender[];
    isLoading: boolean;

    // Actions
    setChats: (chats: ChatWithParticipants[]) => void;
    setActiveChat: (chat: ChatWithParticipants | null) => void;
    setMessages: (messages: MessageWithSender[]) => void;
    addMessage: (message: MessageWithSender) => void;
    fetchChats: (userId: string) => Promise<void>;
    fetchMessages: (chatId: string) => Promise<void>;
    sendMessage: (chatId: string, senderId: string, content: string, type?: 'text' | 'image' | 'emoji') => Promise<void>;
    createChat: (userId: string, participantId: string) => Promise<Chat>;
    markMessagesAsRead: (chatId: string, userId: string) => Promise<void>;
}

export const useChatStore = create<ChatState>((set, get) => ({
    chats: [],
    activeChat: null,
    messages: [],
    isLoading: false,

    setChats: (chats) => set({ chats }),

    setActiveChat: (activeChat) => set({ activeChat }),

    setMessages: (messages) => set({ messages }),

    addMessage: (message) => set((state) => ({
        messages: [...state.messages, message]
    })),

    fetchChats: async (userId) => {
        set({ isLoading: true });
        try {
            // Get all chats where user is a participant
            const { data: participations, error: partError } = await supabase
                .from('chat_participants')
                .select(`
          chat_id,
          chats (
            id,
            type,
            created_at,
            updated_at
          )
        `)
                .eq('user_id', userId)
                .eq('is_active', true);

            if (partError) throw partError;

            const chatIds = (participations as any[])?.map((p: any) => p.chat_id) || [];

            if (chatIds.length === 0) {
                set({ chats: [], isLoading: false });
                return;
            }

            // Get all participants for these chats
            const { data: allParticipants, error: allPartError } = await supabase
                .from('chat_participants')
                .select(`
          *,
          user:users (*)
        `)
                .in('chat_id', chatIds)
                .eq('is_active', true);

            if (allPartError) throw allPartError;

            // Get last messages for each chat
            const { data: lastMessages, error: msgError } = await supabase
                .from('messages')
                .select('*')
                .in('chat_id', chatIds)
                .order('created_at', { ascending: false });

            if (msgError) throw msgError;

            // Group by chat
            const chatsWithData: ChatWithParticipants[] = (participations as any[])?.map((p: any) => {
                const chat = p.chats as unknown as Chat;
                const participants = (allParticipants as any[])?.filter((ap: any) => ap.chat_id === chat.id) || [];
                const lastMessage = (lastMessages as any[])?.find((m: any) => m.chat_id === chat.id);

                return {
                    ...chat,
                    participants: participants.map((part: any) => ({
                        ...part,
                        user: part.user as User
                    })),
                    last_message: lastMessage as Message | undefined
                };
            }) || [];

            // Sort by last message time
            chatsWithData.sort((a, b) => {
                const aTime = a.last_message?.created_at || a.created_at;
                const bTime = b.last_message?.created_at || b.created_at;
                return new Date(bTime).getTime() - new Date(aTime).getTime();
            });

            set({ chats: chatsWithData, isLoading: false });
        } catch (error) {
            console.error('Error fetching chats:', error);
            set({ isLoading: false });
        }
    },

    fetchMessages: async (chatId) => {
        try {
            const { data, error } = await supabase
                .from('messages')
                .select(`
          *,
          sender:users (*)
        `)
                .eq('chat_id', chatId)
                .order('created_at', { ascending: true });

            if (error) throw error;

            set({
                messages: ((data || []) as any[]).map((m: any) => ({
                    ...m,
                    sender: m.sender as User
                })) as MessageWithSender[]
            });
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    },

    sendMessage: async (chatId, senderId, content, type = 'text') => {
        try {
            const { data, error } = await supabase
                .from('messages')
                .insert({
                    chat_id: chatId,
                    sender_id: senderId,
                    content,
                    message_type: type
                } as any)
                .select(`
          *,
          sender:users (*)
        `)
                .single();

            if (error) throw error;

            const message = {
                ...(data as any),
                sender: (data as any).sender as User
            } as MessageWithSender;

            get().addMessage(message);
        } catch (error) {
            console.error('Error sending message:', error);
            throw error;
        }
    },

    createChat: async (userId, participantId) => {
        try {
            // Check if chat already exists between these users
            const { data: existingParticipations } = await supabase
                .from('chat_participants')
                .select('chat_id')
                .eq('user_id', userId)
                .eq('is_active', true);

            const userChatIds = (existingParticipations as any[])?.map((p: any) => p.chat_id) || [];

            if (userChatIds.length > 0) {
                const { data: matchingParticipation } = await supabase
                    .from('chat_participants')
                    .select('chat_id')
                    .eq('user_id', participantId)
                    .eq('is_active', true)
                    .in('chat_id', userChatIds)
                    .single();

                if (matchingParticipation) {
                    // Return existing chat
                    const { data: existingChat } = await supabase
                        .from('chats')
                        .select('*')
                        .eq('id', (matchingParticipation as any).chat_id)
                        .single();

                    if (existingChat) return existingChat as unknown as Chat;
                }
            }

            // Create new chat
            const { data: newChat, error: chatError } = await supabase
                .from('chats')
                .insert({ type: 'private' } as any)
                .select()
                .single();

            if (chatError) throw chatError;

            // Add participants
            const { error: partError } = await supabase
                .from('chat_participants')
                .insert([
                    { chat_id: (newChat as any).id, user_id: userId },
                    { chat_id: (newChat as any).id, user_id: participantId }
                ] as any);

            if (partError) throw partError;

            return newChat as unknown as Chat;
        } catch (error) {
            console.error('Error creating chat:', error);
            throw error;
        }
    },

    markMessagesAsRead: async (chatId, userId) => {
        try {
            await supabase
                .from('messages')
                .update({ is_read: true } as any)
                .eq('chat_id', chatId)
                .neq('sender_id', userId)
                .eq('is_read', false);
        } catch (error) {
            console.error('Error marking messages as read:', error);
        }
    }
}));
