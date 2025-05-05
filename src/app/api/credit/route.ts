import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const userId = formData.get("userId")?.toString();
    const amount = parseFloat(formData.get("amount")?.toString() || "0");
    const bankAccount = formData.get("bankAccount")?.toString() || null;
    const transactionTime = formData.get("transactionTime")?.toString();

    const file = formData.get("slipImage") as File;

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!userId || !amount || !file) {
      return NextResponse.json({ error: "ข้อมูลไม่ครบ" }, { status: 400 });
    }

    // สร้าง buffer จากไฟล์
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // สร้างชื่อไฟล์ที่ไม่ซ้ำกัน
    const fileName = `${uuidv4()}_${file.name}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads");

    // ตรวจสอบและสร้างไดเรกทอรี uploads ถ้าไม่มี
    await mkdir(uploadDir, { recursive: true });

    // เขียนไฟล์ไปที่ระบบ
    await writeFile(path.join(uploadDir, fileName), buffer);

    const imageUrl = `/uploads/${fileName}`;

    // เพิ่มข้อมูล topup ในฐานข้อมูล
    const newTopup = await prisma.creditTopup.create({
      data: {
        userId,
        amount,
        bankAccount,
        transactionTime: transactionTime ? new Date(transactionTime) : null,
        slipImageUrl: imageUrl,
        status: "pending",
      },
    });

    return NextResponse.json(newTopup);
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
