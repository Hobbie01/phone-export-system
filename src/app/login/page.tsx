"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { loginSchema, type LoginValues } from "@/lib/validations/auth";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // สร้าง form ด้วย react-hook-form และ zod validation
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      userId: "",
      password: "",
    },
  });

  // ฟังก์ชันเมื่อส่งฟอร์ม
  async function onSubmit(data: LoginValues) {
    setIsLoading(true);

    try {
      // เรียกใช้ฟังก์ชัน login จาก auth context
      const success = await login(data.userId, data.password);

      if (success) {
        router.push("/");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("เกิดข้อผิดพลาดในการเข้าสู่ระบบ");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="container flex h-screen items-center justify-center">
      <Card className="mx-auto max-w-md w-full">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">เข้าสู่ระบบ</CardTitle>
          <CardDescription>
            กรอกชื่อผู้ใช้และรหัสผ่านเพื่อเข้าสู่ระบบ
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="userId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ชื่อผู้ใช้</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="ชื่อผู้ใช้"
                        {...field}
                        disabled={isLoading || authLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>รหัสผ่าน</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="รหัสผ่าน"
                        {...field}
                        disabled={isLoading || authLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading || authLoading}>
                {isLoading || authLoading ? "กำลังดำเนินการ..." : "เข้าสู่ระบบ"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 text-center">
          <div className="text-sm text-muted-foreground">
            <span>ยังไม่มีบัญชีผู้ใช้งาน? </span>
            <Link
              href="/register"
              className="text-primary underline-offset-4 hover:underline"
            >
              สมัครสมาชิก
            </Link>
          </div>
          <div className="text-sm text-muted-foreground">
            <Link
              href="#"
              className="text-primary underline-offset-4 hover:underline"
            >
              ลืมรหัสผ่าน?
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
