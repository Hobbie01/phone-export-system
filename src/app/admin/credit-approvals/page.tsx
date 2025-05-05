"use client";
import { useEffect, useState } from "react";

interface CreditTopup {
  id: string;
  userId: string;
  amount: number;
  status: string;
  slipImageUrl: string;
  bankAccount: string | null;
  transactionTime: string | null;
  createdAt: string;
}

export default function CreditApprovals() {
  const [topups, setTopups] = useState<CreditTopup[]>([]);
  const [selected, setSelected] = useState<CreditTopup | null>(null);

  useEffect(() => {
    fetch("/api/admin/pending-topups")
      .then(res => res.json())
      .then(setTopups);
  }, []);

  const handleApprove = async (id: string) => {
    await fetch(`/api/admin/approve-topup`, {
      method: "POST",
      body: JSON.stringify({ id }),
    });
    setTopups(topups.filter(t => t.id !== id));
    setSelected(null);
  };

  const handleReject = async (id: string) => {
    await fetch(`/api/admin/reject-topup`, {
      method: "POST",
      body: JSON.stringify({ id }),
    });
    setTopups(topups.filter(t => t.id !== id));
    setSelected(null);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">💰 รายการเติมเครดิตที่รออนุมัติ</h1>

      {topups.length === 0 ? (
        <p className="text-gray-600">ไม่มีรายการรออนุมัติ</p>
      ) : (
        <div className="space-y-4">
          {topups.map(topup => (
            <div
              key={topup.id}
              className="bg-white shadow p-4 rounded border flex justify-between items-center"
            >
              <div>
                <div>ผู้ใช้: {topup.userId}</div>
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
            <p>ผู้ใช้: {selected.userId}</p>
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
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
              >
                ❌ ปฏิเสธ
              </button>
              <button
                onClick={() => handleApprove(selected.id)}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
              >
                ✅ อนุมัติ
              </button>
              <button
                onClick={() => setSelected(null)}
                className="ml-auto text-gray-500 hover:underline"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
