"use client";
// app/auth/callback/page.tsx - דף ניהול קאלבק OAuth
// משתמש ב-onAuthStateChange כפי שמומלץ ע"י Supabase לטיפול בהחזרה מ-OAuth
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase/client";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState("מאמת חיבור...");
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) {
      setErrorDetail("supabase client הוא null - בדוק משתני סביבה ב-Vercel");
      return;
    }

    // בדיקת שגיאה ישירה מ-URL (שגיאה מגוגל או מ-Supabase)
    const searchParams = new URLSearchParams(window.location.search);
    const errorParam = searchParams.get("error");
    const errorDesc = searchParams.get("error_description");
    if (errorParam) {
      setErrorDetail(`שגיאה מספק OAuth: ${errorDesc || errorParam}`);
      return;
    }

    // האזנה לשינוי מצב ההתחברות - Supabase יטפל בהחלפת הקוד אוטומטית
    // בגלל detectSessionInUrl: true שהגדרנו ב-client.ts
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: string, session: any) => {
      setStatus(`אירוע: ${event}`);

      if (event === "SIGNED_IN" && session) {
        setStatus("מחובר! שולף הרשאות...");
        
        try {
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("system_role")
            .eq("id", session.user.id)
            .single();

          if (profileError || !profile) {
            setErrorDetail(
              `שגיאת פרופיל: ${profileError?.message || "לא נמצא פרופיל"} | user.id=${session.user.id} | email=${session.user.email}`
            );
            return;
          }

          localStorage.setItem("current_user_id", session.user.id);
          localStorage.setItem("current_user_role", profile.system_role);
          setStatus("מועבר לממשק...");

          if (profile.system_role === "secretariat") {
            router.push("/dashboard/secretariat");
          } else {
            router.push("/dashboard/client");
          }
        } catch (err: any) {
          setErrorDetail(`שגיאה בשליפת פרופיל: ${err?.message}`);
        }
      } else if (event === "SIGNED_OUT" || (!session && event !== "INITIAL_SESSION")) {
        setErrorDetail(`הסשן לא נוצר. אירוע: ${event} | URL: ${window.location.href}`);
      }
    });

    // timeout - אם אחרי 8 שניות אין אירוע, מציג שגיאה
    const timeout = setTimeout(() => {
      setErrorDetail(
        `פג זמן ההמתנה לאירוע Auth. URL נוכחי: ${window.location.href} | hash: ${window.location.hash}`
      );
    }, 8000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [router]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#fdfaf2",
        fontFamily: "sans-serif",
        direction: "rtl",
      }}
    >
      <div
        style={{
          padding: "2rem 3rem",
          borderRadius: "1rem",
          background: "white",
          boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
          border: "1px solid #eadeca",
          textAlign: "center",
          maxWidth: 520,
          width: "90%",
        }}
      >
        {errorDetail ? (
          <>
            <p style={{ color: "#dc2626", fontWeight: 700, fontSize: 16, marginBottom: 8 }}>
              ❌ שגיאה בהתחברות
            </p>
            <p
              style={{
                color: "#5c4a3c",
                fontSize: 12,
                background: "#fef2f2",
                padding: "0.75rem",
                borderRadius: 8,
                textAlign: "left",
                direction: "ltr",
                wordBreak: "break-all",
                whiteSpace: "pre-wrap",
              }}
            >
              {errorDetail}
            </p>
            <button
              onClick={() => router.push("/")}
              style={{
                marginTop: 16,
                padding: "0.5rem 1.5rem",
                background: "#cda851",
                border: "none",
                borderRadius: 8,
                color: "white",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              חזור לדף הכניסה
            </button>
          </>
        ) : (
          <>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                border: "4px solid #cda851",
                borderTopColor: "transparent",
                animation: "spin 0.8s linear infinite",
                margin: "0 auto 1rem",
              }}
            />
            <p style={{ color: "#5c4a3c", fontWeight: 600, fontSize: 14 }}>
              {status}
            </p>
            <p style={{ color: "#9c8a7c", fontSize: 12, marginTop: 4 }}>
              אנא המתן...
            </p>
          </>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
