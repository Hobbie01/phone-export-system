"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import AdminSidebar from "@/components/AdminSidebar";

interface SummaryData {
  userCount: number;
  totalCredits: number;
  pendingTopups: number;
  phoneExports: number;
}

export default function AdminDashboard() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && (!user || !user.isAdmin)) {
      router.replace("/");
    }
  }, [isLoading, user, router]);

  useEffect(() => {
    if (user && user.isAdmin) {
      fetch("/api/admin/summary")
        .then((res) => res.json())
        .then(setData)
        .finally(() => setLoading(false));
    }
  }, [user]);

  if (isLoading || !user) return <div className="text-center py-12">กำลังโหลดข้อมูล...</div>;
  if (!user.isAdmin) return null;

  return (
    <div className="flex max-w-6xl mx-auto p-6 gap-8">
      <AdminSidebar />
      <section className="flex-1 w-full">
        <h1 className="text-2xl font-bold mb-6">📊 Admin Dashboard</h1>
        {loading ? (
          <div className="text-center py-12">กำลังโหลดข้อมูล...</div>
        ) : !data ? (
          <div className="text-center py-12 text-red-500">โหลดข้อมูลไม่สำเร็จ</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card title="จำนวนผู้ใช้ทั้งหมด" value={data.userCount.toLocaleString()} />
            <Card title="เครดิตรวมทั้งหมด" value={data.totalCredits.toLocaleString()} />
            <Card title="รายการเติมเครดิต (รอตรวจสอบ)" value={data.pendingTopups.toLocaleString()} />
            <Card title="จำนวนไฟล์ที่ส่งออก" value={data.phoneExports.toLocaleString()} />
          </div>
        )}
      </section>
    </div>
  );
}

function Card({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-white shadow rounded-lg p-5 border border-gray-200">
      <div className="text-gray-600 mb-1">{title}</div>
      <div className="text-3xl font-semibold">{value}</div>
    </div>
  );
}
