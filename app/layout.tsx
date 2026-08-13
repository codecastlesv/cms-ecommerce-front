import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from 'sonner';
import QueryProvider from '@/components/providers/QueryProvider';
import { ConfirmDialogProvider } from '@/components/providers/ConfirmDialogProvider';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Galaxia Deportes",
  description: "Galaxia Deportes CMS E-commerce",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <QueryProvider>

          <ConfirmDialogProvider>

            {children}

            <Toaster position="top-right" richColors />

          </ConfirmDialogProvider>

        </QueryProvider>
      </body>
    </html>
  );
}