// lib/supabase/client.ts - יצירת לקוח Supabase ותמיכה במצב פולבק (Mock Mode)
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// הגדרה האם הפרויקט פועל במצב סימולציה מקומי (Mock Mode)
// מוגדר על בסיס NEXT_PUBLIC_APP_MODE === 'development' כדי שבזמן ריצת build לפרודקשן
// ה-Bundler ידע לבצע Tree shaking מלא לקוד ה-Mock
export const isMockMode = 
  process.env.NEXT_PUBLIC_APP_MODE === 'development' && 
  (!supabaseUrl || !supabaseAnonKey);

if (isMockMode && typeof window !== 'undefined') {
  console.warn(
    '⚠️ מפתחות API של Supabase חסרים בקובץ הסביבה. המערכת תפעל במצב סימולציה (Mock Mode) השומר נתונים ב-LocalStorage.'
  );
}

// יצירת הלקוח של Supabase רק אם אנו לא במצב סימולציה
export const supabase = !isMockMode && supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null as any;
