"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";

// กำหนดรูปแบบข้อมูลผู้ใช้
interface User {
  id: string;
  userId: string;
  phoneNumber: string;
  credits: number;
  isAdmin: boolean;
}

// กำหนดรูปแบบของ context
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (userId: string, password: string) => Promise<boolean>;
  register: (userId: string, password: string, phoneNumber: string) => Promise<boolean>;
  logout: () => void;
}

// สร้าง context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hook สำหรับการเข้าถึง context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ตรวจสอบสถานะการเข้าสู่ระบบเมื่อโหลดหน้า
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // ในระบบจริงควรมีการตรวจสอบ token ที่เก็บใน cookie กับ API
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error("Auth check error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // ฟังก์ชันสำหรับการเข้าสู่ระบบ
  const login = async (userId: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "เข้าสู่ระบบไม่สำเร็จ");
        return false;
      }

      // บันทึกข้อมูลผู้ใช้
      setUser(data);
      localStorage.setItem("user", JSON.stringify(data));
      toast.success("เข้าสู่ระบบสำเร็จ");
      return true;
    } catch (error) {
      console.error("Login error:", error);
      toast.error("เกิดข้อผิดพลาดในการเข้าสู่ระบบ");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // ฟังก์ชันสำหรับการสมัครสมาชิก
  const register = async (
    userId: string,
    password: string,
    phoneNumber: string
  ): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, password, confirmPassword: password, phoneNumber }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "สมัครสมาชิกไม่สำเร็จ");
        return false;
      }

      toast.success("สมัครสมาชิกสำเร็จ กรุณาเข้าสู่ระบบ");
      return true;
    } catch (error) {
      console.error("Register error:", error);
      toast.error("เกิดข้อผิดพลาดในการสมัครสมาชิก");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // ฟังก์ชันสำหรับการออกจากระบบ
  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    toast.success("ออกจากระบบสำเร็จ");
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
