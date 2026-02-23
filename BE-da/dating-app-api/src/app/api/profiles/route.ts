// src/app/api/profiles/route.ts
import { createSupabaseServerClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET() {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .limit(20)
        .order('created_at', { ascending: false }); // sắp xếp mới nhất trước

    if (error) {
        console.error('GET profiles error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
}

export async function POST(request: Request) {
    const supabase = await createSupabaseServerClient();

    let body;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    // Validate cơ bản (nên dùng Zod ở production)
    if (!body.email || !body.full_name) {
        return NextResponse.json(
            { error: 'Missing required fields: email and full_name' },
            { status: 400 }
        );
    }

    const { data, error } = await supabase
        .from('profiles')
        .insert([body])
        .select()
        .single(); // Trả về object thay vì array

    if (error) {
        console.error('POST profile error:', error);
        return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data, { status: 201 });
}
