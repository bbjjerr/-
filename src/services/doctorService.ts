import { supabase } from './supabaseClient';
import { Doctor } from '../../types'; // 假设 types.ts 在根目录或上级目录

export const doctorService = {
    // 获取所有医生
    async getAllDoctors(): Promise<Doctor[]> {
        const { data, error } = await supabase
            .from('doctors')
            .select('*')
            .order('rating', { ascending: false });

        if (error) {
            console.error('Error fetching doctors:', error);
            throw error;
        }

        // 转换 DB 字段到前端类型 (如果有差异)
        return data.map((doc: any) => ({
            id: doc.id,
            name: doc.name,
            title: doc.title,
            rating: doc.rating,
            image: doc.image_url, // map image_url to image
            tags: doc.tags,
            price: doc.price,
            awards: doc.awards,
            satisfaction: doc.satisfaction
        }));
    },

    // 根据 ID 获取医生
    async getDoctorById(id: string): Promise<Doctor | null> {
        const { data, error } = await supabase
            .from('doctors')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error(`Error fetching doctor ${id}:`, error);
            return null;
        }

        return {
            id: data.id,
            name: data.name,
            title: data.title,
            rating: data.rating,
            image: data.image_url,
            tags: data.tags,
            price: data.price,
            awards: data.awards,
            satisfaction: data.satisfaction
        };
    },

    // 按分类获取医生 (前端筛选可能更简单，但这是后端实现方式)
    async getDoctorsByCategory(category: string): Promise<Doctor[]> {
        // 这里使用 PostgreSQL 的数组包含操作符 @> 
        // category 映射需要注意，这里简化为只获取所有，前端过滤，或者精确匹配
        // 如果实现精确匹配 tags，可以使用 .contains('tags', [category])

        // 目前为了简化，调用 getAllDoctors 并在前端过滤
        return this.getAllDoctors();
    }
};
