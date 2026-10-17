// Next.js App Router (app/layout.tsx) Integration Example
import type { Metadata } from "next";
import Script from "next/script";

export const metadata: Metadata = {
  title: "InfraPulse AI",
  description: "Autonomous Urban Infrastructure Triage",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Firebase Fleet Manager Guard */}
        <Script
          src="http://localhost:4000/guard.js"
          strategy="beforeInteractive"
          data-site-id="mygovthub"
          data-check-interval="5000"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
