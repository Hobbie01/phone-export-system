import { NextResponse } from "next/server";
import { PrismaClient, CreditTopup } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const topups = await prisma.creditTopup.findMany({
      where: { status: "pending" },
      orderBy: { createdAt: "desc" },
    });

    const topupsWithUser = await Promise.all(
      topups.map(async (topup: CreditTopup) => {
        const user = await prisma.user.findUnique({
          where: { id: topup.userId },
          select: { userId: true },
        });
        return { ...topup, user: user ? user.userId : null };
      })
    );
    return NextResponse.json(topupsWithUser);
  } catch (error) {
    console.error("Error loading topups:", error);
    return NextResponse.json({ error: "โหลดข้อมูลล้มเหลว" }, { status: 500 });
  }
}
