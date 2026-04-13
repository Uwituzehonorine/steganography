import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Audio Processing Tool",
  description:
    "Audio processing tool for public speaking enhancement and practice sessions.",
  keywords: ["audio processing", "public speaking", "speech enhancement", "audio tool"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-slate-50 text-slate-900">{children}</body>
    </html>
  );
}
