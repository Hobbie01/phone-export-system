import { NextResponse } from "next/server";
import { PrismaClient, CreditTopup } from "@prisma/client";
import { format } from "date-fns";
import { th } from "date-fns/locale";

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

        // Convert and format transactionTime using the utility function
        const formattedTransactionTime = format(
          topup.transactionTime ? new Date(topup.transactionTime) : new Date(),
          "PPpp",
          { locale: th }
        );

        return {
          ...topup,
          transactionTime: formattedTransactionTime,
          user: user ? user.userId : null,
        };
      })
    );
    return NextResponse.json(topupsWithUser);
  } catch (error) {
    console.error("Error loading topups:", error);
    return NextResponse.json({ error: "โหลดข้อมูลล้มเหลว" }, { status: 500 });
  }
}
