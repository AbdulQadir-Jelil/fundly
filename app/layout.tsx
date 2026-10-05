import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter";
import "./globals.css";
import { AppProviders } from "@/components/providers/AppProviders";

export const metadata: Metadata = {
  metadataBase: new URL("https://fundly.app"),
  title: {
    default: "Fundly — Household spending made clear",
    template: "%s · Fundly",
  },
  description:
    "Track money given to funds, record every naira spent, and share a clear summary with your household.",
  applicationName: "Fundly",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Fundly",
  },
  formatDetection: {
    telephone: false,
    date: false,
    address: false,
    email: false,
  },
  openGraph: {
    type: "website",
    siteName: "Fundly",
    title: "Fundly — Household spending made clear",
    description:
      "Track money given to funds, record every naira spent, and share a clear summary with your household.",
    locale: "en_NG",
    images: [{ url: "/icons/icon-512.png", width: 512, height: 512 }],
  },
  twitter: {
    card: "summary",
    title: "Fundly — Household spending made clear",
    description: "Track household funds and every expense in one calm place.",
    images: ["/icons/icon-512.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbf6ec" },
    { media: "(prefers-color-scheme: dark)", color: "#123329" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-NG" suppressHydrationWarning>
      <body className="min-h-dvh bg-app antialiased tap-transparent">
        {/* First tab stop for keyboard users; screens provide their own headings. */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-200 focus:rounded-xl focus:bg-forest-700 focus:px-4 focus:py-2.5 focus:text-[15px] focus:font-semibold focus:text-white"
        >
          Skip to content
        </a>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}