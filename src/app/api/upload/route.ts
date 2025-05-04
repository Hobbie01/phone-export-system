import { type NextRequest, NextResponse } from "next/server";
import { join } from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { validatePhone } from "@/lib/utils/phone-utils";
import * as XLSX from "xlsx";
import * as csv from "csv-parser";
import { Readable } from "node:stream";

// ตำแหน่งที่เก็บไฟล์อัปโหลด
const uploadsDir = join(process.cwd(), "uploads");

// ตรวจสอบว่ามีโฟลเดอร์สำหรับเก็บไฟล์หรือไม่
async function ensureUploadsDir() {
  if (!existsSync(uploadsDir)) {
    await mkdir(uploadsDir, { recursive: true });
  }
}

// อ่านข้อมูลเบอร์โทรศัพท์จากไฟล์ TXT
async function readPhonesFromText(content: string): Promise<string[]> {
  const lines = content.split(/\r?\n/);

  const validPhones: string[] = [];

  for (const line of lines) {
    if (line.trim()) {
      const validPhone = validatePhone(line.trim());
      if (validPhone) {
        validPhones.push(validPhone);
      }
    }
  }

  return validPhones;
}

// อ่านข้อมูลเบอร์โทรศัพท์จากไฟล์ Excel
async function readPhonesFromExcel(buffer: ArrayBuffer): Promise<string[]> {
  const workbook = XLSX.read(buffer, { type: "array" });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];

  // แปลงข้อมูลเป็น array
  const data = XLSX.utils.sheet_to_json<{ [key: string]: any }>(worksheet, { header: 1 });

  // กรองเฉพาะเบอร์โทรศัพท์ที่ถูกต้อง
  const validPhones: string[] = [];

  for (const row of data) {
    if (row?.[0]) {
      // ใช้เฉพาะคอลัมน์ A
      const phone = String(row[0]);
      const validPhone = validatePhone(phone);
      if (validPhone) {
        validPhones.push(validPhone);
      }
    }
  }

  return validPhones;
}

// อ่านข้อมูลเบอร์โทรศัพท์จากไฟล์ CSV
async function readPhonesFromCSV(content: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const validPhones: string[] = [];

    const stream = Readable.from(content);
    stream
      .pipe(csv({ headers: false }))
      .on("data", (row) => {
        // ใช้ค่าแรกในแต่ละแถว
        const firstColumn = row[0] || Object.values(row)[0];
        if (firstColumn) {
          const phone = String(firstColumn);
          const validPhone = validatePhone(phone);
          if (validPhone) {
            validPhones.push(validPhone);
          }
        }
      })
      .on("end", () => {
        resolve(validPhones);
      })
      .on("error", (error) => {
        reject(error);
      });
  });
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "กรุณาอัปโหลดไฟล์" }, { status: 400 });
    }

    const fileType = file.type;
    const fileName = file.name;
    const fileSize = file.size;

    // ตรวจสอบขนาดไฟล์ (ไม่เกิน 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (fileSize > maxSize) {
      return NextResponse.json(
        { error: "ขนาดไฟล์ต้องไม่เกิน 10MB" },
        { status: 400 }
      );
    }

    // ตรวจสอบประเภทไฟล์
    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // xlsx
      "application/vnd.ms-excel", // xls
      "text/csv", // csv
      "text/plain", // txt
    ];

    if (!validTypes.includes(fileType) &&
        !fileName.endsWith('.xlsx') &&
        !fileName.endsWith('.xls') &&
        !fileName.endsWith('.csv') &&
        !fileName.endsWith('.txt')) {
      return NextResponse.json(
        { error: "รองรับเฉพาะไฟล์ Excel, CSV หรือ TXT เท่านั้น" },
        { status: 400 }
      );
    }

    // สร้างโฟลเดอร์ถ้ายังไม่มี
    await ensureUploadsDir();

    // อ่านข้อมูลไฟล์
    const buffer = await file.arrayBuffer();

    // วิเคราะห์ข้อมูลเบอร์โทรศัพท์ตามประเภทไฟล์
    let phones: string[] = [];

    if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      phones = await readPhonesFromExcel(buffer);
    } else if (fileName.endsWith('.csv') || fileType === 'text/csv') {
      const content = new TextDecoder().decode(buffer);
      phones = await readPhonesFromCSV(content);
    } else {
      const content = new TextDecoder().decode(buffer);
      phones = await readPhonesFromText(content);
    }

    // บันทึกไฟล์ไว้ในเซิร์ฟเวอร์ (สำหรับเก็บประวัติ)
    const uniqueFileName = `${Date.now()}_${fileName}`;
    const filePath = join(uploadsDir, uniqueFileName);
    await writeFile(filePath, Buffer.from(buffer));

    return NextResponse.json({
      success: true,
      totalCount: phones.length,
      phones: phones.slice(0, 10), // ส่งเฉพาะ 10 เบอร์แรกเพื่อแสดงตัวอย่าง
      filePath: uniqueFileName,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการอัปโหลดไฟล์" },
      { status: 500 }
    );
  }
}
