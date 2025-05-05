import Link from "next/link";

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-12 text-center">
        <h1 className="text-4xl font-bold mb-4">ระบบอัปโหลดและส่งออกข้อมูลลูกค้า</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          ระบบสำหรับการจัดการข้อมูลเบอร์โทรศัพท์ลูกค้า
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto h-full">
        <MenuCard
          title="เติมเครดิตใช้งาน"
          description="เติมเครดิตเพื่อใช้งานระบบอัปโหลดและส่งออกข้อมูล"
          href="/credit"
          icon="💰"
        />
        <MenuCard
          title="สร้างไฟล์เบอร์โทร"
          description="อัปโหลดและสร้างไฟล์เบอร์โทรศัพท์"
          href="/export"
          icon="📤"
        />
        <MenuCard
          title="ติดต่อ"
          description="ข้อมูลติดต่อและช่องทางการสื่อสาร"
          href="/contact"
          icon="📞"
        />
      </div>
    </div>
  );
}

function MenuCard({ title, description, href, icon }: { title: string; description: string; href: string; icon: string }) {
  return (
    <Link href={href} className="h-full">
      <div className="flex flex-col h-full border border-gray-200 dark:border-gray-800 rounded-lg p-6 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors group cursor-pointer">
        <div className="text-4xl mb-4 text-center">{icon}</div>
        <h2 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors text-center">{title}</h2>
        <p className="text-gray-600 dark:text-gray-400 text-center">{description}</p>
      </div>
    </Link>
  );
}
