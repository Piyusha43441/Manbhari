import React, { useState, useRef } from 'react';
import { Upload, X, File, Film, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface FileUploadProps {
  onFileSelect: (base64: string, type: 'image' | 'video') => void;
  accept?: string;
  maxSize?: number; // in bytes
  label?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({ 
  onFileSelect, 
  accept = "image/*,video/*", 
  maxSize = 1024 * 1024, // 1MB default
  label = "Drag & drop or click to upload"
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileType, setFileType] = useState<'image' | 'video' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    if (file.size > maxSize) {
      toast.error(`File is too large. Max size is ${Math.round(maxSize / 1024)}KB`);
      return;
    }

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      const type = file.type.startsWith('video') ? 'video' : 'image';
      setPreview(base64);
      setFileType(type);
      onFileSelect(base64, type);
      setIsProcessing(false);
    };
    reader.onerror = () => {
      toast.error("Failed to read file");
      setIsProcessing(false);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const clearFile = () => {
    setPreview(null);
    setFileType(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-4">
      {!preview ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`
            relative border-2 border-dashed rounded-3xl p-8 transition-all cursor-pointer
            flex flex-col items-center justify-center gap-4 text-center
            ${isDragging ? 'border-primary bg-primary/5 scale-[0.98]' : 'border-muted-foreground/20 hover:border-primary/50 hover:bg-secondary/50'}
            ${isProcessing ? 'pointer-events-none opacity-50' : ''}
          `}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept={accept}
            className="hidden"
          />
          
          {isProcessing ? (
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          ) : (
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <Upload className="h-8 w-8" />
            </div>
          )}
          
          <div className="space-y-1">
            <p className="font-bold">{label}</p>
            <p className="text-xs text-muted-foreground">
              Supports Images and Videos (Max {Math.round(maxSize / 1024)}KB)
            </p>
          </div>
        </div>
      ) : (
        <div className="relative rounded-3xl overflow-hidden border bg-secondary/30 aspect-video group">
          {fileType === 'video' ? (
            <video 
              src={preview} 
              className="w-full h-full object-cover" 
              controls 
            />
          ) : (
            <img 
              src={preview} 
              alt="Preview" 
              className="w-full h-full object-cover" 
              referrerPolicy="no-referrer"
            />
          )}
          
          <button
            onClick={clearFile}
            className="absolute top-4 right-4 h-10 w-10 rounded-full bg-black/50 text-white flex items-center justify-center backdrop-blur-md hover:bg-black/70 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
};
