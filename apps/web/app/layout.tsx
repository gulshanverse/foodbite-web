import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "FoodBite — Good Food. Less Waste.", description: "An India-first surplus food marketplace." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
