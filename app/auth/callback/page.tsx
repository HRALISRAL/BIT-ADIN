"use client";
// app/auth/callback/page.tsx
// עם implicit flow, createBrowserClient מעבד את ה-#access_token אוטומטית.
// אנחנו רק מחכים לסשן ומפנים לדשבורד.
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

    async function waitForSessionAndRedirect() {
      try {
        // בדיקת שגיאה מ-Google/Supabase
        const searchParams = new URLSearchParams(window.location.search);
        if (searchParams.get("error")) {
          setErrorDetail(`שגיאה מ-OAuth: ${searchParams.get("error_description") || searchParams.get("error")}`);
          return;
        }

        // קריאת access_token מה-hash ישירות
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token") || "";

        if (accessToken) {
          setStatus("מגדיר סשן...");
          // הגדרת הסשן ידנית מה-access_token שב-URL hash
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) {
            setErrorDetail(`שגיאה בהגדרת סשן: ${error.message}`);
            return;
          }
          await redirectUser(data.session);
          return;
        }

        // fallback: מחכים לסשן שאולי כבר הוגדר אוטומטית
        setStatus("מחפש סשן קיים...");
        let attempts = 0;
        const interval = setInterval(async () => {
          attempts++;
          const { data } = await supabase.auth.getSession();
          if (data.session) {
            clearInterval(interval);
            await redirectUser(data.session);
          } else if (attempts >= 10) {
            clearInterval(interval);
            setErrorDetail(
              `לא נמצא סשן אחרי 5 שניות.\nURL: ${window.location.href}\nhash: ${window.location.hash}`
            );
          }
        }, 500);
      } catch (err: any) {
        setErrorDetail(`שגיאה: ${err?.message}`);
      }
    }

    async function redirectUser(session: any) {
      if (!session) {
        setErrorDetail("הסשן הוחזר כ-null.");
        return;
      }

      setStatus(`מחובר! (${session.user.email})\nשולף הרשאות...`);
      localStorage.setItem("current_user_id", session.user.id);

      // חיפוש פרופיל לפי UUID
      let { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("system_role")
        .eq("id", session.user.id)
        .single();

      // fallback - חיפוש לפי מייל אם ה-UUID לא תואם
      if (profileError || !profile) {
        setStatus("מחפש פרופיל לפי מייל...");
        const { data: byEmail } = await supabase
          .from("profiles")
          .select("id, system_role")
          .eq("email", session.user.email)
          .single();

        if (!byEmail) {
          setErrorDetail(
            `לא נמצא פרופיל.\nid: ${session.user.id}\nemail: ${session.user.email}\nשגיאה: ${profileError?.message}`
          );
          return;
        }

        // עדכון ה-UUID בפרופיל להתאמה עם Auth
        await supabase
          .from("profiles")
          .update({ id: session.user.id })
          .eq("email", session.user.email);

        localStorage.setItem("current_user_role", byEmail.system_role);
        setStatus("מועבר לממשק...");
        router.push(byEmail.system_role === "secretariat" ? "/dashboard/secretariat" : "/dashboard/client");
        return;
      }

      localStorage.setItem("current_user_role", profile.system_role);
      setStatus("מועבר לממשק...");
      router.push(profile.system_role === "secretariat" ? "/dashboard/secretariat" : "/dashboard/client");
    }

    waitForSessionAndRedirect();
  }, [router]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#fdfaf2", fontFamily: "sans-serif", direction: "rtl" }}>
      <div style={{ padding: "2rem 3rem", borderRadius: "1rem", background: "white", boxShadow: "0 4px 24px rgba(0,0,0,0.08)", border: "1px solid #eadeca", textAlign: "center", maxWidth: 520, width: "90%" }}>
        {errorDetail ? (
          <>
            <p style={{ color: "#dc2626", fontWeight: 700, fontSize: 16, marginBottom: 8 }}>❌ שגיאה בהתחברות</p>
            <p style={{ color: "#5c4a3c", fontSize: 12, background: "#fef2f2", padding: "0.75rem", borderRadius: 8, textAlign: "left", direction: "ltr", wordBreak: "break-all", whiteSpace: "pre-wrap" }}>
              {errorDetail}
            </p>
            <button onClick={() => router.push("/")} style={{ marginTop: 16, padding: "0.5rem 1.5rem", background: "#cda851", border: "none", borderRadius: 8, color: "white", fontWeight: 700, cursor: "pointer" }}>
              חזור לדף הכניסה
            </button>
          </>
        ) : (
          <>
            <div style={{ width: 40, height: 40, borderRadius: "50%", border: "4px solid #cda851", borderTopColor: "transparent", animation: "spin 0.8s linear infinite", margin: "0 auto 1rem" }} />
            <p style={{ color: "#5c4a3c", fontWeight: 600, fontSize: 14, whiteSpace: "pre-wrap" }}>{status}</p>
            <p style={{ color: "#9c8a7c", fontSize: 12, marginTop: 4 }}>אנא המתן...</p>
          </>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
