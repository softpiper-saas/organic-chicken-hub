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
  metadataBase: new URL('https://organicfoodshubbd.com'),
  title: {
    default: "Organic Foods Hub BD | Pure Nature, Delivered",
    template: "%s | Organic Foods Hub BD",
  },
  description: "Your trusted source for organic chicken, honey, ghee, nuts, and more in Bangladesh. Eat healthy, live healthy with Organic Foods Hub BD.",
  keywords: ["organic chicken", "organic honey", "ghee bd", "nuts bd", "healthy food", "organic farming bangladesh", "organic foods hub"],
  authors: [{ name: "Organic Foods Hub Team" }],
  creator: "Organic Foods Hub BD",
  publisher: "Organic Foods Hub BD",
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
    url: 'https://organicfoodshubbd.com',
    title: "Organic Foods Hub BD | Pure Nature, Delivered",
    description: "Your trusted source for organic chicken, honey, ghee, nuts, and more in Bangladesh.",
    siteName: "Organic Foods Hub BD",
  },
  twitter: {
    card: 'summary_large_image',
    title: "Organic Foods Hub BD | Pure Nature, Delivered",
    description: "Your trusted source for organic chicken, honey, ghee, nuts, and more in Bangladesh.",
    creator: "@organicfoodshubbd",
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
        suppressHydrationWarning
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
