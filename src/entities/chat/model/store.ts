import { aiStationApi, type ChatSession, type ChatSessionResponse } from '@/services/api';
import { create } from 'zustand';

interface ChatHistoryStore {
    sessions: ChatSession[];
    currentSession: ChatSessionResponse | null;
    isLoading: boolean;
    error: string | null;

    // Actions
    fetchChatList: (params?: {
        limit?: number;
        mode?: 'explore' | 'quest';
        function_type?: 'rag_chat' | 'vlm_chat' | 'route_recommend';
    }) => Promise<void>;
    fetchChatSession: (sessionId: string) => Promise<void>;
    clearCurrentSession: () => void;
}

export const useChatHistoryStore = create<ChatHistoryStore>((set, get) => ({
    sessions: [],
    currentSession: null,
    isLoading: false,
    error: null,

    fetchChatList: async (params) => {
        set({ isLoading: true, error: null });
        try {
            console.log('📞 Fetching chat list with params:', params);
            const response = await aiStationApi.getChatList(params);
            console.log('✅ Chat list response:', {
                count: response.sessions.length,
                sessions: response.sessions.map(s => ({
                    id: s.session_id,
                    mode: s.mode,
                    function_type: s.function_type,
                    title: s.title,
                    has_image: s.chats?.[0]?.image_url ? true : false,
                    image_url: s.chats?.[0]?.image_url?.substring(0, 50)
                }))
            });
            set({ sessions: response.sessions, isLoading: false });
        } catch (error) {
            console.error('❌ Failed to fetch chat list:', error);
            set({
                error: error instanceof Error ? error.message : 'Failed to load chat list.',
                isLoading: false,
            });
        }
    },

    fetchChatSession: async (sessionId: string) => {
        set({ isLoading: true, error: null });
        try {
            console.log('📞 Fetching chat session:', sessionId);
            const response = await aiStationApi.getChatSession(sessionId);
            console.log('✅ Chat session response:', {
                session_id: response.session?.session_id,
                chat_count: response.chats?.length,
                images: response.chats?.filter(c => c.image_url).map(c => ({
                    id: c.id,
                    image_url: c.image_url?.substring(0, 50)
                }))
            });
            set({ currentSession: response, isLoading: false });
        } catch (error) {
            console.error('❌ Failed to fetch chat session:', error);
            set({
                error: error instanceof Error ? error.message : 'Failed to load chat history.',
                isLoading: false,
            });
        }
    },

    clearCurrentSession: () => {
        set({ currentSession: null });
    },
}));

