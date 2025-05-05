"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

export function Navbar() {
  const { user, logout } = useAuth();

  useEffect(() => {
    async function refreshCredits() {
      if (user) {
        try {
          const res = await fetch("/api/credit");
          if (res.ok) {
            const data = await res.json();
            if (typeof data?.credits === "number") {
              // update local user credits while keeping other fields
              const updatedUser = { ...user, credits: data.credits };
              localStorage.setItem("user", JSON.stringify(updatedUser));
              // hacky manual update of context (rely on login function for single source in real system)
              // window.location.reload(); // option if context does not refresh automatically
            }
          }
        } catch (e) {
          // fail silently
        }
      }
    }
    refreshCredits();
    // eslint-disable-next-line
  }, []);

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
                  href="/admin/dashboard"
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
