import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { IconSprite } from "@/components/Icons";
import "./globals.css";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

export const metadata: Metadata = {
  title: "Pulse · VPS Status",
  description: "Live status dashboard for the pulse.mayankpadhi.in VPS — CPU, memory, disk, containers, services, alerts and backups.",
  icons: { icon: `${basePath}/favicon.svg` },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f172a",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <IconSprite />
        {children}
      </body>
    </html>
  );
}
