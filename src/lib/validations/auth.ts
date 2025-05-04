import { z } from "zod";

// เครื่องมือตรวจสอบรูปแบบเบอร์โทรศัพท์ของไทย
const phoneRegex = /^(0[689]{1}[0-9]{8})$/;

// Schema สำหรับการตรวจสอบข้อมูลการเข้าสู่ระบบ
export const loginSchema = z.object({
  userId: z.string().min(4, {
    message: "ชื่อผู้ใช้ต้องมีความยาวอย่างน้อย 4 ตัวอักษร",
  }),
  password: z.string().min(6, {
    message: "รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร",
  }),
});

// Schema สำหรับการตรวจสอบข้อมูลการสมัครสมาชิก
export const registerSchema = z.object({
  userId: z
    .string()
    .min(4, {
      message: "ชื่อผู้ใช้ต้องมีความยาวอย่างน้อย 4 ตัวอักษร",
    })
    .max(50, {
      message: "ชื่อผู้ใช้ต้องมีความยาวไม่เกิน 50 ตัวอักษร",
    }),
  password: z
    .string()
    .min(6, {
      message: "รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร",
    })
    .max(100, {
      message: "รหัสผ่านต้องมีความยาวไม่เกิน 100 ตัวอักษร",
    }),
  confirmPassword: z.string(),
  phoneNumber: z
    .string()
    .regex(phoneRegex, {
      message: "กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง (เริ่มต้นด้วย 08, 06 หรือ 09 ตามด้วยเลขอีก 8 หลัก)",
    }),
}).refine(data => data.password === data.confirmPassword, {
  message: "รหัสผ่านไม่ตรงกัน",
  path: ["confirmPassword"],
});

// Types ที่สร้างจาก schema
export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;
