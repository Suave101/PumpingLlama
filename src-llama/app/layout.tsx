import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import 'katex/dist/katex.min.css';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pumping Llama",
  description: "A tool for learning and practicing automata theory.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-steel-950">
        {/* Crimson-and-gold trim across the top of every page */}
        <div aria-hidden="true" className="h-1 shrink-0 bg-gradient-to-r from-crimson-700 via-gold-500 to-crimson-700" />
        {children}
      </body>
    </html>
  );
}
