import { type NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      userId,
      fileName,
      format,
      splitFiles,
      splitSize,
    } = body;

    // Validate
    if (!userId || !format || !fileName) {
      return new NextResponse(JSON.stringify({ error: 'Missing required params' }), { status: 400 });
    }

    // Query all phone numbers for this user from DB
    const phones = await prisma.phoneNumber.findMany({
      where: { userId: userId },
      select: { number: true },
      orderBy: { id: 'asc' },
    });

    const phoneList = phones.map((p) => p.number);

    if (!Array.isArray(phoneList) || phoneList.length === 0) {
      return new NextResponse(JSON.stringify({ error: 'No phone numbers found in DB' }), { status: 404 });
    }

    // Create excel/csv/txt in-memory and respond as download
    let outBuffer: Buffer | null = null;
    let mimeType = 'application/octet-stream';
    let ext = format;

    if (format === 'xlsx') {
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet(phoneList.map(phone => [phone]));
      XLSX.utils.book_append_sheet(workbook, worksheet, 'PhoneNumbers');
      outBuffer = Buffer.from(XLSX.write(workbook, {type:'buffer', bookType:'xlsx'}));
      mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      ext = 'xlsx';
    } else if (format === 'csv') {
      const content = phoneList.join('\n');
      outBuffer = Buffer.from(content, 'utf8');
      mimeType = 'text/csv';
      ext = 'csv';
    } else {
      // txt
      const content = phoneList.join('\n');
      outBuffer = Buffer.from(content, 'utf8');
      mimeType = 'text/plain';
      ext = 'txt';
    }

    return new NextResponse(outBuffer, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${fileName || 'export'}.${ext}"`,
      }
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
