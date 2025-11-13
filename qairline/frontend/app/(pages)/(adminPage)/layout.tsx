import { Metadata } from "next";
import Header from "@/app/components/AdminHeader";
import Footer from "@/app/components/Footer";
import { Montserrat } from "next/font/google";

const montserrat = Montserrat({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Cloud Airlines's Admin Page",
  description: "Page about Airline",
};

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={montserrat.className}>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
