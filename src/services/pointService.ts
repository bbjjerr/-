import { supabase } from './supabaseClient';

export type PointHistoryType = 'redeem' | 'consume' | 'admin_add' | 'admin_deduct' | 'admin_set' | 'refund' | 'other';

export interface PointHistoryItem {
    id: number | string;
    title: string;
    description?: string;
    type?: PointHistoryType;
    points: string; // "+100" or "-50"
    date: string;
}

// 积分历史类型的中文映射
export const pointHistoryTypeLabels: Record<PointHistoryType, string> = {
    redeem: '兑换码兑换',
    consume: '积分消费',
    admin_add: '管理员添加',
    admin_deduct: '管理员扣除',
    admin_set: '管理员设置',
    refund: '退款返还',
    other: '其他'
};

export const pointService = {
    // 获取用户积分
    async getUserPoints(userId: string): Promise<number> {
        const { data, error } = await supabase
            .from('users')
            .select('points')
            .eq('id', userId)
            .single();

        if (error) throw error;
        return data.points;
    },

    // 获取积分历史
    async getPointHistory(userId: string): Promise<PointHistoryItem[]> {
        const { data, error } = await supabase
            .from('point_history')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return data.map((item: any) => ({
            id: item.id,
            title: item.title || pointHistoryTypeLabels[item.type as PointHistoryType] || '积分变动',
            description: item.description,
            type: item.type,
            points: item.points > 0 ? `+${item.points}` : `${item.points}`,
            date: item.transaction_date
        }));
    },

    // 兑换积分码
    async redeemCode(userId: string, code: string): Promise<boolean> {
        // 1. 查找有效兑换码
        const { data: codeData, error: codeError } = await supabase
            .from('redeem_codes')
            .select('*')
            .eq('code', code)
            .eq('is_active', true)
            .single();

        if (codeError || !codeData) return false;

        // 2. 检查使用次数 (如果有限制)
        if (codeData.max_uses > 0 && codeData.current_uses >= codeData.max_uses) {
            return false;
        }

        // 3. 事务处理：加积分 & 记录历史 & 更新兑换码使用次数
        // 由于 Supabase JS client 不支持复杂事务，这里分步执行，理想情况应用 RPC (Stored Procedure)

        // Step A: Update user points
        const { error: updateError } = await supabase.rpc('increment_points', {
            user_uuid: userId,
            amount: codeData.points
        });

        // 如果 RPC 不存在，使用普通 update (有并发风险 but acceptable for MVP)
        if (updateError) {
            // Fallback manual update
            const currentPoints = await this.getUserPoints(userId);
            await supabase.from('users').update({ points: currentPoints + codeData.points }).eq('id', userId);
        }

        // Step B: Add history
        await supabase.from('point_history').insert([{
            user_id: userId,
            title: '积分兑换码',
            description: `兑换码: ${code}`,
            type: 'redeem',
            amount: codeData.points,
            points: codeData.points,
            transaction_date: new Date().toISOString().split('T')[0]
        }]);

        // Step C: Increment usage
        await supabase.from('redeem_codes').update({
            current_uses: codeData.current_uses + 1
        }).eq('id', codeData.id);

        return true;
    }
};
