// src/app/api/test-db/route.ts
import { createSupabaseServerClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const supabase = await createSupabaseServerClient();

        // Test query: lấy 1 profile đầu tiên (hoặc count)
        const { data, error, count } = await supabase
            .from('profiles')
            .select('*', { count: 'exact' })
            .limit(1);

        if (error) throw error;

        return NextResponse.json({
            message: 'Kết nối Supabase thành công!',
            profilesCount: count,
            sampleProfile: data?.[0] || null,
        });
    } catch (err: any) {
        console.error('Supabase error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}