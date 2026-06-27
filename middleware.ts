// middleware.ts - חסימת נתיבים מבוססת תפקידים בצד השרת
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // אם הפרויקט במצב Mock מקומי (פיתוח/בדיקות) - עקוף את ה-Middleware
  const isMockMode = 
    !supabaseUrl || 
    !supabaseAnonKey || 
    process.env.NEXT_PUBLIC_APP_MODE === 'development';

  if (isMockMode) {
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll().map((cookie) => ({
            name: cookie.name,
            value: cookie.value,
          }));
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // קבלת המשתמש המחובר באופן מאובטח
  const { data: { user } } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // אם לא מחובר, הפנה לדף הבית להתחברות
  if (!user) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // שליפת פרופיל המשתמש לבירור התפקיד שלו
  const { data: profile } = await supabase
    .from('profiles')
    .select('system_role')
    .eq('id', user.id)
    .single();

  if (!profile) {
    // אם אין פרופיל, המשתמש אינו מורשה במערכת. נחזיר אותו לדף הבית עם שגיאה
    return NextResponse.redirect(new URL('/?error=' + encodeURIComponent('המייל אינו רשום במערכת. אנא פנה למזכירות.'), request.url));
  }

  const role = profile?.system_role;

  // חסימת כניסה לנתיבי מזכירות למי שאינו מוגדר כ-secretariat
  if (path.startsWith('/dashboard/secretariat')) {
    if (role !== 'secretariat') {
      return NextResponse.redirect(new URL('/dashboard/client', request.url));
    }
  }

  // חסימת כניסה לנתיבי לקוחות למי שמוגדר כ-secretariat (הפניה לנתיב המתאים לו)
  if (path.startsWith('/dashboard/client')) {
    if (role === 'secretariat') {
      return NextResponse.redirect(new URL('/dashboard/secretariat', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
