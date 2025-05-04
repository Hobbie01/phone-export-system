// ... existing code ...
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url!);
  const userIdRaw = searchParams.get('userId');
  if (!userIdRaw) return Response.json({ error: 'Missing userId' }, { status: 400 });
  const userId = userIdRaw;

  try {
    const count = await prisma.phoneNumber.count({
      where: { userId: userId },
    });
    return Response.json({ count });
  } catch (e) {
    return Response.json({ error: 'DB error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
// ... existing code ...
