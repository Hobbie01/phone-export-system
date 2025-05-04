import type { Metadata } from "next";
import { Inter as FontSans } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import ClientBody from "./ClientBody";
import { Navbar } from "@/components/navbar";

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans"
});

export const metadata: Metadata = {
  title: "ระบบอัปโหลดและส่งออกข้อมูลลูกค้า",
  description: "ระบบอัปโหลดและส่งออกข้อมูลเบอร์โทรศัพท์ลูกค้า พร้อมระบบสมาชิกและเติมเครดิต",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" suppressHydrationWarning>
      <body className={fontSans.className}>
        <ClientBody>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            <Navbar />

            <main>{children}</main>

            <footer className="border-t border-gray-200 dark:border-gray-800 py-6 mt-12">
              <div className="container mx-auto px-6 text-center text-gray-600 dark:text-gray-400">
                <p>© {new Date().getFullYear()} ระบบอัปโหลดและส่งออกข้อมูลลูกค้า. All rights reserved.</p>
              </div>
            </footer>
          </div>
          <Toaster richColors position="top-right" />
        </ClientBody>
      </body>
    </html>
  );
}
