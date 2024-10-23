'use client';

import localFont from "next/font/local";
import "./globals.css";
import Toast from "../app/components/Toast"; 
import { SessionProvider } from 'next-auth/react';
import Head from 'next/head';

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <Head>
        <title>Clinic Management App</title>
        <meta name="description" content="A Next.js application for clinic management" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-100`}
      >
        <SessionProvider>
          {/* Toast component outside of main content for global access */}
          <Toast />

          {/* You can add a Navbar component here when ready */}
          {/* <Navbar /> */}

          <main className="container mx-auto p-4">
            {children}
          </main>
        </SessionProvider>
      </body>
    </html>
  );
}
