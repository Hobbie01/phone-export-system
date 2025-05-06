import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import { v4 as uuidv4 } from "uuid";
import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

const prisma = new PrismaClient();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: NextRequest) {
  try {
    console.log("Received request to /api/credit");

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
    const originalFileName = file.name;
    const sanitizedFileName = originalFileName.replace(
      /[^a-zA-Z0-9.\-_]/g,
      "_"
    );
    const fileName = `${uuidv4()}_${sanitizedFileName}`;

    const tmpPath = `/tmp/${fileName}`;

    // เขียนไฟล์ลง /tmp
    await writeFile(tmpPath, buffer);

    // อัปโหลดไฟล์ไป Supabase Storage
    const { data, error: uploadError } = await supabase.storage
      .from("credit-uploads")
      .upload(fileName, buffer, {
        cacheControl: "3600",
        upsert: false,
      });
    if (uploadError) {
      console.error("Supabase Storage upload error:", uploadError);
      return NextResponse.json(
        { error: "Upload to Storage failed" },
        { status: 500 }
      );
    }

    // ได้ public URL
    const { data: publicUrlData } = supabase.storage
      .from("credit-uploads")
      .getPublicUrl(fileName);
    const imageUrl = publicUrlData.publicUrl;

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
