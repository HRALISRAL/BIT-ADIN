"use client";
// app/auth/callback/page.tsx - דף ניהול קאלבק OAuth
// מטפל בשני מצבים: access_token בـhash (implicit) או code בـquery (PKCE)
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

    async function handleCallback() {
      try {
        // בדיקת שגיאה ישירה מ-URL
        const searchParams = new URLSearchParams(window.location.search);
        const errorParam = searchParams.get("error");
        const errorDesc = searchParams.get("error_description");
        if (errorParam) {
          setErrorDetail(`שגיאה מספק OAuth: ${errorDesc || errorParam}`);
          return;
        }

        // קריאת ה-hash מה-URL (implicit flow - access_token בـhash)
        const hash = window.location.hash.substring(1);
        const hashParams = new URLSearchParams(hash);
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token") || "";

        // קריאת הקוד מה-query (PKCE flow - code בـquery)
        const code = searchParams.get("code");

        let session = null;

        if (accessToken) {
          // Implicit flow - יש access_token ישירות ב-hash
          setStatus("מגדיר סשן מ-access token...");
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) {
            setErrorDetail(`שגיאה בsetSession: ${error.message}`);
            return;
          }
          session = data.session;
        } else if (code) {
          // PKCE flow - יש code בـquery
          setStatus("מחליף קוד לסשן...");
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            setErrorDetail(`שגיאה בexchangeCode: ${error.message}`);
            return;
          }
          session = data.session;
        } else {
          // ייתכן שהסשן כבר קיים
          setStatus("בודק סשן קיים...");
          const { data } = await supabase.auth.getSession();
          session = data.session;
          if (!session) {
            setErrorDetail(`לא נמצא access_token, code, או סשן קיים.\nURL: ${window.location.href}`);
            return;
          }
        }

        if (!session) {
          setErrorDetail("הסשן הוחזר כ-null לאחר אתחול.");
          return;
        }

        setStatus(`מחובר! (${session.user.email}) שולף הרשאות...`);

        // שמירה ב-localStorage לתאימות עם שאר הקוד
        localStorage.setItem("current_user_id", session.user.id);

        // שליפת פרופיל מהבסיס נתונים
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("system_role")
          .eq("id", session.user.id)
          .single();

        if (profileError || !profile) {
          // ניסיון חלופי - חיפוש לפי מייל
          setStatus("מנסה חיפוש לפי מייל...");
          const { data: profileByEmail, error: emailError } = await supabase
            .from("profiles")
            .select("id, system_role")
            .eq("email", session.user.email)
            .single();

          if (emailError || !profileByEmail) {
            setErrorDetail(
              `לא נמצא פרופיל.\nuser.id: ${session.user.id}\nemail: ${session.user.email}\nשגיאה: ${profileError?.message}`
            );
            return;
          }

          // נמצא לפי מייל - עדכן ה-UUID בבסיס הנתונים
          await supabase
            .from("profiles")
            .update({ id: session.user.id })
            .eq("email", session.user.email);

          localStorage.setItem("current_user_role", profileByEmail.system_role);
          setStatus("מועבר לממשק...");
          if (profileByEmail.system_role === "secretariat") {
            router.push("/dashboard/secretariat");
          } else {
            router.push("/dashboard/client");
          }
          return;
        }

        localStorage.setItem("current_user_role", profile.system_role);
        setStatus("מועבר לממשק...");

        if (profile.system_role === "secretariat") {
          router.push("/dashboard/secretariat");
        } else {
          router.push("/dashboard/client");
        }
      } catch (err: any) {
        setErrorDetail(`שגיאה כללית: ${err?.message || JSON.stringify(err)}`);
      }
    }

    handleCallback();
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
