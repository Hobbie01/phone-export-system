"use client";
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

export default function ContactPage() {
  const [info, setInfo] = useState<ContactInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const res = await fetch("/api/contact");
      if (!res.ok) return setLoading(false);
      const data = await res.json();
      setInfo(data);
      setLoading(false);
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-60 text-gray-600 animate-pulse">
        กำลังโหลดข้อมูล...
      </div>
    );
  }

  if (!info) {
    return (
      <div className="text-center text-gray-700 mt-10">
        ไม่พบข้อมูลติดต่อ
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10 bg-white shadow-xl rounded-xl mt-10 border">
      <h1 className="text-3xl font-extrabold text-blue-700 mb-3">
        {info.title ?? "ติดต่อเรา"}
      </h1>
      {info.description && (
        <p className="text-gray-600 mb-6 leading-relaxed">
          {info.description}
        </p>
      )}

      <div className="space-y-4 text-gray-800 text-sm sm:text-base">
        {info.phone && (
          <div className="flex items-center gap-2">
            <span className="font-semibold w-24">📱 โทร:</span>
            <a
              href={`tel:${info.phone}`}
              className="text-blue-700 hover:underline"
            >
              {info.phone}
            </a>
          </div>
        )}
        {info.email && (
          <div className="flex items-center gap-2">
            <span className="font-semibold w-24">📧 อีเมล:</span>
            <a
              href={`mailto:${info.email}`}
              className="text-blue-700 hover:underline"
            >
              {info.email}
            </a>
          </div>
        )}
        {info.line && (
          <div className="flex items-center gap-2">
            <span className="font-semibold w-24">💬 LINE:</span>
            <span>{info.line}</span>
          </div>
        )}
        {info.telegram && (
          <div className="flex items-center gap-2">
            <span className="font-semibold w-24">📨 Telegram:</span>
            <span>{info.telegram}</span>
          </div>
        )}
      </div>

      {(info.lineQrCode || info.telegramQrCode) && (
        <div className="mt-8">
          <h2 className="font-semibold text-gray-700 mb-3">QR Code ช่องทางแชท</h2>
          <div className="flex gap-5">
            {info.lineQrCode && (
              <div className="flex flex-col items-center">
                <img
                  src={info.lineQrCode}
                  alt="LINE QR Code"
                  className="w-28 h-28 border rounded"
                />
                <span className="text-xs mt-1 text-gray-500">LINE OA</span>
              </div>
            )}
            {info.telegramQrCode && (
              <div className="flex flex-col items-center">
                <img
                  src={info.telegramQrCode}
                  alt="Telegram QR Code"
                  className="w-28 h-28 border rounded"
                />
                <span className="text-xs mt-1 text-gray-500">Telegram</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
