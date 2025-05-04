import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "@/lib/auth";
import { registerSchema } from "@/lib/validations/auth";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    // รับข้อมูลจาก request
    const body = await req.json();

    // ตรวจสอบข้อมูลด้วย Zod schema
    const validatedData = registerSchema.parse(body);

    // ตรวจสอบว่ามี userId ซ้ำหรือไม่
    const existingUser = await prisma.user.findUnique({
      where: { userId: validatedData.userId },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "ชื่อผู้ใช้นี้ถูกใช้งานแล้ว" },
        { status: 409 }
      );
    }

    // สร้างผู้ใช้ใหม่
    const newUser = await prisma.user.create({
      data: {
        userId: validatedData.userId,
        password: hashPassword(validatedData.password),
        phoneNumber: validatedData.phoneNumber,
        credits: 0, // เริ่มต้นด้วยเครดิต 0
        isAdmin: false, // ผู้ใช้ใหม่ไม่ใช่แอดมิน
      },
    });

    // ส่งข้อมูลผู้ใช้กลับไป (ไม่รวมรหัสผ่าน)
    return NextResponse.json(
      {
        id: newUser.id,
        userId: newUser.userId,
        phoneNumber: newUser.phoneNumber,
        credits: newUser.credits,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Register error:", error);

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
