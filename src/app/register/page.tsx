"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { registerSchema, type RegisterValues } from "@/lib/validations/auth";
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

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // สร้าง form ด้วย react-hook-form และ zod validation
  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      userId: "",
      password: "",
      confirmPassword: "",
      phoneNumber: "",
    },
  });

  // ฟังก์ชันเมื่อส่งฟอร์ม
  async function onSubmit(data: RegisterValues) {
    setIsLoading(true);

    try {
      // เรียกใช้ฟังก์ชัน register จาก auth context
      const success = await registerUser(
        data.userId,
        data.password,
        data.phoneNumber
      );

      if (success) {
        router.push("/login");
      }
    } catch (error) {
      console.error("Register error:", error);
      toast.error("เกิดข้อผิดพลาดในการสมัครสมาชิก");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="container flex h-screen items-center justify-center">
      <Card className="mx-auto max-w-md w-full">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">สมัครสมาชิก</CardTitle>
          <CardDescription>
            กรอกข้อมูลเพื่อสร้างบัญชีผู้ใช้งานใหม่
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
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ยืนยันรหัสผ่าน</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="ยืนยันรหัสผ่าน"
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
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>เบอร์โทรศัพท์</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="0xxxxxxxxx"
                        {...field}
                        disabled={isLoading || authLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading || authLoading}>
                {isLoading || authLoading ? "กำลังดำเนินการ..." : "สมัครสมาชิก"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="text-center">
          <div className="text-sm text-muted-foreground w-full">
            <span>มีบัญชีผู้ใช้งานแล้ว? </span>
            <Link
              href="/login"
              className="text-primary underline-offset-4 hover:underline"
            >
              เข้าสู่ระบบ
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
