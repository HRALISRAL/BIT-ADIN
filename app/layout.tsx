import type { Metadata } from "next";
import { Noto_Serif_Hebrew, Assistant } from "next/font/google";
import "./globals.css";

const notoSerif = Noto_Serif_Hebrew({
  variable: "--font-serif",
  subsets: ["hebrew"],
  weight: ["300", "400", "600", "700", "900"],
});

const assistant = Assistant({
  variable: "--font-sans",
  subsets: ["hebrew"],
  weight: ["300", "400", "500", "700", "800"],
});

export const metadata: Metadata = {
  title: "מערכת ניהול בית דין | בית הדין האזורי",
  description: "מערכת מתקדמת לניהול תיקים, דיונים, והרכבי דיינים עבור בית הדין.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="he"
      dir="rtl"
      className={`${notoSerif.variable} ${assistant.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-[#faf6ee] text-[#2c1d11] selection:bg-[#d4af37]/30 selection:text-[#2c1d11]">
        {children}
      </body>
    </html>
  );
}
