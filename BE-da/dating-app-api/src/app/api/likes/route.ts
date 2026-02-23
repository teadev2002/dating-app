import { createSupabaseServerClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET() {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
        .from('likes')
        .select('*')
        .limit(50)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('GET likes error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
}

// src/app/api/likes/route.ts (phần POST)
// src/app/api/likes/route.ts (POST hoàn chỉnh)
export async function POST(request: Request) {
    const supabase = await createSupabaseServerClient();

    let body;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { from_profile_id, to_profile_id } = body;

    if (!from_profile_id || !to_profile_id) {
        return NextResponse.json(
            { error: 'Missing required fields: from_profile_id and to_profile_id' },
            { status: 400 }
        );
    }

    if (from_profile_id === to_profile_id) {
        return NextResponse.json({ error: 'Cannot like yourself' }, { status: 400 });
    }

    // Chuẩn hóa UUID thành lowercase
    const fromId = from_profile_id.toLowerCase().trim();
    const toId = to_profile_id.toLowerCase().trim();

    console.log(`POST like from ${fromId} to ${toId}`);

    let likeCreated = false;
    let likeData = null;

    // Bước 1: Kiểm tra like đã tồn tại chưa
    const { data: existingLike } = await supabase
        .from('likes')
        .select('*')
        .eq('from_profile_id', fromId)
        .eq('to_profile_id', toId)
        .maybeSingle();

    if (!existingLike) {
        console.log('Like not found, inserting new...');

        const { data: newLike, error: insertError } = await supabase
            .from('likes')
            .insert([{ from_profile_id: fromId, to_profile_id: toId }])
            .select()
            .single();

        if (insertError) {
            if (insertError.code === '23505') {
                console.log('Duplicate like detected (unique constraint)');
            } else {
                console.error('Insert like error:', insertError);
                return NextResponse.json({ error: insertError.message }, { status: 400 });
            }
        } else {
            likeCreated = true;
            likeData = newLike;
            console.log('Like inserted successfully');
        }
    } else {
        likeData = existingLike;
        console.log('Like already exists');
    }

    // Bước 2: Kiểm tra like hai chiều với retry (xử lý delay commit)
    let reverseLike = null;
    for (let attempt = 0; attempt < 3; attempt++) {
        const { data } = await supabase
            .from('likes')
            .select('id')
            .eq('from_profile_id', toId)
            .eq('to_profile_id', fromId)
            .maybeSingle();

        if (data) {
            reverseLike = data;
            console.log(`Reverse like found on attempt ${attempt + 1}`);
            break;
        }

        console.log(`Attempt ${attempt + 1}: No reverse like yet, retrying...`);
        await new Promise(resolve => setTimeout(resolve, 150)); // Delay 150ms
    }

    let matchCreated = false;
    let matchId = null;

    if (reverseLike) {
        console.log('Mutual like confirmed! Checking match...');

        const profile1 = fromId < toId ? fromId : toId;
        const profile2 = fromId > toId ? fromId : toId;

        // Kiểm tra match tồn tại
        const { data: existingMatch } = await supabase
            .from('matches')
            .select('id')
            .eq('profile_1_id', profile1)
            .eq('profile_2_id', profile2)
            .maybeSingle();

        if (!existingMatch) {
            console.log('No match yet, creating new...');

            const { data: newMatch, error: matchError } = await supabase
                .from('matches')
                .insert([{
                    profile_1_id: profile1,
                    profile_2_id: profile2,
                    status: 'active'
                }])
                .select('id')
                .single();

            if (matchError) {
                console.error('Create match error:', matchError.message);
            } else {
                matchCreated = true;
                matchId = newMatch.id;
                console.log('Match created successfully:', matchId);
            }
        } else {
            console.log('Match already exists:', existingMatch.id);
        }
    } else {
        console.log('No mutual like after retries');
    }

    // Response cuối
    return NextResponse.json(
        {
            message: likeCreated ? 'Like created successfully' : 'Like already exists',
            like: likeData,
            matchCreated,
            matchId
        },
        { status: likeCreated ? 201 : 200 }
    );
}
// src/app/api/likes/route.ts (hoặc endpoint riêng)
export async function DELETE(request: Request) {
    const supabase = await createSupabaseServerClient();

    let body;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const fromId = body.from_profile_id;
    const toId = body.to_profile_id;

    if (!fromId || !toId) {
        return NextResponse.json(
            { error: 'Missing from_profile_id and to_profile_id' },
            { status: 400 }
        );
    }

    const { error } = await supabase
        .from('likes')
        .delete()
        .eq('from_profile_id', fromId)
        .eq('to_profile_id', toId);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: 'Like removed successfully' }, { status: 200 });
}