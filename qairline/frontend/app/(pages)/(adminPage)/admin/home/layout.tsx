import Footer from "@/app/components/Footer";
import Header from "@/app/components/AdminHeader";
import { Montserrat } from "next/font/google";
import Dropdown from "@/app/components/Dropdown";
const montserrat = Montserrat({ subsets: ["latin"] });

export default function AdminPageLayout({children}: {children: React.ReactNode}) {
    return (
        <div className={montserrat.className} style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
            <div style={{ flex: 1, position: "relative" }}>
                <Dropdown />
                {children}
            </div>
        </div>
    );
  }
  