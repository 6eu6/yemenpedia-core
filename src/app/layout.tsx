import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic, Inter } from "next/font/google";
import "./globals.css";

// GOVERNANCE COMPLIANCE: Article II, Section 2.4 - Typography
// Arabic: IBM Plex Sans Arabic | English: Inter
const ibmPlexSansArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic"],
  weight: ["300", "400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-english",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "يمنبيديا - موسوعة اليمن الوطنية | Yemenpedia",
  description: "المصدر الشامل للمعرفة عن اليمن - موسوعة وطنية تهتم بتوثيق تاريخ اليمن وتراثه وجغرافيته وثقافته.",
  keywords: ["يمنبيديا", "Yemenpedia", "اليمن", "Yemen", "موسوعة", "encyclopedia", "تاريخ اليمن", "ثقافة يمنية", "تراث يمني"],
  authors: [{ name: "Yemenpedia Team" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "يمنبيديا - موسوعة اليمن الوطنية",
    description: "المصدر الشامل للمعرفة عن اليمن",
    url: "https://yemenpedia.org",
    siteName: "Yemenpedia",
    type: "website",
    locale: "ar_YE",
  },
  twitter: {
    card: "summary_large_image",
    title: "يمنبيديا - موسوعة اليمن الوطنية",
    description: "المصدر الشامل للمعرفة عن اليمن",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
