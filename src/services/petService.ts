import { supabase } from './supabaseClient';
import { Pet } from '../../types';

export const petService = {
    // 获取用户的所有宠物
    async getUserPets(userId: string): Promise<Pet[]> {
        const { data, error } = await supabase
            .from('pets')
            .select('*')
            .eq('user_id', userId);

        if (error) {
            console.error('Error fetching pets:', error);
            throw error;
        }

        return data.map((p: any) => ({
            id: p.id,
            name: p.name,
            breed: p.breed,
            image: p.image_url, // map image_url to image
            avatar: p.avatar_url || p.image_url,
            type: p.pet_type,
            gender: p.gender,
            age: p.age.toString(), // 前端类型为 string
            weight: p.weight.toString(),
            description: p.description,
            medical: p.medical_records
        }));
    },

    // 添加新宠物
    async addPet(petData: {
        userId: string;
        name: string;
        breed: string;
        type: 'dog' | 'cat';
        gender: 'male' | 'female';
        age: number;
        weight: number;
        description?: string;
        image?: string;
    }) {
        const { data, error } = await supabase
            .from('pets')
            .insert([{
                user_id: petData.userId,
                name: petData.name,
                breed: petData.breed,
                pet_type: petData.type,
                gender: petData.gender,
                age: petData.age,
                weight: petData.weight,
                description: petData.description,
                image_url: petData.image,
                avatar_url: petData.image
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    }
};
