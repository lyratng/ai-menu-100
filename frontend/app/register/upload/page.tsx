'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, X, FileSpreadsheet, CheckCircle, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';
import { API_URL } from '@/lib/config';

interface UploadedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
}

export default function RegisterUploadPage() {
  const router = useRouter();
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    // 检查是否有临时注册信息和配置信息
    const token = sessionStorage.getItem('registerToken');
    const user = sessionStorage.getItem('registerUser');
    const config = sessionStorage.getItem('registerConfig');
    if (!token || !user || !config) {
      alert('请先完成注册和配置步骤');
      router.push('/register');
    }
  }, [router]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (uploadedFiles.length + acceptedFiles.length > 8) {
      alert('最多只能上传8份历史菜单');
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
  }, [uploadedFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const removeFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleSubmit = async () => {
    if (uploadedFiles.length === 0) {
      // 跳过上传，直接完成注册
      handleSkip();
      return;
    }

    setIsUploading(true);
    console.log('📤 准备上传文件:', uploadedFiles);

    // 获取用户信息
    const token = sessionStorage.getItem('registerToken');
    const userStr = sessionStorage.getItem('registerUser');

    if (!token || !userStr) {
      alert('用户信息缺失，请重新注册');
      setIsUploading(false);
      return;
    }

    let storeId: string;
    try {
      const user = JSON.parse(userStr);
      storeId = user.storeId || user.store_id;
      if (!storeId) {
        alert('门店信息缺失，请重新注册');
        setIsUploading(false);
        return;
      }
      console.log('🏪 门店ID:', storeId);
    } catch (error) {
      alert('用户信息解析失败');
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
        formData.append('meal_type', 'lunch');

        console.log('📤 上传文件:', fileData.file.name, '门店ID:', storeId);

        const response = await fetch('${API_URL}/api/menu/upload', {
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
      } catch (error) {
        console.error('❌ 文件上传失败:', error);
        setUploadedFiles(prev => prev.map(f =>
          f.id === fileData.id ? { ...f, status: 'error' } : f
        ));
        throw error;
      }
    });

    try {
      await Promise.all(uploadPromises);
      console.log('✅ 所有文件上传完成');
      alert('文件上传成功！正在后台解析，请在主页查看解析状态。');

      // 完成注册流程
      handleSkip();
    } catch (error) {
      console.error('❌ 部分文件上传失败');
      alert('部分文件上传失败，请检查后重试');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSkip = () => {
    // 将临时的token和user转移到localStorage，完成注册
    const token = sessionStorage.getItem('registerToken');
    const user = sessionStorage.getItem('registerUser');
    const config = sessionStorage.getItem('registerConfig');

    if (token && user) {
      console.log('✅ 注册流程完成，保存认证信息');
      localStorage.setItem('token', token);
      localStorage.setItem('user', user);

      // 清除临时数据
      sessionStorage.removeItem('registerToken');
      sessionStorage.removeItem('registerUser');
      sessionStorage.removeItem('registerConfig');
    }

    // 跳转到主页
    console.log('🔄 跳转到主页');
    router.push('/');
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

  return (
    <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl border border-[#E8E8E3] shadow-lg bg-white">
        <CardHeader className="text-center pb-8 pt-10">
          <CardTitle className="text-2xl font-light text-[#2C2C2C] tracking-wide">
            上传历史菜单
          </CardTitle>
          <CardDescription className="text-sm font-light text-[#999] tracking-wide mt-2">
            上传1-8份历史菜单Excel作为参考，也可跳过此步骤
          </CardDescription>
        </CardHeader>
        
        <CardContent className="px-10 pb-10 space-y-6">
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
                  支持 .xlsx 和 .xls 格式，最多8份，单个文件不超过10MB
                </p>
              </>
            )}
          </div>

          {uploadedFiles.length > 0 && (
            <div className="space-y-3">
              {uploadedFiles.map(file => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-4 border border-[#E8E8E3] rounded-lg bg-white hover:bg-[#F5F5F0] transition-colors"
                >
                  <div className="flex items-center space-x-4 flex-1">
                    <FileSpreadsheet className="h-6 w-6 text-[#2C2C2C]" />
                    <div className="flex-1">
                      <p className="text-sm font-light text-[#2C2C2C]">{file.name}</p>
                      <p className="text-xs font-light text-[#999]">
                        {(file.size / 1024).toFixed(2)} KB
                      </p>
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

          <div className="flex justify-between gap-4 pt-4">
            <Button
              variant="outline"
              onClick={handleSkip}
              disabled={isUploading}
              className="flex-1 h-12 text-base font-light tracking-wide border-[#E8E8E3] hover:bg-[#F5F5F0]"
            >
              跳过
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isUploading}
              className="flex-1 h-12 text-base font-light tracking-wide bg-[#E8E8E3] text-[#999] hover:bg-[#2C2C2C] hover:text-white transition-all duration-300"
            >
              {isUploading ? '上传中...' : uploadedFiles.length > 0 ? '提交' : '完成注册'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
