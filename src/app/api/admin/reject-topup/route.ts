import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "ต้องระบุ id" }, { status: 400 });
    }

    const updated = await prisma.creditTopup.update({
      where: { id },
      data: { status: "rejected" },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Reject error:", error);
    return NextResponse.json({ error: "ปฏิเสธไม่สำเร็จ" }, { status: 500 });
  }
}
