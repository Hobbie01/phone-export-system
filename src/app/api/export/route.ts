import { type NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { PrismaClient } from "@prisma/client";
import JSZip from "jszip";

const prisma = new PrismaClient();

// Utility สำหรับแบ่ง array ออกเป็น chunk
function chunkArray<T>(arr: T[], chunkSize: number) {
  const res: T[][] = [];
  for (let i = 0; i < arr.length; i += chunkSize) {
    res.push(arr.slice(i, i + chunkSize));
  }
  return res;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, fileName, format, splitFiles, splitSize } = body;

    // Validate
    if (!userId || !format || !fileName) {
      return new NextResponse(
        JSON.stringify({ error: "Missing required params" }),
        { status: 400 }
      );
    }

    // Query all phone numbers for this user from DB
    const phones = await prisma.phoneNumber.findMany({
      where: { userId: userId },
      select: { number: true },
      orderBy: { id: "asc" },
    });

    const phoneList = phones.map((p) => p.number);

    if (!Array.isArray(phoneList) || phoneList.length === 0) {
      return new NextResponse(
        JSON.stringify({ error: "No phone numbers found in DB" }),
        { status: 404 }
      );
    }

    // ไม่ divide: export เดิม
    if (!splitFiles || !splitSize || phoneList.length <= splitSize) {
      // สร้างไฟล์เดี่ยว
      let outBuffer: Buffer | null = null;
      let mimeType = "application/octet-stream";
      let ext = format;

      if (format === "xlsx") {
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.aoa_to_sheet(
          phoneList.map((phone) => [phone])
        );
        XLSX.utils.book_append_sheet(workbook, worksheet, "PhoneNumbers");
        outBuffer = Buffer.from(
          XLSX.write(workbook, { type: "buffer", bookType: "xlsx" })
        );
        mimeType =
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        ext = "xlsx";
      } else if (format === "csv") {
        const content = phoneList.join("\n");
        outBuffer = Buffer.from(content, "utf8");
        mimeType = "text/csv";
        ext = "csv";
      } else {
        // txt
        const content = phoneList.join("\n");
        outBuffer = Buffer.from(content, "utf8");
        mimeType = "text/plain";
        ext = "txt";
      }

      return new NextResponse(outBuffer, {
        status: 200,
        headers: {
          "Content-Type": mimeType,
          "Content-Disposition": `attachment; filename=\"${
            fileName || "export"
          }.${ext}\"`,
        },
      });
    }

    // ***** แบ่งไฟล์: splitFiles == true *****
    // chunk phoneList -- ได้เป็น array ของ array
    const chunked = chunkArray(phoneList, splitSize);
    const zip = new JSZip();
    let ext = format;
    let mimeType = "application/octet-stream";
    if (format === "xlsx") {
      mimeType =
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      ext = "xlsx";
    } else if (format === "csv") {
      mimeType = "text/csv";
      ext = "csv";
    } else {
      mimeType = "text/plain";
      ext = "txt";
    }

    // สร้างไฟล์แต่ละ chunk
    await Promise.all(
      chunked.map(async (chunk, i) => {
        let buf: Buffer;
        if (format === "xlsx") {
          const workbook = XLSX.utils.book_new();
          const worksheet = XLSX.utils.aoa_to_sheet(
            chunk.map((phone) => [phone])
          );
          XLSX.utils.book_append_sheet(workbook, worksheet, "PhoneNumbers");
          buf = Buffer.from(
            XLSX.write(workbook, { type: "buffer", bookType: "xlsx" })
          );
        } else {
          const content = chunk.join("\n");
          buf = Buffer.from(content, "utf8");
        }
        // ใส่ใน zip
        zip.file(`${fileName}_${i + 1}.${ext}`, buf);
      })
    );

    // ถ้ามีแค่ 1 chunk (เช่นจำนวนเบอร์ < splitSize) ส่งออกเป็นไฟล์เดี่ยว ไม่ zip
    if (chunked.length === 1) {
      // สร้างไฟล์เดี่ยว (reuse ด้านบน)
      let outBuffer: Buffer;
      if (format === "xlsx") {
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.aoa_to_sheet(
          chunked[0].map((phone) => [phone])
        );
        XLSX.utils.book_append_sheet(workbook, worksheet, "PhoneNumbers");
        outBuffer = Buffer.from(
          XLSX.write(workbook, { type: "buffer", bookType: "xlsx" })
        );
      } else {
        // csv หรือ txt
        const content = chunked[0].join("\n");
        outBuffer = Buffer.from(content, "utf8");
      }
      return new NextResponse(outBuffer, {
        status: 200,
        headers: {
          "Content-Type": mimeType,
          "Content-Disposition": `attachment; filename=\"${
            fileName || "export"
          }.${ext}\"`,
        },
      });
    }

    // zip หลายไฟล์
    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });
    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename=\"${
          fileName || "export"
        }.zip\"`,
      },
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
