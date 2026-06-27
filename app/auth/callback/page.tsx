"use client";
// app/auth/callback/page.tsx - דף ניהול קאלבק OAuth בצד הקליינט
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase/client";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState("מאמת חיבור...");

  useEffect(() => {
    async function handleCallback() {
      if (!supabase) {
        router.push("/?error=" + encodeURIComponent("שגיאת הגדרות מערכת"));
        return;
      }

      try {
        // Supabase client-side מחלץ את הקוד מה-URL ומחליף אותו לסשן אוטומטית
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error("Session error:", error);
          router.push("/?error=" + encodeURIComponent(error.message));
          return;
        }

        if (!data.session) {
          // אם עוד אין סשן, ממתינים להחלפת קוד
          const hashParams = new URLSearchParams(
            window.location.hash.substring(1)
          );
          const searchParams = new URLSearchParams(window.location.search);
          
          const accessToken = hashParams.get("access_token");
          const code = searchParams.get("code");
          const errorParam = searchParams.get("error");
          const errorDesc = searchParams.get("error_description");

          if (errorParam) {
            router.push(
              "/?error=" + encodeURIComponent(errorDesc || errorParam)
            );
            return;
          }

          if (accessToken) {
            // implicit flow
            const refreshToken = hashParams.get("refresh_token") || "";
            const { error: setError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            if (setError) {
              router.push("/?error=" + encodeURIComponent(setError.message));
              return;
            }
          } else if (code) {
            // PKCE flow
            const { error: exchError } =
              await supabase.auth.exchangeCodeForSession(code);
            if (exchError) {
              router.push("/?error=" + encodeURIComponent(exchError.message));
              return;
            }
          } else {
            router.push("/?error=" + encodeURIComponent("לא נמצא קוד אימות"));
            return;
          }
        }

        // שליפת המשתמש המחובר
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          router.push(
            "/?error=" +
              encodeURIComponent(userError?.message || "שגיאה בשליפת משתמש")
          );
          return;
        }

        // שמירת ה-userId ב-localStorage
        localStorage.setItem("current_user_id", user.id);

        setStatus("מאמת הרשאות...");

        // שליפת הפרופיל לבדיקת תפקיד
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("system_role")
          .eq("id", user.id)
          .single();

        if (profileError || !profile) {
          console.error("Profile error:", profileError);
          router.push(
            "/?error=" +
              encodeURIComponent(
                "המייל אינו רשום במערכת. אנא פנה למזכירות."
              )
          );
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
        console.error("Callback error:", err);
        router.push("/?error=" + encodeURIComponent(err?.message || "שגיאה בתהליך האימות"));
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
        }}
      >
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
        <p style={{ color: "#5c4a3c", fontWeight: 600, fontSize: 16 }}>
          {status}
        </p>
        <p style={{ color: "#9c8a7c", fontSize: 12, marginTop: 4 }}>
          אנא המתן...
        </p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
