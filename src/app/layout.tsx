import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://organic-chicken-aggregator.vercel.app'),
  title: {
    default: "Organic Chicken Aggregator | Safe & Healthy Chicken in Bangladesh",
    template: "%s | Organic Chicken Aggregator",
  },
  description: "Compare prices, read reviews, and find the best organic chicken providers in Bangladesh. Eat healthy, live healthy.",
  keywords: ["organic chicken", "deshi chicken", "chicken price bd", "healthy food", "organic farming bangladesh"],
  authors: [{ name: "Softpiper Team" }],
  creator: "Softpiper",
  publisher: "Softpiper",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://organic-chicken-aggregator.vercel.app',
    title: "Organic Chicken Aggregator | Safe & Healthy Chicken in Bangladesh",
    description: "Compare prices, read reviews, and find the best organic chicken providers in Bangladesh.",
    siteName: "Organic Chicken Aggregator",
  },
  twitter: {
    card: 'summary_large_image',
    title: "Organic Chicken Aggregator | Safe & Healthy Chicken in Bangladesh",
    description: "Compare prices, read reviews, and find the best organic chicken providers in Bangladesh.",
    creator: "@softpiper",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}
      >
        <Navbar />
        <main className="flex-1">
          {children}
        </main>
      </body>
    </html>
  );
}
