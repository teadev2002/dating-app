// src/app/api/matches/route.ts
import { createSupabaseServerClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const supabase = await createSupabaseServerClient();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
        return NextResponse.json({ error: 'user_id query param is required' }, { status: 400 });
    }

    // Lấy tất cả match mà user là profile_1 hoặc profile_2
    const { data, error } = await supabase
        .from('matches')
        .select(`
      id,
      created_at,
      status,
      profile_1_id,
      profile_2_id,
      profile_1:profiles!profile_1_id (id, full_name, age, gender, bio, avatar_url),
      profile_2:profiles!profile_2_id (id, full_name, age, gender, bio, avatar_url)
    `)
        .or(`profile_1_id.eq.${userId},profile_2_id.eq.${userId}`)
        .order('created_at', { ascending: false })
        .limit(20);

    if (error) {
        console.error('GET matches error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Format để trả về đối phương (loại bỏ profile của chính user)
    const formatted = data?.map(match => {
        const isProfile1 = match.profile_1_id === userId;
        const opponent = isProfile1 ? match.profile_2 : match.profile_1;
        return {
            match_id: match.id,
            opponent,
            status: match.status,
            created_at: match.created_at
        };
    }) || [];

    return NextResponse.json(formatted);
}