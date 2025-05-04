"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { useAuth } from "@/lib/auth-context";
import { exportSchema, type ExportValues } from "@/lib/validations/export";
import { Button } from "@/components/ui/button";
import { FileInput } from "@/components/ui/file-input";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, FileWarning, PhoneForwarded, Upload, Database, Save } from "lucide-react";

export default function ExportPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    totalCount: number;
    phones: string[];
    allPhones: string[];
  } | null>(null);
  const [exportResult, setExportResult] = useState<{
    success: boolean;
    fileCount: number;
    files: string[];
  } | null>(null);
  const [savedToDb, setSavedToDb] = useState(false);

  // State สำหรับข้อมูลใน DB
  const [dbCount, setDbCount] = useState<number>(0);

  // useEffect สำหรับเช็ก count ข้อมูลใน DB
  useEffect(() => {
    async function fetchDbCount() {
      if (!user) return;
      try {
        const res = await fetch('/api/phones?userId=' + user.id);
        const data = await res.json();
        setDbCount(data.count || 0);
      } catch {}
    }
    fetchDbCount();
  }, [user, savedToDb]);

  // เปลี่ยนตัวแปรไว้ใช้ในการ enable ปุ่ม export
  const canExport = dbCount > 0;

  // สร้าง form ด้วย react-hook-form และ zod validation
  const form = useForm<ExportValues>({
    resolver: zodResolver(exportSchema),
    defaultValues: {
      fileName: "",
      format: "xlsx",
      splitFiles: false,
      splitSize: 100000,
    },
  });

  // แสดงส่วนแบ่งไฟล์เมื่อเลือก "แบ่งไฟล์"
  const showSplitSize = form.watch("splitFiles");

  // ฟังก์ชันอัปโหลดไฟล์
  const handleFileUpload = async (files: File[]) => {
    if (!user) {
      toast.error("กรุณาเข้าสู่ระบบ");
      router.push("/login");
      return;
    }

    if (files.length === 0) {
      toast.error("กรุณาเลือกไฟล์");
      return;
    }

    const file = files[0];
    setUploadedFile(file);
    setIsUploading(true);
    setUploadProgress(0);
    setSavedToDb(false);

    try {
      // จำลองการอัปโหลดแบบมี progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          const newProgress = prev + 5;
          return newProgress > 90 ? 90 : newProgress;
        });
      }, 100);

      // สร้าง FormData สำหรับส่งไฟล์
      const formData = new FormData();
      formData.append("file", file);

      // ส่งไฟล์ไปยัง API
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const data = await response.json();

      if (response.ok) {
        // ใช้งาน allPhones (phones ทั้งหมด)
        setUploadResult({
          ...data,
          allPhones: data.phones,
        });
        toast.success(`อัปโหลดสำเร็จ พบเบอร์โทรศัพท์ ${data.totalCount} เบอร์`);

        // ตั้งค่าชื่อไฟล์เริ่มต้นเป็นชื่อไฟล์ที่อัปโหลด (ไม่รวมนามสกุล)
        const fileName = file.name.split(".")[0];
        form.setValue("fileName", fileName);
      } else {
        toast.error(data.error || "อัปโหลดไม่สำเร็จ");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("เกิดข้อผิดพลาดในการอัปโหลดไฟล์");
    } finally {
      setIsUploading(false);
    }
  };

  // ฟังก์ชันบันทึกข้อมูลลงฐานข้อมูล
  const handleSaveToDatabase = async () => {
    if (!user) {
      toast.error("กรุณาเข้าสู่ระบบ");
      router.push("/login");
      return;
    }

    if (!uploadResult) {
      toast.error("กรุณาอัปโหลดไฟล์ก่อน");
      return;
    }

    setIsSaving(true);

    try {
      // ส่งข้อมูลไปยัง API เพื่อบันทึกลงฐานข้อมูล
      const response = await fetch("/api/phones/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          phones: uploadResult?.allPhones || [],
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSavedToDb(true);
        toast.success(`บันทึกข้อมูลสำเร็จ ${uploadResult.totalCount} เบอร์`);
      } else {
        toast.error(data.error || "บันทึกข้อมูลไม่สำเร็จ");
      }
    } catch (error) {
      console.error("Save error:", error);
      toast.error("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setIsSaving(false);
    }
  };

  // ฟังก์ชันส่งออกข้อมูล (ดึงข้อมูลจาก DB โดยตรง)
  const handleExport = async (values: ExportValues) => {
    if (!user) {
      toast.error("คุณเข้าสู่ระบบก่อนใช้งาน");
      router.push("/login");
      return;
    }
    setIsExporting(true);
    try {
      // ไม่ใช้ allPhones จาก state แต่ให้ POST userId ไป แล้ว backend จะไปดึง phones เอง
      const response = await fetch("/api/export", {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          fileName: values.fileName,
          format: values.format,
          splitFiles: values.splitFiles,
          splitSize: values.splitFiles ? values.splitSize : undefined
        }),
      });
      if (response.ok) {
        // ดาวน์โหลดไฟล์โดยตรง (blob)
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${values.fileName || 'export'}.${values.format}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        toast.success('ดาวน์โหลดไฟล์เรียบร้อยแล้ว');
      } else {
        const data = await response.json();
        toast.error(data?.error || 'เกิดข้อผิดพลาดในการ export');
      }
    } catch(err) {
      toast.error('เกิดข้อผิดพลาดในการ export');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="container py-10">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">
              อัปโหลดและส่งออกข้อมูลเบอร์โทรศัพท์
            </CardTitle>
            <CardDescription>
              อัปโหลดไฟล์ข้อมูลเบอร์โทรศัพท์และส่งออกเป็นไฟล์ตามรูปแบบที่ต้องการ
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="upload" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="upload">1. อัปโหลดข้อมูล</TabsTrigger>
                <TabsTrigger value="export" disabled={!uploadResult}>
                  2. ส่งออกข้อมูล
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upload" className="space-y-4">
                <div className="space-y-4">
                  <Alert>
                    <FileWarning className="h-4 w-4" />
                    <AlertTitle>คำแนะนำในการอัปโหลดไฟล์</AlertTitle>
                    <AlertDescription>
                      <ul className="list-disc list-inside text-sm mt-2 space-y-1">
                        <li>รองรับไฟล์ XLSX, CSV, และ TXT</li>
                        <li>ระบบจะอ่านข้อมูลจากคอลัมน์ A เท่านั้น</li>
                        <li>ระบบจะกรองเฉพาะข้อมูลที่เป็นเบอร์โทรศัพท์ 10 หลัก</li>
                        <li>ขนาดไฟล์ต้องไม่เกิน 10MB</li>
                      </ul>
                    </AlertDescription>
                  </Alert>

                  <FileInput
                    accept=".xlsx,.xls,.csv,.txt"
                    maxSize={10 * 1024 * 1024} // 10MB
                    onFileChange={handleFileUpload}
                    onError={(error) => toast.error(error)}
                    disabled={isUploading}
                  />

                  {isUploading && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                        <span>กำลังอัปโหลด...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <Progress value={uploadProgress} />
                    </div>
                  )}

                  {uploadResult && (
                    <div className="space-y-4">
                      <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-500" />
                        <AlertTitle className="text-green-800 dark:text-green-300">
                          อัปโหลดสำเร็จ
                        </AlertTitle>
                        <AlertDescription className="text-green-700 dark:text-green-400">
                          <p className="mt-2">
                            พบเบอร์โทรศัพท์ทั้งหมด{" "}
                            <strong>{uploadResult.totalCount.toLocaleString()}</strong>{" "}
                            เบอร์
                          </p>
                          {uploadResult.phones.length > 0 && (
                            <div className="mt-2">
                              <p className="font-medium">ตัวอย่างเบอร์โทรศัพท์:</p>
                              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-1">
                                {uploadResult.phones.slice(0, 10).map((phone, index) => (
                                  <code
                                    key={`phone-${phone}-${index}`}
                                    className="bg-white dark:bg-gray-800 px-2 py-1 rounded text-xs"
                                  >
                                    {phone}
                                  </code>
                                ))}
                              </div>
                            </div>
                          )}
                        </AlertDescription>
                      </Alert>

                      <div className="flex justify-between">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setUploadResult(null);
                            setUploadedFile(null);
                            setSavedToDb(false);
                          }}
                        >
                          อัปโหลดไฟล์ใหม่
                        </Button>

                        <Button
                          onClick={handleSaveToDatabase}
                          disabled={isSaving || savedToDb}
                          className={savedToDb ? "bg-green-600 hover:bg-green-700" : ""}
                        >
                          {savedToDb ? (
                            <>
                              <CheckCircle className="mr-2 h-4 w-4" /> บันทึกข้อมูลแล้ว
                            </>
                          ) : isSaving ? (
                            "กำลังบันทึก..."
                          ) : (
                            <>
                              <Save className="mr-2 h-4 w-4" /> บันทึกลงฐานข้อมูล
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="export" className="space-y-4">
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(handleExport)}
                    className="space-y-4"
                  >
                    <FormField
                      control={form.control}
                      name="fileName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ชื่อไฟล์</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="ชื่อไฟล์ส่งออก"
                              {...field}
                              disabled={isExporting}
                            />
                          </FormControl>
                          <FormDescription>
                            ชื่อไฟล์ที่ต้องการใช้ในการส่งออก (ไม่ต้องระบุนามสกุลไฟล์)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="format"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>รูปแบบไฟล์</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            disabled={isExporting}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="เลือกรูปแบบไฟล์" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="xlsx">
                                Excel (.xlsx)
                              </SelectItem>
                              <SelectItem value="csv">CSV (.csv)</SelectItem>
                              <SelectItem value="txt">
                                Text File (.txt)
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            รูปแบบไฟล์ที่ต้องการส่งออก
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="splitFiles"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={isExporting}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>แบ่งไฟล์ส่งออก</FormLabel>
                            <FormDescription>
                              แบ่งข้อมูลออกเป็นหลายไฟล์ตามจำนวนที่กำหนด
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                    {showSplitSize && (
                      <FormField
                        control={form.control}
                        name="splitSize"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>จำนวนเบอร์ต่อไฟล์</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                                disabled={isExporting}
                              />
                            </FormControl>
                            <FormDescription>
                              กำหนดจำนวนเบอร์โทรศัพท์สูงสุดต่อไฟล์
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isExporting || !canExport}
                    >
                      {isExporting ? (
                        "กำลังส่งออกข้อมูล..."
                      ) : (
                        <>
                          <PhoneForwarded className="mr-2 h-4 w-4" /> ส่งออกข้อมูล
                        </>
                      )}
                    </Button>
                  </form>
                </Form>

                {/* exportResult UI เดิมจะไม่แสดงผลลัพธ์ดาวน์โหลดไฟล์ เพราะ handleExport จะดาวน์โหลดไฟล์โดยตรง */}
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => router.push("/")}>
              กลับสู่หน้าหลัก
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

// Icon component สำหรับปุ่มดาวน์โหลด
function Download(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}
