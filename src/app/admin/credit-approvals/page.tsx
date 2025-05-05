"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import AdminSidebar from "@/components/AdminSidebar";
import { toast } from "sonner";

interface CreditTopup {
  id: string;
  userId: string;
  amount: number;
  status: string;
  slipImageUrl: string;
  bankAccount: string | null;
  transactionTime: string | null;
  createdAt: string;
  user: string | null;
}

export default function CreditApprovals() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [topups, setTopups] = useState<CreditTopup[]>([]);
  const [selected, setSelected] = useState<CreditTopup | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!isLoading && (!user || !user.isAdmin)) {
      router.replace("/");
    }
  }, [isLoading, user, router]);

  useEffect(() => {
    if (user && user.isAdmin) {
      fetchTopups();
    }
  }, [user]);

  const fetchTopups = async () => {
    setFetching(true);
    try {
      const res = await fetch("/api/admin/pending-topups");
      const json = await res.json();
      setTopups(json);
    } catch (err) {
      toast.error("โหลดข้อมูลล้มเหลว");
    } finally {
      setFetching(false);
    }
  };

  const handleApprove = async (id: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/approve-topup`, {
        method: "POST",
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("ไม่สามารถอนุมัติได้");
      setTopups(topups.filter(t => t.id !== id));
      toast.success("✅ อนุมัติเรียบร้อย");
    } catch (err) {
      toast.error("เกิดข้อผิดพลาดในการอนุมัติ");
    } finally {
      setActionLoading(false);
      setSelected(null);
    }
  };

  const handleReject = async (id: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/reject-topup`, {
        method: "POST",
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("ไม่สามารถปฏิเสธได้");
      setTopups(topups.filter(t => t.id !== id));
      toast.success("❌ ปฏิเสธเรียบร้อย");
    } catch (err) {
      toast.error("เกิดข้อผิดพลาดในการปฏิเสธ");
    } finally {
      setActionLoading(false);
      setSelected(null);
    }
  };

  if (isLoading || !user) return <div className="text-center py-12">กำลังโหลดข้อมูล...</div>;
  if (!user.isAdmin) return null;

  return (
    <div className="flex max-w-6xl mx-auto p-6 gap-8">
      <AdminSidebar />
      <section className="flex-1 w-full">
        <h1 className="text-2xl font-bold mb-4">💳 รายการเติมเครดิตที่รออนุมัติ</h1>

        {fetching ? (
          <p className="text-gray-600">กำลังโหลดรายการ...</p>
        ) : topups.length === 0 ? (
          <p className="text-gray-600">ไม่มีรายการรออนุมัติ</p>
        ) : (
          <div className="space-y-4">
            {topups.map(topup => (
              <div
                key={topup.id}
                className="bg-white shadow p-4 rounded border flex justify-between items-center"
              >
                <div>
                  <div>ผู้ใช้: {topup.user}</div>
                  <div>จำนวนเงิน: {topup.amount} บาท</div>
                  <div>สถานะ: <span className="text-yellow-600">{topup.status}</span></div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelected(topup)}
                    className="text-blue-600 hover:underline"
                  >
                    ดูรายละเอียด
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {selected && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg">
              <h2 className="text-xl font-semibold mb-2">รายละเอียด</h2>
              <p>ผู้ใช้: {selected.user}</p>
              <p>จำนวนเงิน: {selected.amount}</p>
              <p>บัญชี: {selected.bankAccount || "-"}</p>
              <p>เวลาทำรายการ: {selected.transactionTime || "-"}</p>
              <div className="flex justify-center items-center mt-4">
                <img
                  src={selected.slipImageUrl}
                  alt="Slip"
                  className="max-h-[70vh] max-w-full object-contain border rounded"
                />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => handleReject(selected.id)}
                  disabled={actionLoading}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded disabled:opacity-50"
                >
                  ❌ ปฏิเสธ
                </button>
                <button
                  onClick={() => handleApprove(selected.id)}
                  disabled={actionLoading}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
                >
                  ✅ อนุมัติ
                </button>
                <button
                  onClick={() => setSelected(null)}
                  disabled={actionLoading}
                  className="ml-auto text-gray-500 hover:underline"
                >
                  ปิด
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
