// lib/supabase/client.ts - יצירת לקוח Supabase בצד הקליינט עם שמירת סשן ב-cookies
// שימוש ב-createBrowserClient כדי שהסשן נשמר ב-cookies ונגיש גם ל-Middleware
import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isMockMode = !supabaseUrl || !supabaseAnonKey;

if (isMockMode && typeof window !== 'undefined') {
  console.warn('⚠️ מפתחות API של Supabase חסרים. המערכת תפעל במצב סימולציה (Mock Mode).');
}

// createBrowserClient שומר את הסשן ב-cookies ונגיש גם ל-Middleware
// flowType: 'implicit' → גוגל מחזיר access_token ישירות ב-hash ללא צורך ב-PKCE exchange
export const supabase = !isMockMode && supabaseUrl && supabaseAnonKey
  ? createBrowserClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        flowType: 'implicit',
      }
    })
  : null as any;
