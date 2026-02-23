// src/app/api/matches/[id]/route.ts
import { createSupabaseServerClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
    const supabase = await createSupabaseServerClient();

    const params = await context.params;
    const id = params.id;

    if (!id) {
        return NextResponse.json({ error: 'Match ID is missing' }, { status: 400 });
    }

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
        .eq('id', id)
        .single();

    if (error || !data) {
        return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    return NextResponse.json(data);
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
    const supabase = await createSupabaseServerClient();

    const params = await context.params;
    const id = params.id;

    if (!id) {
        return NextResponse.json({ error: 'Match ID is missing' }, { status: 400 });
    }

    let body;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    // Chỉ cho phép update status
    if (!body.status || !['active', 'archived', 'blocked'].includes(body.status)) {
        return NextResponse.json(
            { error: 'Invalid or missing status. Allowed: active, archived, blocked' },
            { status: 400 }
        );
    }

    const { data, error } = await supabase
        .from('matches')
        .update({ status: body.status })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('PUT match error:', error);
        return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (!data) {
        return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    return NextResponse.json(data, { status: 200 });
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
    const supabase = await createSupabaseServerClient();

    const params = await context.params;
    const id = params.id;

    if (!id) {
        return NextResponse.json({ error: 'Match ID is missing' }, { status: 400 });
    }

    const { error } = await supabase
        .from('matches')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('DELETE match error:', error);
        return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: 'Match deleted successfully' }, { status: 200 });
}