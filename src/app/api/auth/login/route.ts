import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import { verifyPassword, generateToken } from "@/lib/auth";
import { loginSchema } from "@/lib/validations/auth";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    // รับข้อมูลจาก request
    const body = await req.json();

    // ตรวจสอบข้อมูลด้วย Zod schema
    const validatedData = loginSchema.parse(body);

    // ค้นหาผู้ใช้จากฐานข้อมูล
    const user = await prisma.user.findUnique({
      where: { userId: validatedData.userId },
    });

    // ตรวจสอบว่ามีผู้ใช้หรือไม่
    if (!user) {
      return NextResponse.json(
        { error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" },
        { status: 401 }
      );
    }

    // ตรวจสอบรหัสผ่าน
    const isPasswordValid = verifyPassword(validatedData.password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" },
        { status: 401 }
      );
    }

    // สร้าง session token (ในระบบจริงควรใช้ JWT หรือวิธีอื่นที่ปลอดภัยกว่า)
    const sessionToken = generateToken();

    // ส่งข้อมูลผู้ใช้กลับไป (ไม่รวมรหัสผ่าน)
    return NextResponse.json(
      {
        id: user.id,
        userId: user.userId,
        phoneNumber: user.phoneNumber,
        credits: user.credits,
        isAdmin: user.isAdmin,
        token: sessionToken,
      },
      {
        status: 200,
        headers: {
          'Set-Cookie': `auth_token=${sessionToken}; Path=/; HttpOnly; Max-Age=86400` // 24 hours
        }
      }
    );
  } catch (error) {
    console.error("Login error:", error);

    // ตรวจสอบว่าเป็น Zod error หรือไม่
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "ข้อมูลไม่ถูกต้อง", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในระบบ" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
