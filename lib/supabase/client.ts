// lib/supabase/client.ts - יצירת לקוח Supabase ותמיכה במצב פולבק (Mock Mode)
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// הגדרה האם הפרויקט פועל במצב סימולציה מקומי (Mock Mode)
export const isMockMode = !supabaseUrl || !supabaseAnonKey;

if (isMockMode && typeof window !== 'undefined') {
  console.warn(
    '⚠️ מפתחות API של Supabase חסרים בקובץ הסביבה. המערכת תפעל במצב סימולציה (Mock Mode) השומר נתונים ב-LocalStorage.'
  );
}

// יצירת הלקוח של Supabase עם הגדרות PKCE סטנדרטיות
export const supabase = !isMockMode && supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      }
    })
  : null as any;
