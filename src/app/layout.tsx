import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "e-Kréta Web",
  description: "Mobilbarát nem hivatalos e-Kréta kliens",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "e-Kréta",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0f172a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="hu">
      <body className="antialiased min-h-dvh">{children}</body>
    </html>
  );
}