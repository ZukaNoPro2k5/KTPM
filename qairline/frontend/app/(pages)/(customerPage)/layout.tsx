import type { Metadata } from "next";
import '@/app/global/global.css';
import localFont from "next/font/local";
import Header from "@/app/components/CustomerHeader";
import Footer from "@/app/components/Footer";
import { Montserrat } from "next/font/google";

const montserrat = Montserrat({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Cloud Airlines",
  description: "Page about Airline",
};


export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={montserrat.className}>
        <Header/>
        <main>{children}</main>
        <Footer/>
      </body>
    </html>
  );
}
