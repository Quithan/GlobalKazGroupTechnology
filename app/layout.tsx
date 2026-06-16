import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GlobalKazGroup Technology — Системный IT/AI интегратор",
  description:
    "ТОО «GlobalKazGroup Technology» — системный интегратор полного цикла. Внедряем AI-решения, ERP, CRM и цифровую инфраструктуру для B2G и B2B сегментов стран СНГ.",
  keywords: [
    "IT интегратор", "AI решения", "цифровизация", "ERP", "CRM",
    "Казахстан", "СНГ", "искусственный интеллект", "ЦОД", "GlobalKazGroup",
  ],
  openGraph: {
    title: "GlobalKazGroup Technology",
    description: "Системный IT/AI интегратор стран СНГ",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
