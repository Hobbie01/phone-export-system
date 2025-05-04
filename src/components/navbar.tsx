"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 py-4 px-6">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-xl font-bold text-primary">
          Phone Export System
        </Link>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                สวัสดี, {user.userId} | เครดิต: {user.credits}
              </div>
              {user.isAdmin && (
                <Link
                  href="/admin"
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors"
                >
                  หน้าแอดมิน
                </Link>
              )}
              <Link
                href="/credit"
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors"
              >
                เติมเครดิต
              </Link>
              <Button
                variant="ghost"
                className="text-sm"
                onClick={() => {
                  logout();
                  window.location.href = "/";
                }}
              >
                ออกจากระบบ
              </Button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors"
              >
                เข้าสู่ระบบ
              </Link>
              <Link
                href="/register"
                className="text-sm bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
              >
                สมัครสมาชิก
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
