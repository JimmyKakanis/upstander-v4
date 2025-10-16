import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import Header from "@/components/layout/Header";

export const metadata: Metadata = {
  title: "Upstander: Anonymous Bullying Reporting",
  description: "A safe and anonymous way to report bullying incidents.",
  icons: {
    icon: '/logo.svg',
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
        className={`${GeistSans.variable} ${GeistMono.variable} antialiased bg-slate-50 text-slate-800`}
      >
        <Header />
        <main>
          {children}
        </main>
      </body>
    </html>
  );
}
