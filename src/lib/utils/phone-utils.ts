import * as XLSX from 'xlsx';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as csv from 'csv-parser';
import { Readable } from 'node:stream';

/**
 * กรองเบอร์โทรศัพท์ให้เป็นเบอร์ 10 หลักที่ถูกต้อง
 * @param phone เบอร์โทรศัพท์ที่ต้องการกรอง
 * @returns เบอร์โทรศัพท์ที่ถูกต้อง หรือ null ถ้าไม่ใช่เบอร์ที่ถูกต้อง
 */
export function validatePhone(phone: string): string | null {
  // ลบอักขระพิเศษทั้งหมด
  const normalizedPhone = phone.replace(/[^0-9]/g, '');

  // ตรวจสอบว่าเป็นเบอร์ที่ขึ้นต้นด้วย 0 แล้วตามด้วยตัวเลข 9 ตัว
  // หรือเป็นเบอร์ที่ไม่มี 0 นำหน้า แต่มีตัวเลข 9 ตัว (จะเติม 0 ให้อัตโนมัติ)
  if (/^0\d{9}$/.test(normalizedPhone)) {
    return normalizedPhone;
  } else if (/^\d{9}$/.test(normalizedPhone)) {
    return `0${normalizedPhone}`;
  }

  return null;
}

/**
 * อ่านข้อมูลเบอร์โทรศัพท์จากไฟล์ Excel
 * @param filePath พาธของไฟล์ Excel
 * @returns Promise ที่ return array ของเบอร์โทรศัพท์ที่ถูกต้อง
 */
export async function readPhonesFromExcel(filePath: string): Promise<string[]> {
  const workbook = XLSX.readFile(filePath);
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];

  // แปลงข้อมูลเป็น array
  const data: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  // กรองเฉพาะเบอร์โทรศัพท์ที่ถูกต้อง
  const validPhones: string[] = [];

  for (const row of data) {
    if (row && row[0]) {
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

/**
 * อ่านข้อมูลเบอร์โทรศัพท์จากไฟล์ CSV
 * @param filePath พาธของไฟล์ CSV
 * @returns Promise ที่ return array ของเบอร์โทรศัพท์ที่ถูกต้อง
 */
export function readPhonesFromCSV(filePath: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const validPhones: string[] = [];

    fs.createReadStream(filePath)
      .pipe(csv({ headers: false }))
      .on('data', (row) => {
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
      .on('end', () => {
        resolve(validPhones);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

/**
 * อ่านข้อมูลเบอร์โทรศัพท์จากไฟล์ TXT
 * @param filePath พาธของไฟล์ TXT
 * @returns Promise ที่ return array ของเบอร์โทรศัพท์ที่ถูกต้อง
 */
export async function readPhonesFromTXT(filePath: string): Promise<string[]> {
  const content = await fs.promises.readFile(filePath, 'utf8');
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

/**
 * อ่านข้อมูลเบอร์โทรศัพท์จากไฟล์
 * @param filePath พาธของไฟล์
 * @returns Promise ที่ return array ของเบอร์โทรศัพท์ที่ถูกต้อง
 */
export async function readPhonesFromFile(filePath: string): Promise<string[]> {
  const extension = path.extname(filePath).toLowerCase();

  switch (extension) {
    case '.xlsx':
    case '.xls':
      return readPhonesFromExcel(filePath);
    case '.csv':
      return readPhonesFromCSV(filePath);
    case '.txt':
      return readPhonesFromTXT(filePath);
    default:
      throw new Error(`ไม่รองรับไฟล์นามสกุล ${extension}`);
  }
}

/**
 * สร้างไฟล์ Excel จากข้อมูลเบอร์โทรศัพท์
 * @param phones array ของเบอร์โทรศัพท์
 * @param outputPath พาธที่ต้องการบันทึกไฟล์
 */
export function exportToExcel(phones: string[], outputPath: string): void {
  const workbook = XLSX.utils.book_new();

  // ตั้งค่า format เป็น string เพื่อรักษาเลข 0 นำหน้า
  const worksheet = XLSX.utils.aoa_to_sheet(phones.map(phone => [{ v: phone, t: 's' }]));

  XLSX.utils.book_append_sheet(workbook, worksheet, 'PhoneNumbers');
  XLSX.writeFile(workbook, outputPath);
}

/**
 * สร้างไฟล์ CSV จากข้อมูลเบอร์โทรศัพท์
 * @param phones array ของเบอร์โทรศัพท์
 * @param outputPath พาธที่ต้องการบันทึกไฟล์
 */
export async function exportToCSV(phones: string[], outputPath: string): Promise<void> {
  const content = phones.join('\n');
  await fs.promises.writeFile(outputPath, content, 'utf8');
}

/**
 * สร้างไฟล์ TXT จากข้อมูลเบอร์โทรศัพท์
 * @param phones array ของเบอร์โทรศัพท์
 * @param outputPath พาธที่ต้องการบันทึกไฟล์
 */
export async function exportToTXT(phones: string[], outputPath: string): Promise<void> {
  const content = phones.join('\n');
  await fs.promises.writeFile(outputPath, content, 'utf8');
}

/**
 * ส่งออกข้อมูลเบอร์โทรศัพท์ไปยังไฟล์ตามรูปแบบที่กำหนด
 * @param phones array ของเบอร์โทรศัพท์
 * @param outputPath พาธที่ต้องการบันทึกไฟล์
 * @param format รูปแบบไฟล์ ('xlsx', 'csv', 'txt')
 */
export async function exportPhones(
  phones: string[],
  outputPath: string,
  format: 'xlsx' | 'csv' | 'txt'
): Promise<void> {
  switch (format) {
    case 'xlsx':
      exportToExcel(phones, outputPath);
      break;
    case 'csv':
      await exportToCSV(phones, outputPath);
      break;
    case 'txt':
      await exportToTXT(phones, outputPath);
      break;
    default:
      throw new Error(`ไม่รองรับรูปแบบไฟล์ ${format}`);
  }
}

/**
 * แบ่งข้อมูลเบอร์โทรศัพท์เป็นหลายส่วนตามจำนวนที่กำหนด
 * @param phones array ของเบอร์โทรศัพท์
 * @param size จำนวนเบอร์ต่อส่วน
 * @returns array ของ array เบอร์โทรศัพท์ที่แบ่งแล้ว
 */
export function splitPhones(phones: string[], size: number): string[][] {
  const chunks: string[][] = [];

  for (let i = 0; i < phones.length; i += size) {
    chunks.push(phones.slice(i, i + size));
  }

  return chunks;
}
