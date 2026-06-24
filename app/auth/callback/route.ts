// app/auth/callback/route.ts - נקודת קצה לטיפול בחזרת המשתמש מאימות גוגל (OAuth callback)
import { NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // שליפת המשתמש שזה עתה התחבר כדי לזהות את התפקיד שלו
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // שליפת הפרופיל לקבלת התפקיד במערכת
        const { data: profile } = await supabase
          .from('profiles')
          .select('system_role')
          .eq('id', user.id)
          .single();

        if (profile?.system_role === 'secretariat') {
          return NextResponse.redirect(`${origin}/dashboard/secretariat`);
        } else {
          return NextResponse.redirect(`${origin}/dashboard/client?userId=${user.id}`);
        }
      }
    }
  }

  // במקרה של שגיאה, מחזירים לדף הבית
  return NextResponse.redirect(`${origin}${next}`);
}
