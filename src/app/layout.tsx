import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SecureAudio EHR — Audio Steganography System",
  description:
    "HIPAA-compliant audio steganography system for concealing Electronic Health Records within audio carrier files using the Fourfold paradigm.",
  keywords: ["audio steganography", "EHR", "HIPAA", "health records", "security"],
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
          href="https://fonts.googleapis.com/css2?family=Space+Mono:ital,wght@0,400;0,700;1,400&family=Syne:wght@400;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="grid-bg noise min-h-screen text-slate-200">{children}</body>
    </html>
  );
}
