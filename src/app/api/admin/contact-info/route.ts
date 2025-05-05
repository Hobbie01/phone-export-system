import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// --- หากต้องใช้ auth เดิม ปกติจะใช้ next-auth หรือ session validate เพิ่มตรงนี้ ---

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    // ตรวจสอบว่ามี row เดิมไหม?
    let info = await prisma.contactInfo.findFirst();
    if (!info) {
      // ยังไม่มี ให้สร้างใหม่
      info = await prisma.contactInfo.create({ data: { ...body } });
      return NextResponse.json(info);
    }
    // มี row เดิม อัปเดตได้เลย
    const updated = await prisma.contactInfo.update({
      where: { id: info.id },
      data: { ...body },
    });
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
