// scripts/restore-db.js
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

// รับชื่อไฟล์จากอาร์กิวเมนต์ของคำสั่ง
const backupFileName = process.argv[2];
if (!backupFileName) {
  console.error('กรุณาระบุชื่อไฟล์สำรองข้อมูล เช่น: node scripts/restore-db.js backup-2025-05-04.json');
  process.exit(1);
}

const backupDir = path.join(__dirname, '../backups');
const backupFilePath = path.join(backupDir, backupFileName);

// ตรวจสอบว่าไฟล์มีอยู่หรือไม่
if (!fs.existsSync(backupFilePath)) {
  console.error(`ไม่พบไฟล์สำรองข้อมูล: ${backupFilePath}`);
  process.exit(1);
}

async function restore() {
  const prisma = new PrismaClient();

  try {
    console.log('เริ่มต้นกู้คืนข้อมูล...');

    // อ่านข้อมูลจากไฟล์ JSON
    const backupData = JSON.parse(fs.readFileSync(backupFilePath, 'utf8'));

    // ล้างข้อมูลทั้งหมดก่อนกู้คืน (ตามลำดับความสัมพันธ์)
    console.log('ล้างข้อมูลเดิมทั้งหมด...');
    await prisma.phoneNumber.deleteMany({});
    await prisma.creditTopup.deleteMany({});
    await prisma.phoneExport.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.contactInfo.deleteMany({});
    await prisma.bankAccount.deleteMany({});

    // กู้คืนข้อมูลแต่ละตาราง (ตามลำดับความสัมพันธ์)

    // กู้คืนข้อมูลผู้ใช้งาน
    console.log('กู้คืนข้อมูลผู้ใช้งาน...');
    for (const user of backupData.users) {
      await prisma.user.create({
        data: {
          id: user.id,
          userId: user.userId,
          password: user.password,
          phoneNumber: user.phoneNumber,
          credits: user.credits,
          expiryDate: user.expiryDate,
          isAdmin: user.isAdmin,
          createdAt: new Date(user.createdAt),
          updatedAt: new Date(user.updatedAt)
        }
      });
    }

    // กู้คืนข้อมูลการส่งออก
    console.log('กู้คืนข้อมูลการส่งออก...');
    for (const export_ of backupData.phoneExports) {
      await prisma.phoneExport.create({
        data: {
          id: export_.id,
          userId: export_.userId,
          fileName: export_.fileName,
          count: export_.count,
          format: export_.format,
          createdAt: new Date(export_.createdAt)
        }
      });
    }

    // กู้คืนข้อมูลการเติมเครดิต
    console.log('กู้คืนข้อมูลการเติมเครดิต...');
    for (const topup of backupData.creditTopups) {
      await prisma.creditTopup.create({
        data: {
          id: topup.id,
          userId: topup.userId,
          amount: topup.amount,
          slipImageUrl: topup.slipImageUrl,
          status: topup.status,
          bankAccount: topup.bankAccount,
          transactionTime: topup.transactionTime ? new Date(topup.transactionTime) : null,
          ocrData: topup.ocrData,
          adminNote: topup.adminNote,
          createdAt: new Date(topup.createdAt),
          updatedAt: new Date(topup.updatedAt)
        }
      });
    }

    // กู้คืนข้อมูลการติดต่อ
    console.log('กู้คืนข้อมูลการติดต่อ...');
    for (const contact of backupData.contactInfo) {
      await prisma.contactInfo.create({
        data: {
          id: contact.id,
          title: contact.title,
          description: contact.description,
          phone: contact.phone,
          email: contact.email,
          line: contact.line,
          telegram: contact.telegram,
          lineQrCode: contact.lineQrCode,
          telegramQrCode: contact.telegramQrCode,
          createdAt: new Date(contact.createdAt),
          updatedAt: new Date(contact.updatedAt)
        }
      });
    }

    // กู้คืนข้อมูลบัญชีธนาคาร
    console.log('กู้คืนข้อมูลบัญชีธนาคาร...');
    for (const bank of backupData.bankAccounts) {
      await prisma.bankAccount.create({
        data: {
          id: bank.id,
          bankName: bank.bankName,
          accountName: bank.accountName,
          accountNumber: bank.accountNumber,
          qrCodeUrl: bank.qrCodeUrl,
          isActive: bank.isActive,
          createdAt: new Date(bank.createdAt),
          updatedAt: new Date(bank.updatedAt)
        }
      });
    }

    console.log('กู้คืนข้อมูลเสร็จสมบูรณ์!');
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการกู้คืนข้อมูล:', error);
  } finally {
    await prisma.$disconnect();
  }
}

restore();
