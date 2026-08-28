import type { Metadata } from "next";
import { Geist, Geist_Mono, Lora, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Message App",
  description: "A modern messaging application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${lora.variable} ${spaceGrotesk.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col font-sans-active">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
