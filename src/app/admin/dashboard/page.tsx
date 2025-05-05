"use client";
import { useEffect, useState } from "react";

interface SummaryData {
  userCount: number;
  totalCredits: number;
  pendingTopups: number;
  phoneExports: number;
}

export default function AdminDashboard() {
  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/summary")
      .then(res => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-12">กำลังโหลดข้อมูล...</div>;
  if (!data) return <div className="text-center py-12 text-red-500">โหลดข้อมูลไม่สำเร็จ</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">📊 Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="จำนวนผู้ใช้ทั้งหมด" value={data.userCount.toLocaleString()} />
        <Card title="เครดิตรวมทั้งหมด" value={data.totalCredits.toLocaleString()} />
        <Card title="รายการเติมเครดิต (รอตรวจสอบ)" value={data.pendingTopups.toLocaleString()} />
        <Card title="จำนวนไฟล์ที่ส่งออก" value={data.phoneExports.toLocaleString()} />
      </div>
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
