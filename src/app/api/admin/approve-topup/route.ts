import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "ต้องระบุ id" }, { status: 400 });
    }
    const topup = await prisma.creditTopup.findUnique({
      where: { id, status: "pending" },
    });
    if (!topup) {
      return NextResponse.json(
        { error: "ไม่พบรายการหรือรายการนี้ได้รับการอนุมัติแล้ว" },
        { status: 400 }
      );
    }
    const updated = await prisma.creditTopup.update({
      where: { id },
      data: { status: "approved" },
    });

    await prisma.user.update({
      where: { id: topup.userId },
      data: {
        credits: {
          increment: topup.amount,
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Approve error:", error);
    return NextResponse.json({ error: "อนุมัติไม่สำเร็จ" }, { status: 500 });
  }
}
