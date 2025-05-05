"use client";

import { useAuth } from "@/lib/auth-context";
import router from "next/router";
import React, { useState } from "react";
import { toast } from "sonner";

export default function CreditTopupPage() {
  const [amount, setAmount] = useState(0);
  const [bankAccount, setBankAccount] = useState("");
  const [transactionTime, setTransactionTime] = useState("");
  const [slipImage, setSlipImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
    const { user } = useAuth();
  

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files ? event.target.files[0] : null;
    if (file) {
      setSlipImage(file);
      setImagePreview(URL.createObjectURL(file)); // สร้าง URL สำหรับพรีวิว
    } else {
      setSlipImage(null);
      setImagePreview(null);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
       if (!user) {
          toast.error("กรุณาเข้าสู่ระบบ");
          router.push("/login");
          return;
        }
    if (!slipImage) {
      setMessage("กรุณาอัปโหลดสลิป");
      return;
    }

    const formData = new FormData();
    formData.append("userId", user.id); // เติม userId ที่ต้องการ
    formData.append("amount", amount.toString());
    formData.append("bankAccount", bankAccount);
    formData.append("transactionTime", transactionTime);
    formData.append("slipImage", slipImage);

    setLoading(true);
    setMessage(""); // Clear message

    try {
      const res = await fetch("/api/credit", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("อัปโหลดสำเร็จ!");
      } else {
        setMessage(data.error || "เกิดข้อผิดพลาด");
      }
    } catch (error) {
      setMessage("เกิดข้อผิดพลาดในการอัปโหลด");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">เติมเครดิต</h1>

      {message && <p className="text-center text-red-500 mb-4">{message}</p>}

      <form onSubmit={handleSubmit} encType="multipart/form-data" className="space-y-4">
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
            จำนวนเครดิต
          </label>
          <input
            type="number"
            id="amount"
            name="amount"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
            required
          />
        </div>

        <div>
          <label htmlFor="bankAccount" className="block text-sm font-medium text-gray-700">
            เลขบัญชีธนาคาร
          </label>
          <input
            type="text"
            id="bankAccount"
            name="bankAccount"
            value={bankAccount}
            onChange={(e) => setBankAccount(e.target.value)}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
          />
        </div>

        <div>
          <label htmlFor="transactionTime" className="block text-sm font-medium text-gray-700">
            เวลาทำรายการ
          </label>
          <input
            type="datetime-local"
            id="transactionTime"
            name="transactionTime"
            value={transactionTime}
            onChange={(e) => setTransactionTime(e.target.value)}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
          />
        </div>

        <div>
          <label htmlFor="slipImage" className="block text-sm font-medium text-gray-700">
            อัปโหลดสลิป
          </label>
          <input
            type="file"
            id="slipImage"
            name="slipImage"
            accept="image/*"
            onChange={handleImageChange}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
            required
          />
          {imagePreview && (
            <div className="mt-4">
              <p className="text-sm text-gray-600">ตัวอย่างภาพ:</p>
              <img
                src={imagePreview}
                alt="Slip Preview"
                className="mt-2 max-w-xs mx-auto border border-gray-300 rounded-md"
              />
            </div>
          )}
        </div>

        <div className="text-center">
          <button
            type="submit"
            className={`px-4 py-2 bg-blue-600 text-white rounded-md ${loading ? "opacity-50" : ""}`}
            disabled={loading}
          >
            {loading ? "กำลังอัปโหลด..." : "ยืนยันการเติมเครดิต"}
          </button>
        </div>
      </form>
    </div>
  );
}
