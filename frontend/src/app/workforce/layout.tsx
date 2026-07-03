import React from "react";
import { Inter } from "next/font/google";
import "@/app/globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "FoxFlow Workforce",
  description: "Worker Mobile App for Factory Floor",
  themeColor: "#000000",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0",
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
