import type { Metadata, Viewport } from "next";
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
  title: "Vitasigns Training Bot",
  description: "AI-powered training assistant for Vitasigns clinical SOPs, HubSpot workflows, and HealthArc navigation. Get instant answers to your training questions.",
  applicationName: "Vitasigns Training Bot",
  authors: [{ name: "Vitasigns" }],
  keywords: ["Vitasigns", "training", "clinical SOP", "HubSpot", "HealthArc", "AI assistant"],
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: "/logo.png",
  },
  openGraph: {
    title: "Vitasigns Training Bot",
    description: "AI-powered training assistant for Vitasigns clinical SOPs, HubSpot workflows, and HealthArc navigation.",
    type: "website",
    siteName: "Vitasigns Training Bot",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
