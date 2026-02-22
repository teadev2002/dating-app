import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase'; // file types bạn generate trước đó

export async function createSupabaseServerClient() {
  const cookieStore = await cookies(); // async ở Next.js 15+

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Ignore lỗi ở Server Components (Supabase docs khuyến nghị)
          }
        },
      },
    }
  );
}