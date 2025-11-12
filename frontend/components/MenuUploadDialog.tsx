'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, X, FileSpreadsheet, CheckCircle, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';

interface UploadedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  errorMessage?: string;
}

interface MenuUploadDialogProps {
  open: boolean;
  onClose: () => void;
  onUploadSuccess: () => void;
  maxFiles?: number;
  currentCount?: number;
  storeId: string;
  mealType?: 'lunch' | 'dinner';
}

export default function MenuUploadDialog({
  open,
  onClose,
  onUploadSuccess,
  maxFiles = 50,
  currentCount = 0,
  storeId,
  mealType = 'lunch',
}: MenuUploadDialogProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const remainingSlots = maxFiles - currentCount - uploadedFiles.length;
    
    if (acceptedFiles.length > remainingSlots) {
      alert(`最多只能上传 ${remainingSlots} 份菜单（当前已有 ${currentCount} 份）`);
      return;
    }
    
    const newFiles: UploadedFile[] = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substring(2, 15),
      file,
      name: file.name,
      size: file.size,
      status: 'pending',
      progress: 0,
    }));
    
    setUploadedFiles(prev => [...prev, ...newFiles]);
  }, [uploadedFiles, currentCount, maxFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: true, // 支持批量上传
  });

  const removeFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleUpload = async () => {
    if (uploadedFiles.length === 0) {
      return;
    }

    setIsUploading(true);
    console.log('📤 准备上传文件:', uploadedFiles);

    // 获取token
    const token = localStorage.getItem('token');
    if (!token) {
      alert('请先登录');
      setIsUploading(false);
      return;
    }

    // 上传所有文件
    const uploadPromises = uploadedFiles.map(async (fileData) => {
      try {
        setUploadedFiles(prev => prev.map(f =>
          f.id === fileData.id ? { ...f, status: 'uploading' } : f
        ));

        const formData = new FormData();
        formData.append('file', fileData.file);
        formData.append('store_id', storeId);
        formData.append('meal_type', mealType);

        console.log('📤 上传文件:', fileData.file.name, '门店ID:', storeId);

        const response = await fetch('http://localhost:8080/api/menu/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || '上传失败');
        }

        const result = await response.json();
        console.log('✅ 文件上传成功:', result);

        setUploadedFiles(prev => prev.map(f =>
          f.id === fileData.id ? { ...f, status: 'success' } : f
        ));

        return result;
      } catch (error: any) {
        console.error('❌ 文件上传失败:', error);
        setUploadedFiles(prev => prev.map(f =>
          f.id === fileData.id ? { ...f, status: 'error', errorMessage: error.message } : f
        ));
        throw error;
      }
    });

    try {
      await Promise.all(uploadPromises);
      console.log('✅ 所有文件上传完成');
      
      // 延迟1秒后关闭对话框，让用户看到成功状态
      setTimeout(() => {
        setUploadedFiles([]);
        setIsUploading(false);
        onClose();
        onUploadSuccess();
      }, 1000);
    } catch (error) {
      console.error('❌ 部分文件上传失败');
      alert('部分文件上传失败，请检查后重试');
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      setUploadedFiles([]);
      onClose();
    }
  };

  const getStatusIcon = (status: UploadedFile['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: UploadedFile['status']) => {
    switch (status) {
      case 'pending':
        return <span className="text-[#999] font-light">待上传</span>;
      case 'uploading':
        return <span className="text-blue-600 font-light">上传中...</span>;
      case 'success':
        return <span className="text-green-600 font-light">上传成功</span>;
      case 'error':
        return <span className="text-red-600 font-light">上传失败</span>;
    }
  };

  const remainingSlots = maxFiles - currentCount;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-light text-[#2C2C2C] tracking-wide">
            上传历史菜单
          </DialogTitle>
          <DialogDescription className="text-sm font-light text-[#999] tracking-wide">
            上传Excel作为历史菜单参考，支持批量上传（剩余可上传: {remainingSlots} 份）
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          <Alert className="bg-blue-50 border-blue-200 text-blue-800 border">
            <InfoIcon className="h-4 w-4" />
            <AlertTitle className="font-light tracking-wide">提示</AlertTitle>
            <AlertDescription className="font-light text-sm">
              请确保您的Excel文件包含一周的菜单数据（周一到周五），支持有表头和无表头两种格式
            </AlertDescription>
          </Alert>

          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300 ${
              isDragActive
                ? 'border-[#2C2C2C] bg-[#F5F5F0]'
                : 'border-[#E8E8E3] hover:border-[#999] bg-white'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-[#999] mb-4" />
            {isDragActive ? (
              <p className="text-base font-light text-[#2C2C2C] tracking-wide">
                拖放文件到这里...
              </p>
            ) : (
              <>
                <p className="text-base font-light text-[#2C2C2C] tracking-wide mb-2">
                  拖拽文件到此处，或点击选择文件
                </p>
                <p className="text-sm font-light text-[#999]">
                  支持 .xlsx 和 .xls 格式，支持批量上传，单个文件不超过10MB
                </p>
              </>
            )}
          </div>

          {uploadedFiles.length > 0 && (
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {uploadedFiles.map(file => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-4 border border-[#E8E8E3] rounded-lg bg-white hover:bg-[#F5F5F0] transition-colors"
                >
                  <div className="flex items-center space-x-4 flex-1">
                    <FileSpreadsheet className="h-6 w-6 text-[#2C2C2C] flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-light text-[#2C2C2C] truncate">{file.name}</p>
                      <p className="text-xs font-light text-[#999]">
                        {(file.size / 1024).toFixed(2)} KB
                      </p>
                      {file.status === 'error' && file.errorMessage && (
                        <p className="text-xs font-light text-red-600 mt-1">
                          {file.errorMessage}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(file.status)}
                    {getStatusText(file.status)}
                    <button
                      onClick={() => removeFile(file.id)}
                      className="p-1 hover:bg-[#E8E8E3] rounded transition-colors"
                      disabled={isUploading}
                    >
                      <X className="h-4 w-4 text-[#999]" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-4 pt-4 border-t border-[#E8E8E3]">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isUploading}
              className="font-light border-[#E8E8E3] hover:bg-[#F5F5F0]"
            >
              取消
            </Button>
            <Button
              onClick={handleUpload}
              disabled={isUploading || uploadedFiles.length === 0}
              className="font-light bg-[#E8E8E3] text-[#999] hover:bg-[#2C2C2C] hover:text-white transition-all duration-300"
            >
              {isUploading ? '上传中...' : `上传 ${uploadedFiles.length} 个文件`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

