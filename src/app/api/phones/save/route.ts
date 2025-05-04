import { type NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Normalize เบอร์ เช่น ลบ + - ช่องว่าง
function normalize(phone: string): string {
  return phone.replace(/\D/g, "");
}

export async function POST(req: NextRequest) {
  try {
    const { userId, phones } = await req.json();

    if (!userId || !phones || !Array.isArray(phones)) {
      return NextResponse.json({ error: "ข้อมูลไม่ครบถ้วน" }, { status: 400 });
    }

    if (phones.length === 0) {
      return NextResponse.json(
        { error: "ไม่พบข้อมูลเบอร์โทรศัพท์" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return NextResponse.json({ error: "ไม่พบข้อมูลผู้ใช้" }, { status: 404 });
    }

    // 1. Normalize และกรองเบอร์ซ้ำภายในลิสต์เอง
    const normalizedSet = new Set<string>();
    const normalizedPhones: string[] = [];

    for (const rawPhone of phones) {
      const phone = normalize(rawPhone);
      if (phone && !normalizedSet.has(phone)) {
        normalizedSet.add(phone);
        normalizedPhones.push(phone);
      }
    }

    if (normalizedPhones.length === 0) {
      return NextResponse.json(
        { error: "ไม่มีเบอร์โทรศัพท์ที่สามารถบันทึกได้" },
        { status: 400 }
      );
    }

    // 2. ดึงเบอร์ที่เคยบันทึกไว้แล้วของ user
    const existingPhones = await prisma.phoneNumber.findMany({
      where: { userId: user.id },
      select: { number: true },
    });

    const existingSet = new Set(existingPhones.map((p) => normalize(p.number)));

    // 3. กรองออกเฉพาะเบอร์ที่ยังไม่เคยบันทึก
    const newPhones = normalizedPhones.filter((p) => !existingSet.has(p));

    if (newPhones.length === 0) {
      return NextResponse.json({
        success: true,
        message: "ไม่มีเบอร์โทรศัพท์ใหม่ที่จะบันทึก",
      });
    }

    const batchId = `batch_${Date.now()}`;

    const result = await prisma.phoneNumber.createMany({
      data: newPhones.map((number) => ({
        userId: user.id,
        number,
        batch: batchId,
      })),
      skipDuplicates: true, // กันซ้ำในระดับ DB อีกชั้น
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
