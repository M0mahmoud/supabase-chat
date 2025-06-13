import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/providers/theme-provider";
import Sidebar from "@/components/layout/sidebar/Sidebar";
import NextTopLoader from "nextjs-toploader";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Chat",
  description: "Generated by create next app and Supabase",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} antialiased`}
      >
        <ThemeProvider attribute="class" defaultTheme="dark">
          <NextTopLoader color="#155dfc" height={4} showSpinner={false} />
          <div className="flex w-full h-full min-h-dvh max-w-[1660px] mx-auto">
            <Sidebar />
            <div className="flex justify-center items-center w-full h-full">
              {children}
            </div>
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
