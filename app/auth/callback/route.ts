// app/auth/callback/route.ts - נקודת קצה לטיפול בחזרת המשתמש מאימות גוגל (OAuth callback)
import { NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');
  const next = searchParams.get('next') ?? '/';

  // טיפול בשגיאה שמתקבלת ישירות מ-Supabase/Google
  if (error) {
    console.error('OAuth callback error from provider:', error, errorDescription);
    return NextResponse.redirect(`${origin}/?error=${encodeURIComponent(errorDescription || error)}`);
  }

  if (code) {
    const supabase = await createClient();
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    
    if (exchangeError) {
      console.error('OAuth callback session exchange error:', exchangeError);
      return NextResponse.redirect(`${origin}/?error=${encodeURIComponent(exchangeError.message)}`);
    }

    // שליפת המשתמש שזה עתה התחבר כדי לזהות את התפקיד שלו
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('OAuth callback get user error:', userError);
      return NextResponse.redirect(`${origin}/?error=${encodeURIComponent(userError?.message || 'לא ניתן היה לאחזר את פרטי המשתמש')}`);
    }

    // שליפת הפרופיל לקבלת התפקיד במערכת
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('system_role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('OAuth callback get profile error:', profileError);
      // אם לא נמצא פרופיל, כנראה שהמשתמש אינו רשום במערכת המזכירות
      return NextResponse.redirect(`${origin}/?error=${encodeURIComponent('המייל אינו רשום במערכת. אנא פנה למזכירות להסדרת הרישום.')}`);
    }

    if (profile.system_role === 'secretariat') {
      return NextResponse.redirect(`${origin}/dashboard/secretariat`);
    } else {
      return NextResponse.redirect(`${origin}/dashboard/client?userId=${user.id}`);
    }
  }

  // במקרה של חוסר קוד או שגיאה לא ידועה, מחזירים לדף הבית
  return NextResponse.redirect(`${origin}${next}`);
}
