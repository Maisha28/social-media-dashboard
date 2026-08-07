import type { Metadata, Viewport } from "next";
import AppShell from "@/components/AppShell";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "SocialPulse — Social media analytics",
    template: "%s · SocialPulse",
  },
  description:
    "Connect Instagram and Facebook to track reach, engagement and growth, with AI-generated insights and exportable reports.",
  applicationName: "SocialPulse",
  openGraph: {
    title: "SocialPulse — Social media analytics",
    description:
      "Connect Instagram and Facebook to track reach, engagement and growth in one workspace.",
    type: "website",
  },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#141824",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
