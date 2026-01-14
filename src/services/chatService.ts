import { supabase } from './supabaseClient';

export interface ChatSession {
    id: string; // Chat ID
    name: string; // Doctor Name
    image: string; // Doctor Image
    doctor_id: string;
    message: string; // Last message
    time: string; // Last message time
    unread: number;
}

export interface Message {
    id: number | string;
    sender: 'user' | 'doctor';
    text: string;
    time: string;
    image?: string;
}

export const chatService = {
    formatChatTime(iso: string | null | undefined): string {
        if (!iso) return '';
        const dt = new Date(iso);
        const now = new Date();
        const isSameDay =
            dt.getFullYear() === now.getFullYear() &&
            dt.getMonth() === now.getMonth() &&
            dt.getDate() === now.getDate();

        if (isSameDay) {
            return dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        return dt.toLocaleDateString([], { month: '2-digit', day: '2-digit' });
    },

    // 获取用户的所有聊天
    async getUserChats(userId: string): Promise<ChatSession[]> {
        const { data, error } = await supabase
            .from('chats')
            .select(`
        id,
        doctor_id,
        last_message,
        last_message_at,
        unread_count,
        doctors (
            name,
            image_url
        ),
        messages (
            content,
            created_at,
            sender_type
        )
      `)
            .eq('user_id', userId)
            .order('created_at', { foreignTable: 'messages', ascending: false })
            .limit(1, { foreignTable: 'messages' })
            .order('last_message_at', { ascending: false });

        if (error) throw error;

        return data.map((chat: any) => {
            const lastMsg = Array.isArray(chat.messages) ? chat.messages[0] : null;
            const lastContent = lastMsg?.content || chat.last_message || '';
            const lastAt = lastMsg?.created_at || chat.last_message_at;
            const senderType = lastMsg?.sender_type as ('user' | 'doctor' | undefined);

            const preview = lastContent
                ? (senderType === 'user' ? `我：${lastContent}` : lastContent)
                : '暂无消息';

            return {
                id: chat.id,
                doctor_id: chat.doctor_id,
                name: chat.doctors?.name || 'Unknown',
                image: chat.doctors?.image_url || '',
                message: preview,
                time: this.formatChatTime(lastAt),
                unread: chat.unread_count
            };
        });
    },

    // 获取特定聊天的消息
    async getChatMessages(chatId: string): Promise<Message[]> {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('chat_id', chatId)
            .order('created_at', { ascending: true });

        if (error) throw error;

        return data.map((msg: any) => ({
            id: msg.id,
            sender: msg.sender_type,
            text: msg.content,
            time: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            image: msg.image_url
        }));
    },

    // 创建或获取与医生的聊天
    async getOrCreateChat(userId: string, doctorId: string) {
        // 先尝试查找
        const { data, error } = await supabase
            .from('chats')
            .select('*')
            .eq('user_id', userId)
            .eq('doctor_id', doctorId)
            .single();

        if (data) return data;

        // 不存在则创建
        if (error && error.code === 'PGRST116') { // No rows found code
            const { data: newChat, error: createError } = await supabase
                .from('chats')
                .insert([{ user_id: userId, doctor_id: doctorId }])
                .select()
                .single();

            if (createError) throw createError;
            return newChat;
        }

        throw error;
    },

    // 发送消息
    async sendMessage(userId: string, chatId: string, content: string) {
        // 1. 插入消息
        const { data, error } = await supabase
            .from('messages')
            .insert([{
                chat_id: chatId,
                sender_id: userId,
                sender_type: 'user',
                content: content
            }])
            .select()
            .single();

        if (error) throw error;

        // 2. 更新聊天最后一条消息
        await supabase
            .from('chats')
            .update({
                last_message: content,
                last_message_at: new Date().toISOString()
            })
            .eq('id', chatId);

        return data;
    },

    // 订阅新消息 (Realtime)
    subscribeToChat(chatId: string, callback: (msg: any) => void) {
        return supabase
            .channel(`chat:${chatId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `chat_id=eq.${chatId}`
                },
                (payload) => {
                    callback(payload.new);
                }
            )
            .subscribe();
    }
};
