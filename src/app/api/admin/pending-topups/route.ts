import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const topups = await prisma.creditTopup.findMany({
      where: { status: "pending" },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(topups);
  } catch (error) {
    console.error("Error loading topups:", error);
    return NextResponse.json({ error: "โหลดข้อมูลล้มเหลว" }, { status: 500 });
  }
}
