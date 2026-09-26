import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";

import "./globals.css";

import { Providers } from "@/providers/providers";
import { APP_NAME, APP_TAGLINE } from "@/constants/app";
import { API_BASE_URL } from "@/constants/app";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: `${APP_NAME} · ${APP_TAGLINE}`,
    template: `%s · ${APP_NAME}`,
  },
  description:
    "Real-time disaster intelligence for citizens: live alerts, hazard maps, nearby shelters and community reports.",
  applicationName: APP_NAME,
  keywords: [
    "disaster intelligence",
    "emergency alerts",
    "flood warning",
    "shelter locator",
    "citizen safety",
  ],
  openGraph: {
    title: `${APP_NAME} · ${APP_TAGLINE}`,
    description:
      "Live alerts, hazard maps and nearby emergency resources for your area.",
    type: "website",
  },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // The map fills the viewport on mobile; prevent the page from zooming oddly.
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f7f4" },
    { media: "(prefers-color-scheme: dark)", color: "#1b2027" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans`}>
        <Providers apiBaseUrl={API_BASE_URL}>{children}</Providers>
      </body>
    </html>
  );
}
