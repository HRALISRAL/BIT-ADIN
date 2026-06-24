// app/page.tsx - דף נחיתה ראשי ומסך בחירת משתמשים בעיצוב תורני מסורתי
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Scale, Users, Calendar, ArrowRight, ShieldCheck, Database, 
  BookOpen, FileText, Lock, Mail, User, Phone, AlertCircle, CheckCircle2 
} from "lucide-react";
import { dbService } from "./../lib/services/dbService";
import { UserProfile } from "../types";
import { isMockMode, supabase } from "./../lib/supabase/client";
import { maskName } from "../lib/utils/masking";

export default function Home() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState<string>("");
  const [courtName, setCourtName] = useState("בית הדין הרבני האזורי ירושלים");

  // מצבי אימות Supabase
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    async function loadProfiles() {
      try {
        if (isMockMode) {
          const data = await dbService.getProfiles();
          setProfiles(data);
          if (data.length > 0) {
            setSelectedProfile(data[0].id);
          }
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

  const handleMockLogin = () => {
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

  const handleRealAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthSuccess("");
    setAuthLoading(true);

    try {
      if (!supabase) {
        throw new Error("לקוח Supabase אינו מאותחל כראוי.");
      }

      if (authMode === "login") {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password,
        });
        if (error) throw error;

        if (data.user) {
          // שליפת הפרופיל לקבלת התפקיד
          const profile = await dbService.getProfile(data.user.id);
          if (!profile) {
            throw new Error("לא נמצא פרופיל משתמש תואם במערכת.");
          }

          if (typeof window !== "undefined") {
            localStorage.setItem("current_user_id", profile.id);
            localStorage.setItem("current_user_role", profile.system_role);
          }

          setAuthSuccess("התחברת בהצלחה! מנתב ללוח הבקרה...");
          setTimeout(() => {
            if (profile.system_role === "secretariat") {
              router.push("/dashboard/secretariat");
            } else {
              router.push(`/dashboard/client?userId=${profile.id}`);
            }
          }, 1000);
        }
      } else {
        // הרשמה
        if (!fullName.trim()) {
          throw new Error("נא למלא שם מלא.");
        }
        
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password,
          options: {
            data: {
              full_name: fullName.trim(),
              phone: phone.trim(),
            }
          }
        });
        if (error) throw error;

        setAuthSuccess("הרשמה בוצעה בהצלחה! במידה ואישור אימייל נדרש בסביבה זו, אנא אשר את חשבונך במייל. כעת באפשרותך להתחבר.");
        setAuthMode("login");
        setPassword("");
      }
    } catch (err: any) {
      setAuthError(err.message || "שגיאה בתהליך האימות.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setAuthError("");
    setAuthSuccess("");
    try {
      if (isMockMode || !supabase) {
        const mockProfile = profiles.find(p => p.system_role === 'secretariat') || profiles[0];
        if (!mockProfile) return;
        if (typeof window !== "undefined") {
          localStorage.setItem("current_user_id", mockProfile.id);
          localStorage.setItem("current_user_role", mockProfile.system_role);
        }
        setAuthSuccess("התחברת בהצלחה (מצב סימולציה)!");
        setTimeout(() => {
          if (mockProfile.system_role === 'secretariat') {
            router.push("/dashboard/secretariat");
          } else {
            router.push(`/dashboard/client?userId=${mockProfile.id}`);
          }
        }, 1000);
        return;
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setAuthError(err.message || "שגיאה בהתחברות עם Google.");
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
        {isMockMode ? (
          <div className="parchment-panel flex items-center gap-3 p-4 mb-8 rounded-xl border border-amber-600/20 bg-amber-50/30 text-[#8b5a2b] max-w-md mx-auto text-xs justify-center font-bold">
            <Database className="h-5 w-5 flex-shrink-0 text-[#a27b18]" />
            <span>המערכת פועלת כעת ב-<strong>מצב סימולציה מקומי</strong> (ללא צורך ב-Supabase)</span>
          </div>
        ) : (
          <div className="parchment-panel flex items-center gap-3 p-4 mb-8 rounded-xl border border-emerald-600/20 bg-emerald-50/30 text-emerald-800 max-w-md mx-auto text-xs justify-center font-bold">
            <ShieldCheck className="h-5 w-5 flex-shrink-0 text-emerald-700" />
            <span>המערכת מחוברת באופן מאובטח ל-<strong>Supabase</strong> (סביבה חיה)</span>
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

          {/* כרטיס כניסה מהיר (מצב סימולציה) או טופס התחברות אמיתי (מצב חי) */}
          <div className="parchment-panel p-8 rounded-2xl flex flex-col justify-center border-[#eadeca] torah-card">
            
            {isMockMode ? (
              // ממשק כניסה מדומה
              <>
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
                      onClick={handleMockLogin}
                      className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl gold-button font-bold hover:opacity-95 active:scale-95 transition-all text-sm cursor-pointer"
                    >
                      <span>הכנס לממשק בית הדין</span>
                      <ArrowRight className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </>
            ) : (
              // ממשק כניסה אמיתי מול Supabase Auth
              <>
                <h2 className="text-xl font-bold text-serif text-[#2d1e10] mb-2">
                  אימות כניסה מאובטח
                </h2>
                <p className="text-xs text-[#5c4a3c] mb-6 font-medium">
                  הזדהות בעלי דין ומזכירות בית הדין
                </p>

                {/* בורר מצבים: התחברות או הרשמה */}
                <div className="flex border-b border-[#eadeca] mb-6 text-xs font-bold font-serif">
                  <button
                    type="button"
                    onClick={() => { setAuthMode("login"); setAuthError(""); setAuthSuccess(""); }}
                    className={`flex-1 pb-3 text-center transition-all cursor-pointer ${
                      authMode === "login"
                        ? "border-b-2 border-[#a27b18] text-[#a27b18]"
                        : "text-[#5c4a3c] hover:text-[#2d1e10]"
                    }`}
                  >
                    התחברות
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAuthMode("signup"); setAuthError(""); setAuthSuccess(""); }}
                    className={`flex-1 pb-3 text-center transition-all cursor-pointer ${
                      authMode === "signup"
                        ? "border-b-2 border-[#a27b18] text-[#a27b18]"
                        : "text-[#5c4a3c] hover:text-[#2d1e10]"
                    }`}
                  >
                    הרשמה כבעל דין
                  </button>
                </div>

                <form onSubmit={handleRealAuth} className="space-y-4 text-xs font-semibold text-[#2d1e10]">
                  {authMode === "signup" && (
                    <>
                      <div>
                        <label className="block mb-1.5 font-bold">שם מלא:</label>
                        <div className="relative">
                          <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8b5a2b]" />
                          <input
                            type="text"
                            placeholder="ישראל ישראלי"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="w-full bg-white border border-[#eadeca] rounded-xl pr-10 pl-4 py-3 focus:outline-none focus:ring-1 focus:ring-[#cda851] text-xs font-medium"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block mb-1.5 font-bold">מספר טלפון:</label>
                        <div className="relative">
                          <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8b5a2b]" />
                          <input
                            type="tel"
                            placeholder="050-1234567"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full bg-white border border-[#eadeca] rounded-xl pr-10 pl-4 py-3 focus:outline-none focus:ring-1 focus:ring-[#cda851] text-xs font-medium"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block mb-1.5 font-bold">כתובת אימייל:</label>
                    <div className="relative">
                      <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8b5a2b]" />
                      <input
                        type="email"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-white border border-[#eadeca] rounded-xl pr-10 pl-4 py-3 focus:outline-none focus:ring-1 focus:ring-[#cda851] text-xs font-medium"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1.5 font-bold">סיסמה:</label>
                    <div className="relative">
                      <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8b5a2b]" />
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-white border border-[#eadeca] rounded-xl pr-10 pl-4 py-3 focus:outline-none focus:ring-1 focus:ring-[#cda851] text-xs font-medium"
                        required
                      />
                    </div>
                  </div>

                  {/* הודעות שגיאה או הצלחה */}
                  {authError && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[10px] flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      <span>{authError}</span>
                    </div>
                  )}

                  {authSuccess && (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      <span>{authSuccess}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl gold-button font-bold hover:opacity-95 active:scale-95 transition-all text-sm cursor-pointer disabled:opacity-50"
                  >
                    <span>{authLoading ? "מעבד..." : authMode === "login" ? "התחבר לממשק בית הדין" : "הרשם והתחבר"}</span>
                    <ArrowRight className="h-5 w-5" />
                  </button>
                </form>

                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-[#eadeca]"></div>
                  <span className="flex-shrink mx-4 text-[#5c4a3c] text-[10px] font-bold">או</span>
                  <div className="flex-grow border-t border-[#eadeca]"></div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-white border border-[#eadeca] text-[#2d1e10] hover:bg-[#faf6ee] font-bold active:scale-95 transition-all text-xs cursor-pointer shadow-sm"
                >
                  <svg className="h-4 w-4 animate-none" viewBox="0 0 24 24">
                    <path
                      fill="#EA4335"
                      d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.48 14.97 1 12 1 7.35 1 3.4 3.65 1.5 7.5l3.86 3C6.27 7.58 8.87 5.04 12 5.04z"
                    />
                    <path
                      fill="#4285F4"
                      d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.44c-.28 1.47-1.11 2.71-2.36 3.55l3.67 2.84c2.14-1.97 3.74-4.88 3.74-8.54z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.36 14.49c-.24-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29L1.5 6.91C.54 8.93 0 11.19 0 13.59s.54 4.66 1.5 6.68l3.86-3.09-.27-.69z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.67-2.84c-1.02.68-2.33 1.09-4.29 1.09-3.13 0-5.73-2.54-6.64-5.96L1.5 16.38C3.4 20.35 7.35 23 12 23z"
                    />
                  </svg>
                  <span>התחבר באמצעות Google</span>
                </button>
              </>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
