import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";
import { t } from "@/lib/i18n";

export const metadata: Metadata = {
  title: {
    default: t.common.appName,
    template: `%s | ${t.common.appName}`,
  },
  description: t.common.tagline,
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: t.common.appName,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#2563eb",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
