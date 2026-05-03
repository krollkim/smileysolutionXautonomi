import type { Metadata } from "next";
import { Inter, Playfair_Display, Heebo } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

const heebo = Heebo({
  variable: "--font-heebo",
  subsets: ["hebrew", "latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Content OS — Smiley Solution",
  description: "Internal content pipeline dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="he"
      dir="rtl"
      className={`${inter.variable} ${playfair.variable} ${heebo.variable} h-full`}
    >
      <body className="h-full antialiased">{children}</body>
    </html>
  );
}
