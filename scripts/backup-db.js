// scripts/backup-db.js
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

// สร้างโฟลเดอร์สำหรับเก็บไฟล์สำรองข้อมูล
const backupDir = path.join(__dirname, '../backups');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

// ชื่อไฟล์สำรองข้อมูลจะมีรูปแบบเป็น backup-YYYY-MM-DD.json
const date = new Date();
const dateStr = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
const backupFileName = `backup-${dateStr}.json`;
const backupFilePath = path.join(backupDir, backupFileName);

async function backup() {
  const prisma = new PrismaClient();

  try {
    console.log('เริ่มต้นสำรองข้อมูล...');

    // ดึงข้อมูลจากทุกตาราง
    const users = await prisma.user.findMany();
    const phoneExports = await prisma.phoneExport.findMany();
    const creditTopups = await prisma.creditTopup.findMany();
    const contactInfo = await prisma.contactInfo.findMany();
    const bankAccounts = await prisma.bankAccount.findMany();

    // ไม่รวมข้อมูลเบอร์โทรศัพท์เนื่องจากเป็นข้อมูลชั่วคราว

    // สร้าง Object สำหรับเก็บข้อมูลทั้งหมด
    const backupData = {
      users,
      phoneExports,
      creditTopups,
      contactInfo,
      bankAccounts,
      backupDate: new Date().toISOString(),
    };

    // บันทึกข้อมูลลงในไฟล์ JSON
    fs.writeFileSync(backupFilePath, JSON.stringify(backupData, null, 2));

    console.log(`สำรองข้อมูลเสร็จสมบูรณ์ ไฟล์ถูกบันทึกที่: ${backupFilePath}`);
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการสำรองข้อมูล:', error);
  } finally {
    await prisma.$disconnect();
  }
}

backup();
