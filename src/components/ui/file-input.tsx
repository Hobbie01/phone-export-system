"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { UploadCloud, X } from "lucide-react";

interface FileInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onError"> {
  className?: string;
  onFileChange?: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  maxSize?: number;
  showFileList?: boolean;
  showSizeError?: boolean;
  onError?: (error: string) => void;
}

const FileInput = React.forwardRef<HTMLInputElement, FileInputProps>(
  (
    {
      className,
      onFileChange,
      accept,
      multiple = false,
      maxFiles = 1,
      maxSize,
      showFileList = true,
      showSizeError = true,
      onError,
      ...props
    },
    ref
  ) => {
    const [files, setFiles] = React.useState<File[]>([]);
    const [dragActive, setDragActive] = React.useState<boolean>(false);
    // ใช้ forwardRef ที่ส่งมาแทนการสร้าง ref ใหม่
    const inputRef = React.useRef<HTMLInputElement | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      e.preventDefault();
      if (e.target.files) {
        handleFiles(Array.from(e.target.files));
      }
    };

    const handleDrag = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.type === "dragenter" || e.type === "dragover") {
        setDragActive(true);
      } else if (e.type === "dragleave") {
        setDragActive(false);
      }
    };

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      if (e.dataTransfer.files) {
        handleFiles(Array.from(e.dataTransfer.files));
      }
    };

    const handleFiles = (newFiles: File[]) => {
      let validFiles = [...newFiles];

      // ตรวจสอบจำนวนไฟล์
      if (multiple && maxFiles && files.length + validFiles.length > maxFiles) {
        validFiles = validFiles.slice(0, maxFiles - files.length);
        if (onError) onError(`เลือกได้ไม่เกิน ${maxFiles} ไฟล์`);
      }

      // ตรวจสอบนามสกุลไฟล์
      if (accept) {
        const acceptedTypes = accept.split(",").map((type) => type.trim());
        validFiles = validFiles.filter((file) => {
          const fileType = file.type || "";
          const fileExtension = `.${file.name.split(".").pop()}`;
          return acceptedTypes.some(
            (type) =>
              type === fileType ||
              type === fileExtension ||
              (type.includes("/*") &&
                fileType.startsWith(type.replace("/*", "/")))
          );
        });
      }

      // ตรวจสอบขนาดไฟล์
      if (maxSize) {
        const oversizedFiles = validFiles.filter(
          (file) => file.size > maxSize
        );
        if (oversizedFiles.length > 0 && showSizeError) {
          const maxSizeMB = Math.floor(maxSize / (1024 * 1024));
          if (onError)
            onError(`ไฟล์ต้องมีขนาดไม่เกิน ${maxSizeMB} MB ต่อไฟล์`);
        }
        validFiles = validFiles.filter((file) => file.size <= maxSize);
      }

      // อัปเดตรายการไฟล์
      const updatedFiles = multiple ? [...files, ...validFiles] : validFiles;
      setFiles(updatedFiles);
      if (onFileChange) {
        onFileChange(updatedFiles);
      }
    };

    const removeFile = (index: number) => {
      const updatedFiles = [...files];
      updatedFiles.splice(index, 1);
      setFiles(updatedFiles);
      if (onFileChange) {
        onFileChange(updatedFiles);
      }
    };

    const clearFiles = () => {
      setFiles([]);
      if (onFileChange) {
        onFileChange([]);
      }

      // ล้างค่าใน file input
      const fileInput = ref && "current" in ref ? ref.current : inputRef.current;
      if (fileInput) {
        fileInput.value = "";
      }
    };

    // ใช้ useEffect เพื่อซิงค์ ref ระหว่าง ref ที่ส่งมาและ inputRef ภายใน
    React.useEffect(() => {
      const fileInput = ref && "current" in ref ? ref.current : null;
      if (fileInput) {
        inputRef.current = fileInput;
      }
    }, [ref]);

    return (
      <div className="w-full">
        <div
          className={cn(
            "relative flex flex-col items-center justify-center w-full p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
            dragActive
              ? "border-primary bg-muted"
              : "border-gray-300 dark:border-gray-700 hover:bg-muted/50",
            className
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => {
            const fileInput = ref && "current" in ref ? ref.current : inputRef.current;
            if (fileInput) {
              fileInput.click();
            }
          }}
        >
          <UploadCloud className="w-10 h-10 mb-2 text-gray-500 dark:text-gray-400" />
          <p className="mb-2 text-sm text-gray-700 dark:text-gray-300">
            <span className="font-semibold">คลิกเพื่อเลือกไฟล์</span> หรือลากไฟล์มาวางที่นี่
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {accept && `รองรับไฟล์: ${accept}`}
            {maxSize && ` ขนาดไม่เกิน ${Math.floor(maxSize / (1024 * 1024))} MB`}
          </p>
          <input
            ref={(node) => {
              // อัปเดต inputRef ภายใน
              inputRef.current = node;

              // อัปเดต ref ที่ส่งมา
              if (typeof ref === "function") {
                ref(node);
              } else if (ref) {
                (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
              }
            }}
            type="file"
            className="hidden"
            onChange={handleChange}
            accept={accept}
            multiple={multiple}
            {...props}
          />
        </div>

        {showFileList && files.length > 0 && (
          <div className="mt-4">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-medium">
                ไฟล์ที่เลือก ({files.length})
              </h4>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  clearFiles();
                }}
              >
                ล้างทั้งหมด
              </Button>
            </div>
            <ul className="space-y-2">
              {files.map((file, index) => (
                <li
                  key={`${file.name}-${index}`}
                  className="flex items-center justify-between p-2 text-sm bg-muted/50 rounded-md"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <div className="flex-shrink-0 w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center">
                      <span className="text-xs text-primary font-medium">
                        {file.name.split(".").pop()?.toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(index);
                    }}
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">ลบไฟล์</span>
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }
);

FileInput.displayName = "FileInput";

export { FileInput };
