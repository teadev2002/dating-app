// src/app/api/profiles/route.ts
import { createSupabaseServerClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET() {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .limit(20);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
}

export async function POST(request: Request) {
    const supabase = await createSupabaseServerClient();

    let body;
    try {
        body = await request.json();
    } catch (e) {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { data, error } = await supabase
        .from('profiles')
        .insert([body])
        .select();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (!data || data.length === 0) {
        return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 });
    }

    return NextResponse.json(data[0], { status: 201 });
}