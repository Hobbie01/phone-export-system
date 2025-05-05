"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const adminPages = [
  { name: "แดชบอร์ด", href: "/admin/dashboard", icon: "📊" },
  { name: "อนุมัติเครดิต", href: "/admin/credit-approvals", icon: "💳" },
  { name: "ติดต่อ", href: "/admin/contact-info", icon: "📞" },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-full max-w-xs bg-white dark:bg-gray-900 rounded-lg shadow border border-gray-100 dark:border-gray-900 py-6 px-4 mr-8 h-fit">
      <nav className="flex flex-col space-y-2">
        {adminPages.map((page) => (
          <Link
            href={page.href}
            key={page.href}
            className={
              "flex items-center px-4 py-2 rounded transition-colors " +
              (pathname === page.href
                ? "bg-primary text-primary-foreground font-semibold"
                :
                  "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800")
            }
          >
            <span className="mr-2 text-lg">{page.icon}</span>
            {page.name}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
