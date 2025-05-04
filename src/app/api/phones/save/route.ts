import { type NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { userId, phones } = await req.json();

    // ตรวจสอบข้อมูลที่ส่งมา
    if (!userId || !phones || !Array.isArray(phones)) {
      return NextResponse.json({ error: "ข้อมูลไม่ครบถ้วน" }, { status: 400 });
    }

    // ตรวจสอบว่ามีข้อมูลเบอร์โทรศัพท์หรือไม่
    if (phones.length === 0) {
      return NextResponse.json({ error: "ไม่พบข้อมูลเบอร์โทรศัพท์" }, { status: 400 });
    }

    // ค้นหาข้อมูลผู้ใช้
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "ไม่พบข้อมูลผู้ใช้" }, { status: 404 });
    }

    // สร้าง batch ID สำหรับการบันทึกข้อมูล
    const batchId = `batch_${Date.now()}`;

    // บันทึกข้อมูลเบอร์โทรศัพท์ลงฐานข้อมูล
    // ใช้ createMany เพื่อบันทึกข้อมูลจำนวนมากในครั้งเดียว
    const result = await prisma.phoneNumber.createMany({
      data: phones.map((phone) => ({
        userId: user.id,
        number: phone,
        batch: batchId,
      })),
    });

    return NextResponse.json({
      success: true,
      count: result.count,
      batchId,
    });
  } catch (error) {
    console.error("Save phones error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการบันทึกข้อมูล" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
