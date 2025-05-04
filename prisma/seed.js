// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

// Simple password hashing function (in production use bcrypt)
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function main() {
  // Create admin user
  const admin = await prisma.user.upsert({
    where: { userId: 'admin' },
    update: {},
    create: {
      userId: 'admin',
      password: hashPassword('admin1234'),
      phoneNumber: '0800000000',
      isAdmin: true,
    },
  });

  console.log('Admin user created:', admin);

  // Create default contact information
  const contactInfo = await prisma.contactInfo.upsert({
    where: { id: '00000000-0000-0000-0000-000000000000' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000000',
      title: 'ติดต่อเรา',
      description: 'หากมีคำถามหรือต้องการความช่วยเหลือ กรุณาติดต่อเราผ่านช่องทางด้านล่าง',
      phone: '0800000000',
      email: 'contact@example.com',
      line: '@lineexample',
    },
  });

  console.log('Contact info created:', contactInfo);

  // Create bank account for payments
  const bankAccount = await prisma.bankAccount.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      bankName: 'ธนาคารกสิกรไทย',
      accountName: 'บริษัท ตัวอย่าง จำกัด',
      accountNumber: '1234567890',
      isActive: true,
    },
  });

  console.log('Bank account created:', bankAccount);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
