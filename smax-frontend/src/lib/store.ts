import { create } from 'zustand';
import { Session, AIConfig, Conversation, Message } from '../types';
import { api } from './api';
import { supabase } from './supabase';

interface StoreState {
  session: Session | null;
  login: (email: string) => Promise<void>;
  logout: () => void;
  validateSession: () => Promise<void>;
  updateMerchant: (data: Partial<Session['merchant']>) => Promise<void>;
  
  // Minimal UI state
  isSidebarOpen: boolean;
  toggleSidebar: () => void;

  // AI Configuration
  aiConfig: AIConfig;
  fetchAIConfig: () => Promise<void>;
  updateAIConfig: (config: Partial<AIConfig>) => Promise<void>;

  // Conversations Management
  selectedConversationId: string | null;
  selectConversation: (id: string | null) => void;
  conversations: Conversation[];
  fetchConversations: () => Promise<void>;
  
  // Messages for the Conversations Page
  conversationMessages: Record<string, Message[]>;
  fetchMessages: (conversationId: string) => Promise<void>;
  sendMessage: (conversationId: string, content: string, role: 'visitor' | 'ai' | 'agent') => Promise<void>;

  // Realtime Subscriptions
  subscribeToConversations: () => void;
  subscribeToMessages: (conversationId: string) => void;

  // Chat Widget State
  isChatWidgetOpen: boolean;
  toggleChatWidget: () => void;
  openChatWidget: () => void;
  closeChatWidget: () => void;
  widgetMessages: Message[]; 
  addWidgetMessage: (msg: Message) => void;
  isWidgetTyping: boolean;
  setWidgetTyping: (typing: boolean) => void;
}

export const useStore = create<StoreState>()((set, get) => ({
      session: null,
      login: async (email) => {
        try {
          // 1. Get current authenticated user
          const { data: { user } } = await supabase.auth.getUser();
          
          if (!user) {
             throw new Error('No authenticated user found');
          }

          // 2. Find merchant associated with this user
          const { data: merchant, error } = await supabase
            .from('merchants')
            .select('*')
            .eq('owner_id', user.id)
            .single();

          if (error && error.code !== 'PGRST116') { // PGRST116 is "Row not found"
             throw error;
          }

          let merchantData = merchant;

          // 3. If no merchant exists, create one (Auto-onboarding for demo)
          if (!merchantData) {
             const { data: newMerchant, error: createError } = await supabase
                .from('merchants')
                .insert({
                   owner_id: user.id,
                   name: (user.user_metadata?.name || email.split('@')[0]) + "'s Business",
                   business_type: 'other',
                   ai_trained: false
                })
                .select()
                .single();
             
             if (createError) throw createError;
             merchantData = newMerchant;
          }

          set({
            session: {
              isLoggedIn: true,
              user: {
                id: user.id,
                email: user.email || email,
                name: user.user_metadata?.name || email.split('@')[0],
              },
              merchant: {
                id: merchantData.id,
                name: merchantData.name,
                business_type: merchantData.business_type,
                website: merchantData.website,
                ai_trained: merchantData.ai_trained,
              },
              sessionExpiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24h
            },
          });
          
          // Refresh lists
          get().fetchConversations();
          get().fetchAIConfig();

        } catch (error) {
          console.error('Login failed', error);
          throw error; // Let UI handle error
        }
      },
      logout: async () => {
          await supabase.auth.signOut();
          set({ session: null });
      },
      validateSession: async () => {
        // 1. Check Supabase Auth first (Source of Truth)
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
            set({ session: null });
            return;
        }

        // 2. We have a user, now find their merchant
        try {
          const { data: merchant, error } = await supabase
            .from('merchants')
            .select('*')
            .eq('owner_id', user.id)
            .maybeSingle();

          if (error) throw error;

          if (merchant) {
             // 3a. Merchant exists, restore session
             set({
               session: {
                 isLoggedIn: true,
                 user: {
                   id: user.id,
                   email: user.email || 'user@example.com',
                   name: user.user_metadata?.name || 'User',
                 },
                 merchant: {
                    id: merchant.id,
                    name: merchant.name,
                    business_type: merchant.business_type,
                    website: merchant.website,
                    ai_trained: merchant.ai_trained,
                 },
                 sessionExpiresAt: Date.now() + 24 * 60 * 60 * 1000,
               }
             });
          } else {
             // 3b. User exists but Merchant missing (Zombie user state). Create Merchant.
             console.log('User authenticated but no merchant found. Creating new merchant...');
             const { data: newMerchant, error: createError } = await supabase
                .from('merchants')
                .insert({
                   owner_id: user.id,
                   name: (user.user_metadata?.name || 'My Business'),
                   business_type: 'other',
                   ai_trained: false
                })
                .select()
                .single();
             
             if (createError) throw createError;

             if (newMerchant) {
                 set({
                   session: {
                     isLoggedIn: true,
                     user: {
                       id: user.id,
                       email: user.email || 'user@example.com',
                       name: user.user_metadata?.name || 'User',
                     },
                     merchant: {
                        id: newMerchant.id,
                        name: newMerchant.name,
                        business_type: newMerchant.business_type,
                        website: newMerchant.website,
                        ai_trained: newMerchant.ai_trained,
                     },
                     sessionExpiresAt: Date.now() + 24 * 60 * 60 * 1000,
                   }
                 });
             }
          }
        } catch (error) {
          console.error('Session validation failed:', error);
          set({ session: null });
        }
      },
      updateMerchant: async (data) => {
        let { session } = get();
        
        // Ensure session is valid before update
        if (!session?.merchant.id) {
            await get().validateSession();
            session = get().session;
        }

        if (!session?.merchant.id) return;
        
        // Optimistic update
        set((state) => ({
          session: state.session
            ? { ...state.session, merchant: { ...state.session.merchant, ...data } }
            : null,
        }));

        try {
          await api.updateMerchant(session.merchant.id, data as any);
        } catch (error) {
          console.error('Failed to update merchant', error);
          // Retry logic could be added here similar to updateAIConfig
        }
      },
      
      isSidebarOpen: true,
      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

      // AI Configuration
      aiConfig: {
        openai_api_key: '',
        openai_base_url: 'https://token.ai.vn/v1',
        model: 'gpt-4o-mini',
        temperature: 0.7,
        max_tokens: 500,
        system_prompt: '',
        data_sources: {
          products: true,
          bookings: true,
          faqs: true,
          orders: true,
          policies: true,
        },
      },
      fetchAIConfig: async () => {
        let { session } = get();
        if (!session?.merchant.id) {
           await get().validateSession();
           session = get().session;
        }
        
        if (!session?.merchant.id) return;
        try {
          const config = await api.getAIConfig(session.merchant.id);
          if (config) {
            set({ aiConfig: config as any });
          }
        } catch (error) {
          console.error('Failed to fetch AI config', error);
        }
      },
      updateAIConfig: async (config) => {
        let { session, aiConfig } = get();
        
        // 1. Ensure session is valid
        if (!session?.merchant.id) {
            await get().validateSession();
            session = get().session;
        }

        if (!session?.merchant.id) {
            console.error('Cannot update AI config: No valid merchant session');
            return;
        }
        
        const newConfig = { ...aiConfig, ...config };
        set({ aiConfig: newConfig });
        
        try {
          await api.updateAIConfig(session.merchant.id, config);
        } catch (error: any) {
          console.error('Failed to update AI config', error);
          // 2. Retry on Foreign Key Error (Invalid Merchant ID)
          if (error?.code === '23503') { 
             console.log('Merchant ID invalid. Recovering session and retrying...');
             await get().validateSession();
             const newSession = get().session;
             if (newSession?.merchant.id) {
                 await api.updateAIConfig(newSession.merchant.id, config);
             }
          }
        }
      },

      // Conversations Management
      selectedConversationId: null,
      selectConversation: (id) => set({ selectedConversationId: id }),
      conversations: [],
      fetchConversations: async () => {
        const { session } = get();
        if (!session?.merchant.id) return;
        try {
          const conversations = await api.getConversations(session.merchant.id);
          set({ conversations });
        } catch (error) {
          console.error('Failed to fetch conversations', error);
        }
      },
      
      conversationMessages: {},
      fetchMessages: async (conversationId) => {
        try {
          const messages = await api.getMessages(conversationId);
          set((state) => ({
            conversationMessages: {
              ...state.conversationMessages,
              [conversationId]: messages
            }
          }));
        } catch (error) {
          console.error('Failed to fetch messages', error);
        }
      },
      sendMessage: async (conversationId, content, role) => {
        // Optimistic update
        const tempId = 'temp_' + Date.now();
        const newMessage: Message = {
          id: tempId,
          conversation_id: conversationId,
          role,
          content,
          created_at: new Date().toISOString()
        };
        
        set((state) => ({
          conversationMessages: {
            ...state.conversationMessages,
            [conversationId]: [...(state.conversationMessages[conversationId] || []), newMessage]
          }
        }));

        const { session } = get();
        try {
          const sentMessage = await api.sendMessage(conversationId, content, role, session?.merchant?.id);
          // Replace temp message with real one
          set((state) => ({
            conversationMessages: {
              ...state.conversationMessages,
              [conversationId]: state.conversationMessages[conversationId].map(m => 
                m.id === tempId ? sentMessage : m
              )
            }
          }));
        } catch (error) {
          console.error('Failed to send message', error);
        }
      },

      subscribeToConversations: () => {
        const { session } = get();
        if (!session?.merchant.id) return;

        supabase
          .channel('conversations-list')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'conversations', filter: `merchant_id=eq.${session.merchant.id}` },
            (payload) => {
              const mapConv = (c: any): Conversation => ({
                ...c,
                visitor_name: c.visitor_name || 'Visitor',
                channel: c.channel || 'website',
                last_message: c.last_message || 'Start of conversation',
                unread_count: c.unread_count || 0
              });

              if (payload.eventType === 'INSERT') {
                set((state) => ({ conversations: [mapConv(payload.new), ...state.conversations] }));
              } else if (payload.eventType === 'UPDATE') {
                set((state) => ({
                  conversations: state.conversations.map(c => 
                    c.id === payload.new.id ? { ...c, ...mapConv(payload.new) } : c
                  ).sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
                }));
              }
            }
          )
          .subscribe();
      },

      subscribeToMessages: (conversationId) => {
        supabase
          .channel(`messages-${conversationId}`)
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
            (payload) => {
              set((state) => {
                const currentMessages = state.conversationMessages[conversationId] || [];
                // Avoid duplicates if we optimistically added it
                if (currentMessages.some(m => m.id === payload.new.id)) return state;
                
                const newMsgRaw = payload.new as any;
                const newMsg: Message = {
                  ...newMsgRaw,
                  role: newMsgRaw.sender === 'visitor' ? 'visitor' : (newMsgRaw.sender === 'ai' ? 'ai' : 'agent'),
                  sender: newMsgRaw.sender
                };

                return {
                  conversationMessages: {
                    ...state.conversationMessages,
                    [conversationId]: [...currentMessages, newMsg]
                  }
                };
              });
            }
          )
          .subscribe();
      },

      // Chat Widget
      isChatWidgetOpen: false,
      toggleChatWidget: () => set((state) => ({ isChatWidgetOpen: !state.isChatWidgetOpen })),
      openChatWidget: () => set({ isChatWidgetOpen: true }),
      closeChatWidget: () => set({ isChatWidgetOpen: false }),
      widgetMessages: [
        {
          id: 'welcome',
          conversation_id: 'demo',
          role: 'ai',
          content: "Hi there! 👋 I'm your booking assistant. How can I help you today?",
          created_at: new Date().toISOString(),
          suggestedActions: ['Book Appointment', 'View Services', 'Check Opening Hours'],
        }
      ],
      addWidgetMessage: (msg) => set((state) => {
        // Prevent duplicates
        if (state.widgetMessages.some(m => m.id === msg.id)) return state;
        return { widgetMessages: [...state.widgetMessages, msg] };
      }),
      isWidgetTyping: false,
      setWidgetTyping: (typing) => set({ isWidgetTyping: typing }),
    }));
