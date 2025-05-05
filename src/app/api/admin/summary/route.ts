import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const [userCount, phoneExports, pendingTopups, creditSum] =
      await Promise.all([
        prisma.user.count(),
        prisma.phoneExport.count(),
        prisma.creditTopup.count({ where: { status: "pending" } }),
        prisma.user.aggregate({ _sum: { credits: true } }),
      ]);

    return NextResponse.json({
      userCount,
      phoneExports,
      pendingTopups,
      totalCredits: creditSum._sum.credits ?? 0,
    });
  } catch (error) {
    console.error("Error fetching admin summary:", error);
    return NextResponse.json(
      { error: "ไม่สามารถโหลดข้อมูลได้" },
      { status: 500 }
    );
  }
}
