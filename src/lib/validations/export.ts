import { z } from "zod";

// เงื่อนไขสำหรับการส่งออกข้อมูล
export const exportSchema = z.object({
  fileName: z
    .string()
    .min(1, { message: "กรุณาระบุชื่อไฟล์" })
    .max(100, { message: "ชื่อไฟล์ต้องมีความยาวไม่เกิน 100 ตัวอักษร" }),
  format: z.enum(["xlsx", "csv", "txt"], {
    required_error: "กรุณาเลือกรูปแบบไฟล์",
    invalid_type_error: "รูปแบบไฟล์ไม่ถูกต้อง",
  }),
  splitSize: z
    .number()
    .min(1, { message: "จำนวนเบอร์ต่อไฟล์ต้องมีค่าอย่างน้อย 1" })
    .max(1000000, { message: "จำนวนเบอร์ต่อไฟล์ต้องไม่เกิน 1,000,000" })
    .optional(),
  splitFiles: z.boolean().default(false),
});

// Types ที่สร้างจาก schema
export type ExportValues = z.infer<typeof exportSchema>;
