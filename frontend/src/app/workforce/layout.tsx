import React from "react";
import { Inter } from "next/font/google";
import "@/app/globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "FoxFlow Workforce",
  description: "Worker Mobile App for Factory Floor",
};

export const viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function WorkforceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`min-h-screen bg-background text-foreground ${inter.className} antialiased`}>
      {children}
    </div>
  );
}
