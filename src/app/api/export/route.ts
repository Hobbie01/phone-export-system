import { type NextRequest, NextResponse } from "next/server";
import { join } from "node:path";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import * as XLSX from "xlsx";
import { PrismaClient } from "@prisma/client";
import { splitPhones } from "@/lib/utils/phone-utils";

const prisma = new PrismaClient();

// ตำแหน่งที่เก็บไฟล์ส่งออก
const exportsDir = join(process.cwd(), "exports");

// ตรวจสอบว่ามีโฟลเดอร์สำหรับเก็บไฟล์หรือไม่
async function ensureExportsDir() {
  if (!existsSync(exportsDir)) {
    await mkdir(exportsDir, { recursive: true });
  }
}

// สร้างไฟล์ Excel จากข้อมูลเบอร์โทรศัพท์
function exportToExcel(phones: string[], outputPath: string): void {
  const workbook = XLSX.utils.book_new();

  // ตั้งค่า format เป็น string เพื่อรักษาเลข 0 นำหน้า
  const worksheet = XLSX.utils.aoa_to_sheet(
    phones.map((phone) => [{ v: phone, t: "s" }])
  );

  XLSX.utils.book_append_sheet(workbook, worksheet, "PhoneNumbers");
  XLSX.writeFile(workbook, outputPath);
}

// สร้างไฟล์ CSV จากข้อมูลเบอร์โทรศัพท์
async function exportToCSV(
  phones: string[],
  outputPath: string
): Promise<void> {
  const content = phones.join("\n");
  await writeFile(outputPath, content, "utf8");
}

// สร้างไฟล์ TXT จากข้อมูลเบอร์โทรศัพท์
async function exportToTXT(
  phones: string[],
  outputPath: string
): Promise<void> {
  const content = phones.join("\n");
  await writeFile(outputPath, content, "utf8");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      userId,
      uploadedFilePath,
      fileName,
      format,
      splitFiles,
      splitSize,
      phones,
    } = body;

    // ตรวจสอบข้อมูลที่ส่งมา
    if (!userId || !uploadedFilePath || !fileName || !format || !phones) {
      return NextResponse.json({ error: "ข้อมูลไม่ครบถ้วน" }, { status: 400 });
    }

    // ตรวจสอบว่า phones เป็น array หรือไม่
    if (!Array.isArray(phones) || phones.length === 0) {
      return NextResponse.json(
        { error: "ไม่พบข้อมูลเบอร์โทรศัพท์" },
        { status: 400 }
      );
    }

    // ตรวจสอบรูปแบบไฟล์
    if (!["xlsx", "csv", "txt"].includes(format)) {
      return NextResponse.json(
        { error: "รูปแบบไฟล์ไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    // สร้างโฟลเดอร์ถ้ายังไม่มี
    await ensureExportsDir();

    // ค้นหาข้อมูลผู้ใช้
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "ไม่พบข้อมูลผู้ใช้" }, { status: 404 });
    }

    // ตรวจสอบเครดิต (ในอนาคตควรมีการตรวจสอบเครดิตก่อนการส่งออก)

    // กำหนดชื่อไฟล์ส่งออก
    const timestamp = Date.now();
    const exportFileNameBase = `${fileName}_${timestamp}`;

    // แบ่งไฟล์ถ้าเลือกตัวเลือกนี้
    const exportedFilePaths: string[] = [];

    if (splitFiles && splitSize && splitSize > 0) {
      const chunks = splitPhones(phones, splitSize);

      for (let i = 0; i < chunks.length; i++) {
        const chunkFileName = `${exportFileNameBase}_part${i + 1}.${format}`;
        const outputPath = join(exportsDir, chunkFileName);

        // ส่งออกตามรูปแบบที่เลือก
        if (format === "xlsx") {
          exportToExcel(chunks[i], outputPath);
        } else if (format === "csv") {
          await exportToCSV(chunks[i], outputPath);
        } else {
          await exportToTXT(chunks[i], outputPath);
        }

        exportedFilePaths.push(chunkFileName);
      }
    } else {
      const exportFileName = `${exportFileNameBase}.${format}`;
      const outputPath = join(exportsDir, exportFileName);

      // ส่งออกตามรูปแบบที่เลือก
      if (format === "xlsx") {
        exportToExcel(phones, outputPath);
      } else if (format === "csv") {
        await exportToCSV(phones, outputPath);
      } else {
        await exportToTXT(phones, outputPath);
      }

      exportedFilePaths.push(exportFileName);
    }

    // บันทึกประวัติการส่งออก
    const exportRecord = await prisma.phoneExport.create({
      data: {
        userId: user.id,
        fileName: fileName,
        count: phones.length,
        format: format,
      },
    });

    // บันทึกข้อมูลเบอร์โทรศัพท์ลงฐานข้อมูล (บันทึกเฉพาะเวลาต้องการ)
    // ไม่บันทึกเนื่องจากระบุว่าไม่เก็บข้อมูลหลัง export

    return NextResponse.json({
      success: true,
      exportId: exportRecord.id,
      totalCount: phones.length,
      fileCount: exportedFilePaths.length,
      files: exportedFilePaths.map((path) => `/api/download?file=${path}`),
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการส่งออกข้อมูล" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
