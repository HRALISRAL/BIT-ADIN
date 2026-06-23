// app/page.tsx - דף נחיתה ראשי ומסך בחירת משתמשים בעיצוב תורני מסורתי

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Scale, Users, Calendar, ArrowRight, ShieldCheck, Database, BookOpen, FileText } from "lucide-react";
import { dbService } from "./../lib/services/dbService";
import { UserProfile } from "../types";
import { isMockMode } from "./../lib/supabase/client";
import { maskName } from "../lib/utils/masking";

export default function Home() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState<string>("");
  const [courtName, setCourtName] = useState("בית הדין הרבני האזורי ירושלים");

  useEffect(() => {
    async function loadProfiles() {
      try {
        const data = await dbService.getProfiles();
        setProfiles(data);
        if (data.length > 0) {
          setSelectedProfile(data[0].id);
        }
        setCourtName(dbService.getBetDinName());
      } catch (err) {
        console.error("Failed to load profiles:", err);
      } finally {
        setLoading(false);
      }
    }
    loadProfiles();
  }, []);

  const handleLogin = () => {
    const profile = profiles.find(p => p.id === selectedProfile);
    if (!profile) return;

    if (typeof window !== "undefined") {
      localStorage.setItem("current_user_id", profile.id);
      localStorage.setItem("current_user_role", profile.system_role);
    }

    if (profile.system_role === "secretariat") {
      router.push("/dashboard/secretariat");
    } else {
      router.push(`/dashboard/client?userId=${profile.id}`);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-16 sm:px-6 lg:px-8 bg-[#fdfaf2] overflow-hidden">
      
      {/* רקע באטמוספירת ספרייה תורנית חמימה */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#cda851]/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#8b5a2b]/5 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="w-full max-w-4xl z-10">
        
        {/* כותרת ראשית ולוגו בעיצוב ספר קודש מסורתי */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-4 mb-4 rounded-full bg-[#8b5a2b]/5 text-[#8b5a2b] border border-[#eadfcd] shadow-md">
            <Scale className="h-10 w-10" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-serif text-[#2d1e10] mb-3">
            מערכת ניהול {courtName}
          </h1>
          <p className="text-sm font-semibold tracking-widest text-[#a27b18] uppercase mb-4">
            בתי הדין הרבניים והרכבי הדיינים
          </p>
          <div className="traditional-divider max-w-md mx-auto" />
          <p className="text-base text-[#5c4a3c] max-w-2xl mx-auto mt-4 font-medium">
            מערכת אינטגרטיבית לניהול תיקים, שיבוץ דיונים שבועי לפי הרכבי דיינים,
            והגשת חומרים מופרדת ומאובטחת לבעלי דין.
          </p>
        </div>

        {/* מצב הדגמה / אזהרה */}
        {isMockMode && (
          <div className="parchment-panel flex items-center gap-3 p-4 mb-8 rounded-xl border border-amber-600/20 bg-amber-50/30 text-[#8b5a2b] max-w-md mx-auto text-xs justify-center font-bold">
            <Database className="h-5 w-5 flex-shrink-0 text-[#a27b18]" />
            <span>המערכת פועלת כעת ב-<strong>מצב סימולציה מקומי</strong> (ללא צורך ב-Supabase)</span>
          </div>
        )}

        {/* תצוגת אזורי כניסה */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          
          {/* כרטיס הסבר על מאפייני המערכת */}
          <div className="parchment-panel p-8 rounded-2xl flex flex-col justify-between border-[#eadeca]">
            <div>
              <h2 className="text-xl font-bold text-serif text-[#2d1e10] mb-6 border-b border-[#eadeca] pb-3">
                מאפייני מערכת בתי הדין
              </h2>
              
              <ul className="space-y-5">
                <li className="flex items-start gap-3">
                  <div className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#8b5a2b]/10 text-[#8b5a2b]">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[#2d1e10]">יומן הרכבים שבועי</h3>
                    <p className="text-xs text-[#5c4a3c] mt-0.5 font-medium">שיבוץ דיונים אוטומטי בהתאם ליום הפעילות של הרכבי הדיינים (ראשון עד חמישי).</p>
                  </div>
                </li>
                
                <li className="flex items-start gap-3">
                  <div className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#8b5a2b]/10 text-[#8b5a2b]">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[#2d1e10]">הפרדת מידע מוחלטת (RLS)</h3>
                    <p className="text-xs text-[#5c4a3c] mt-0.5 font-medium">התובע והנתבע רואים אך ורק את החומרים שהעלו בעצמם, אלא אם המזכירות אישרה שיתוף.</p>
                  </div>
                </li>

                <li className="flex items-start gap-3">
                  <div className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#8b5a2b]/10 text-[#8b5a2b]">
                    <Users className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[#2d1e10]">ממשק מזכירות מרכזי</h3>
                    <p className="text-xs text-[#5c4a3c] mt-0.5 font-medium">לוח בקרה שבועי להרכבים, ניהול פניות ואישור מסמכים לשיתוף בלחיצת כפתור.</p>
                  </div>
                </li>
              </ul>
            </div>
            
            <div className="mt-8 pt-4 border-t border-[#eadeca] flex items-center gap-2 text-[11px] text-[#5c4a3c] font-semibold">
              <ShieldCheck className="h-4 w-4 text-[#a27b18]" />
              <span>אבטחה והרשאות מנוהלות ברמת שורת הנתונים (RLS)</span>
            </div>
          </div>

          {/* כרטיס כניסה מהיר */}
          <div className="parchment-panel p-8 rounded-2xl flex flex-col justify-center border-[#eadeca] torah-card">
            <h2 className="text-xl font-bold text-serif text-[#2d1e10] mb-2">
              כניסה מורשית למערכת
            </h2>
            <p className="text-xs text-[#5c4a3c] mb-6 font-medium">
              בחר את בעל התפקיד המורשה לצורך כניסה וניהול התיקים:
            </p>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#a27b18] border-t-transparent" />
                <span className="mt-2 text-[#5c4a3c] text-xs font-bold">טוען משתמשים...</span>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-[#2d1e10] mb-2">
                    בחר משתמש להתחברות:
                  </label>
                  <select
                    value={selectedProfile}
                    onChange={(e) => setSelectedProfile(e.target.value)}
                    className="w-full bg-white border border-[#eadeca] rounded-xl px-4 py-3 text-[#2d1e10] font-medium focus:outline-none focus:ring-2 focus:ring-[#cda851] focus:border-transparent transition-all text-xs"
                  >
                    {profiles.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.system_role === "secretariat" ? p.full_name : maskName(p.full_name)} ({p.system_role === "secretariat" ? "סגל מזכירות" : "בעל דין"})
                      </option>
                    ))}
                  </select>
                </div>

                {/* תצוגת פרטי המשתמש הנבחר */}
                {(() => {
                  const p = profiles.find(prof => prof.id === selectedProfile);
                  if (!p) return null;
                  return (
                    <div className="p-4 rounded-xl bg-[#faf6ee]/60 border border-[#eadeca] text-xs text-[#5c4a3c] space-y-2 font-medium">
                      <div><strong className="text-[#2d1e10]">שם בעל התפקיד:</strong> {p.system_role === "secretariat" ? p.full_name : maskName(p.full_name)}</div>
                      <div><strong className="text-[#2d1e10]">דואר אלקטרוני:</strong> {p.system_role === "secretariat" ? p.email : p.email.charAt(0) + "***" + p.email.slice(p.email.indexOf("@") - 1)}</div>
                      <div><strong className="text-[#2d1e10]">סמכות במערכת:</strong> {p.system_role === "secretariat" ? "מזכירות בית הדין" : "בעל דין פעיל"}</div>
                    </div>
                  );
                })()}

                <button
                  onClick={handleLogin}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl gold-button font-bold hover:opacity-95 active:scale-95 transition-all text-sm cursor-pointer"
                >
                  <span>הכנס לממשק בית הדין</span>
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
