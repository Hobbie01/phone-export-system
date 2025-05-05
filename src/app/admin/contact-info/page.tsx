"use client";
import AdminSidebar from "@/components/AdminSidebar";
import { useEffect, useState } from "react";

interface ContactInfo {
  id?: string;
  title?: string | null;
  description?: string | null;
  phone?: string | null;
  email?: string | null;
  line?: string | null;
  telegram?: string | null;
  lineQrCode?: string | null;
  telegramQrCode?: string | null;
}

export default function AdminContactInfoPage() {
  const [info, setInfo] = useState<ContactInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const res = await fetch("/api/contact");
        if (!res.ok) throw new Error("load error");
        const data = await res.json();
        setInfo(data);
      } catch {
        setInfo({
          title: "",
          description: "",
          phone: "",
          email: "",
          line: "",
          telegram: "",
          lineQrCode: "",
          telegramQrCode: "",
        });
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError("");
    try {
      const res = await fetch("/api/admin/contact-info", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(info),
      });
      if (!res.ok) throw new Error("บันทึกไม่สำเร็จ");
      setSaved(true);
    } catch (e: any) {
      setError(e.message || "เกิดข้อผิดพลาด");
    } finally {
      setSaving(false);
      setTimeout(() => setSaved(false), 1500);
    }
  }

  function handleChange(field: keyof ContactInfo, value: string) {
    setInfo((prev) => (prev ? { ...prev, [field]: value } : prev));
  }

  return (
    <div className="flex max-w-6xl mx-auto p-6 gap-8">
      {/* เพิ่ม AdminSidebar ที่นี่ */}
      <AdminSidebar />
      <div className="flex-1 w-full">
        <h1 className="text-2xl font-bold mb-4 text-blue-800">ตั้งค่าข้อมูลติดต่อ (Contact Info)</h1>
        {loading ? (
          <div className="flex items-center justify-center h-60 text-gray-600 animate-pulse">กำลังโหลดข้อมูล...</div>
        ) : (
          <form className="grid gap-4" onSubmit={handleSave}>
            <div>
              <label className="block font-semibold">หัวข้อ (title)</label>
              <input
                className="w-full border rounded px-3 py-2 mt-1"
                value={info?.title ?? ""}
                onChange={e => handleChange("title", e.target.value)} />
            </div>
            <div>
              <label className="block font-semibold">รายละเอียด (description)</label>
              <textarea
                className="w-full border rounded px-3 py-2 mt-1"
                rows={2}
                value={info?.description ?? ""}
                onChange={e => handleChange("description", e.target.value)} />
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              <div>
                <label className="block font-semibold">เบอร์โทรศัพท์ (phone)</label>
                <input className="w-full border rounded px-3 py-2 mt-1" value={info?.phone ?? ""} onChange={e => handleChange("phone", e.target.value)} />
              </div>
              <div>
                <label className="block font-semibold">Email</label>
                <input className="w-full border rounded px-3 py-2 mt-1" value={info?.email ?? ""} onChange={e => handleChange("email", e.target.value)} />
              </div>
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              <div>
                <label className="block font-semibold">LINE</label>
                <input className="w-full border rounded px-3 py-2 mt-1" value={info?.line ?? ""} onChange={e => handleChange("line", e.target.value)} />
              </div>
              <div>
                <label className="block font-semibold">Telegram</label>
                <input className="w-full border rounded px-3 py-2 mt-1" value={info?.telegram ?? ""} onChange={e => handleChange("telegram", e.target.value)} />
              </div>
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              <div>
                <label className="block font-semibold">URL LINE QR Code</label>
                <input className="w-full border rounded px-3 py-2 mt-1" value={info?.lineQrCode ?? ""} onChange={e => handleChange("lineQrCode", e.target.value)} />
              </div>
              <div>
                <label className="block font-semibold">URL Telegram QR Code</label>
                <input className="w-full border rounded px-3 py-2 mt-1" value={info?.telegramQrCode ?? ""} onChange={e => handleChange("telegramQrCode", e.target.value)} />
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-3 md:items-center mt-6">
              <button
                type="submit"
                className="bg-blue-700 text-white rounded px-7 py-2 font-semibold shadow hover:bg-blue-800 disabled:bg-gray-400"
                disabled={saving}
              >
                {saving ? "กำลังบันทึก..." : "บันทึก"}
              </button>
              {saved && <span className="text-green-600">บันทึกสำเร็จ!</span>}
              {error && <span className="text-red-600">{error}</span>}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
