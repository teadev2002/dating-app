// src/app/api/profiles/[id]/route.ts
import { createSupabaseServerClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
    const supabase = await createSupabaseServerClient();

    // Await params để lấy object thật
    const params = await context.params;
    console.log('Received ID:', params.id);

    const id = params.id;

    if (!id) {
        return NextResponse.json({ error: 'Profile ID is missing or invalid' }, { status: 400 });
    }

    // Kiểm tra UUID format (optional)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
        return NextResponse.json({ error: 'Invalid UUID format' }, { status: 400 });
    }

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error('GET profile by ID error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
        return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json(data);
}

// Tương tự cho PUT và DELETE: await context.params
// src/app/api/profiles/[id]/route.ts (hàm PUT)

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
    const supabase = await createSupabaseServerClient();

    const params = await context.params;
    const id = params.id;

    if (!id) {
        return NextResponse.json({ error: 'Profile ID is missing' }, { status: 400 });
    }

    let body;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    // Validate age (tương tự CHECK constraint)
    if (body.age !== undefined) {
        if (typeof body.age !== 'number' || body.age < 18 || body.age > 120) {
            return NextResponse.json(
                { error: 'Age must be between 18 and 120' },
                { status: 400 }
            );
        }
    }

    // Các validate khác nếu cần (email, gender...)

    const { data, error } = await supabase
        .from('profiles')
        .update(body)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (!data) {
        return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json(data, { status: 200 });
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
    const supabase = await createSupabaseServerClient();

    const params = await context.params;
    const id = params.id;

    if (!id) {
        return NextResponse.json({ error: 'Profile ID is missing' }, { status: 400 });
    }

    const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: 'Profile deleted successfully' }, { status: 200 });
}