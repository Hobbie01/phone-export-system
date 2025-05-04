import { type NextRequest, NextResponse } from "next/server";
import { join } from "node:path";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";

// ตำแหน่งที่เก็บไฟล์ส่งออก
const exportsDir = join(process.cwd(), "exports");

export async function GET(req: NextRequest) {
  try {
    const fileName = req.nextUrl.searchParams.get("file");

    if (!fileName) {
      return NextResponse.json({ error: "ไม่ระบุชื่อไฟล์" }, { status: 400 });
    }

    // ป้องกัน path traversal
    const sanitizedFileName = fileName.replace(/\.\./g, "").replace(/\//g, "");
    const filePath = join(exportsDir, sanitizedFileName);

    // ตรวจสอบว่าไฟล์มีอยู่หรือไม่
    if (!existsSync(filePath)) {
      return NextResponse.json({ error: "ไม่พบไฟล์" }, { status: 404 });
    }

    // อ่านข้อมูลไฟล์
    const buffer = await readFile(filePath);

    // กำหนด Content-Type ตามนามสกุลไฟล์
    let contentType = "application/octet-stream";

    if (sanitizedFileName.endsWith(".xlsx")) {
      contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    } else if (sanitizedFileName.endsWith(".csv")) {
      contentType = "text/csv";
    } else if (sanitizedFileName.endsWith(".txt")) {
      contentType = "text/plain";
    }

    // สร้าง Response พร้อม Content-Disposition เพื่อให้บราวเซอร์ดาวน์โหลดไฟล์
    const response = new NextResponse(buffer);
    response.headers.set("Content-Type", contentType);
    response.headers.set(
      "Content-Disposition",
      `attachment; filename="${sanitizedFileName}"`
    );

    return response;
  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดาวน์โหลดไฟล์" },
      { status: 500 }
    );
  }
}
