"use client";
// app/auth/callback/page.tsx - דף ניהול קאלבק OAuth בצד הקליינט
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase/client";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState("מאמת חיבור...");
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  useEffect(() => {
    async function handleCallback() {
      if (!supabase) {
        setErrorDetail("supabase client is null - בדוק משתני סביבה");
        return;
      }

      try {
        const searchParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.substring(1));

        const code = searchParams.get("code");
        const accessToken = hashParams.get("access_token");
        const errorParam = searchParams.get("error");
        const errorDesc = searchParams.get("error_description");

        setStatus(`קוד: ${code ? "נמצא" : "חסר"} | access_token: ${accessToken ? "נמצא" : "חסר"} | error: ${errorParam || "אין"}`);

        if (errorParam) {
          setErrorDetail(`שגיאה מגוגל: ${errorDesc || errorParam}`);
          return;
        }

        if (accessToken) {
          setStatus("מחליף access_token לסשן...");
          const refreshToken = hashParams.get("refresh_token") || "";
          const { error: setError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (setError) {
            setErrorDetail(`שגיאה בsetSession: ${setError.message}`);
            return;
          }
        } else if (code) {
          setStatus("מחליף קוד לסשן (PKCE)...");
          const { error: exchError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchError) {
            setErrorDetail(`שגיאה בexchangeCode: ${exchError.message}`);
            return;
          }
        } else {
          // ייתכן שהסשן כבר קיים מסיבה אחרת
          const { data: sessionData } = await supabase.auth.getSession();
          if (!sessionData.session) {
            setErrorDetail("לא נמצא קוד, access_token, או סשן קיים. URL: " + window.location.href);
            return;
          }
          setStatus("סשן קיים, ממשיך...");
        }

        // שליפת המשתמש
        setStatus("שולף פרטי משתמש...");
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
          setErrorDetail(`שגיאה בgetUser: ${userError?.message || "user is null"}`);
          return;
        }

        setStatus(`משתמש נמצא: ${user.email}`);
        localStorage.setItem("current_user_id", user.id);

        // שליפת הפרופיל
        setStatus("שולף פרופיל מבסיס הנתונים...");
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("system_role")
          .eq("id", user.id)
          .single();

        if (profileError || !profile) {
          setErrorDetail(`שגיאה בפרופיל: ${profileError?.message || "profile is null"} | user.id: ${user.id}`);
          return;
        }

        localStorage.setItem("current_user_role", profile.system_role);
        setStatus("מעביר לממשק...");

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
          maxWidth: 500,
        }}
      >
        {errorDetail ? (
          <>
            <p style={{ color: "#dc2626", fontWeight: 700, fontSize: 16, marginBottom: 8 }}>
              ❌ שגיאה בהתחברות
            </p>
            <p style={{ color: "#5c4a3c", fontSize: 13, background: "#fef2f2", padding: "0.75rem", borderRadius: 8, textAlign: "left", direction: "ltr", wordBreak: "break-all" }}>
              {errorDetail}
            </p>
            <button
              onClick={() => router.push("/")}
              style={{ marginTop: 16, padding: "0.5rem 1.5rem", background: "#cda851", border: "none", borderRadius: 8, color: "white", fontWeight: 700, cursor: "pointer" }}
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
            <p style={{ color: "#5c4a3c", fontWeight: 600, fontSize: 14, whiteSpace: "pre-wrap" }}>
              {status}
            </p>
          </>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
