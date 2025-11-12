'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, Upload, Download, AlertCircle, CheckCircle2 } from 'lucide-react';
import * as XLSX from 'xlsx';

interface BulkUploadDishDialogProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface ParsedDish {
  dish_name: string;
  dish_type: string;
  cook_method8: string;
  ingredient_tags?: string[];
  knife_skill?: string;
  cuisine?: string;
  flavor?: string;
  main_ingredients?: string[];
  sub_ingredients?: string[];
  seasons?: string[];
}

export function BulkUploadDishDialog({ onClose, onSuccess }: BulkUploadDishDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [parsedDishes, setParsedDishes] = useState<ParsedDish[]>([]);
  const [duplicateStrategy, setDuplicateStrategy] = useState<'skip' | 'overwrite'>('skip');
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [step, setStep] = useState<'upload' | 'confirm' | 'result'>('upload');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      parseExcel(selectedFile);
    }
  };

  const parseExcel = async (file: File) => {
    setParsing(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      const dishes: ParsedDish[] = jsonData.map((row: any) => {
        // 辅助函数：尝试多个列名
        const getValue = (keys: string[]) => {
          for (const key of keys) {
            if (row[key] !== undefined && row[key] !== null && row[key] !== '') {
              return row[key];
            }
          }
          return '';
        };

        const getArrayValue = (keys: string[]) => {
          const value = getValue(keys);
          if (!value) return [];
          return String(value).split(',').map((s: string) => s.trim()).filter(s => s);
        };

        // 季节解析逻辑：优先检查新格式（4个是/否列），否则使用老格式
        const parseSeasons = () => {
          const seasons: string[] = [];
          
          // 新格式：4个是/否列
          const springValue = getValue(['是否春季菜', 'is_spring']);
          const summerValue = getValue(['是否夏季菜', 'is_summer']);
          const autumnValue = getValue(['是否秋季菜', 'is_autumn']);
          const winterValue = getValue(['是否冬季菜', 'is_winter']);
          
          // 如果存在任何一个季节列，使用新格式
          if (springValue || summerValue || autumnValue || winterValue) {
            if (springValue === '是') seasons.push('春');
            if (summerValue === '是') seasons.push('夏');
            if (autumnValue === '是') seasons.push('秋');
            if (winterValue === '是') seasons.push('冬');
            return seasons;
          }
          
          // 老格式：单个"季节"列，逗号分隔
          return getArrayValue(['seasons', '季节']);
        };

        return {
          dish_name: getValue(['dish_name', '菜品名称*', '菜品名称']),
          dish_type: getValue(['dish_type', '菜品类型*', '菜品类型']),
          cook_method8: getValue(['cook_method8', '烹饪方式*', '烹饪方式']),
          ingredient_tags: getArrayValue(['ingredient_tags', '热菜食材特征', '食材特征']),
          knife_skill: getValue(['knife_skill', '刀工']) || null,
          cuisine: getValue(['cuisine', '菜系']) || null,
          flavor: getValue(['flavor', '口味']) || null,
          main_ingredients: getArrayValue(['main_ingredients', '主料']),
          sub_ingredients: getArrayValue(['sub_ingredients', '辅料']),
          seasons: parseSeasons(),
        };
      });

      setParsedDishes(dishes);
      setStep('confirm');
    } catch (error) {
      alert('解析Excel失败，请检查文件格式');
    } finally {
      setParsing(false);
    }
  };

  const handleUpload = async () => {
    setUploading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('http://localhost:8080/api/admin/dishes/common/bulk-upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          dishes: parsedDishes,
          duplicateStrategy,
        }),
      });

      if (!response.ok) throw new Error('上传失败');

      const result = await response.json();
      setUploadResult(result);
      setStep('result');
    } catch (error: any) {
      alert(error.message || '上传失败');
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('http://localhost:8080/api/admin/dishes/common/template', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('获取模板失败');

      const template = await response.json();
      
      // 创建Excel
      const worksheet = XLSX.utils.json_to_sheet(template.exampleData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, '菜品数据');
      
      // 下载
      XLSX.writeFile(workbook, '通用菜品导入模板.xlsx');
    } catch (error) {
      alert('下载模板失败');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        background: '#FFFFFF',
        borderRadius: '12px',
        maxWidth: '700px',
        width: '90%',
        maxHeight: '80vh',
        overflow: 'auto',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
      }}>
        {/* 标题栏 */}
        <div style={{
          padding: '24px',
          borderBottom: '1px solid #E8E8E3',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <h2 style={{ fontSize: '24px', fontWeight: '400', color: '#2C2C2C' }}>
            批量上传菜品
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
            }}
          >
            <X size={24} color="#666" />
          </button>
        </div>

        {/* 内容区 */}
        <div style={{ padding: '24px' }}>
          {step === 'upload' && (
            <>
              {/* 下载模板 */}
              <div style={{
                background: '#F5F5F0',
                padding: '16px',
                borderRadius: '8px',
                marginBottom: '24px',
              }}>
                <p style={{ fontSize: '14px', color: '#666', marginBottom: '12px' }}>
                  📋 第一步：下载并填写模板
                </p>
                <Button
                  onClick={downloadTemplate}
                  style={{
                    background: '#FFFFFF',
                    color: '#2C2C2C',
                    border: '1px solid #E8E8E3',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <Download size={16} />
                  下载Excel模板
                </Button>
              </div>

              {/* 上传文件 */}
              <div style={{
                background: '#F5F5F0',
                padding: '32px',
                borderRadius: '8px',
                textAlign: 'center',
                cursor: 'pointer',
                border: '2px dashed #E8E8E3',
              }}
                onClick={() => document.getElementById('file-input')?.click()}
              >
                <Upload size={48} color="#999" style={{ margin: '0 auto 16px' }} />
                <p style={{ fontSize: '16px', color: '#2C2C2C', marginBottom: '8px' }}>
                  {file ? file.name : '点击选择文件或拖拽文件到此处'}
                </p>
                <p style={{ fontSize: '14px', color: '#999' }}>
                  支持 .xlsx 格式
                </p>
                <input
                  id="file-input"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
              </div>

              {parsing && (
                <p style={{ textAlign: 'center', marginTop: '16px', color: '#666' }}>
                  正在解析文件...
                </p>
              )}
            </>
          )}

          {step === 'confirm' && (
            <>
              <div style={{
                background: '#F0F9FF',
                padding: '16px',
                borderRadius: '8px',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}>
                <CheckCircle2 size={20} color="#0369A1" />
                <p style={{ fontSize: '14px', color: '#0369A1' }}>
                  成功解析 {parsedDishes.length} 道菜品
                </p>
              </div>

              {/* 重复策略选择 */}
              <div style={{ marginBottom: '24px' }}>
                <p style={{ fontSize: '14px', color: '#666', marginBottom: '12px' }}>
                  遇到重复菜品时：
                </p>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <label style={{
                    flex: 1,
                    padding: '16px',
                    border: `2px solid ${duplicateStrategy === 'skip' ? '#2C2C2C' : '#E8E8E3'}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    background: duplicateStrategy === 'skip' ? '#FAFAFA' : '#FFFFFF',
                  }}>
                    <input
                      type="radio"
                      name="strategy"
                      value="skip"
                      checked={duplicateStrategy === 'skip'}
                      onChange={() => setDuplicateStrategy('skip')}
                      style={{ marginRight: '8px' }}
                    />
                    跳过（保留原有数据）
                  </label>
                  <label style={{
                    flex: 1,
                    padding: '16px',
                    border: `2px solid ${duplicateStrategy === 'overwrite' ? '#2C2C2C' : '#E8E8E3'}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    background: duplicateStrategy === 'overwrite' ? '#FAFAFA' : '#FFFFFF',
                  }}>
                    <input
                      type="radio"
                      name="strategy"
                      value="overwrite"
                      checked={duplicateStrategy === 'overwrite'}
                      onChange={() => setDuplicateStrategy('overwrite')}
                      style={{ marginRight: '8px' }}
                    />
                    覆盖（更新为新数据）
                  </label>
                </div>
              </div>

              {/* 预览 */}
              <div style={{
                border: '1px solid #E8E8E3',
                borderRadius: '8px',
                padding: '16px',
                maxHeight: '200px',
                overflow: 'auto',
              }}>
                <p style={{ fontSize: '14px', color: '#666', marginBottom: '12px' }}>
                  预览前10条：
                </p>
                {parsedDishes.slice(0, 10).map((dish, index) => (
                  <div key={index} style={{
                    padding: '8px',
                    background: index % 2 === 0 ? '#FAFAFA' : '#FFFFFF',
                    fontSize: '14px',
                  }}>
                    {dish.dish_name} - {dish.dish_type} - {dish.cook_method8}
                  </div>
                ))}
              </div>

              {/* 按钮 */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <Button
                  onClick={() => setStep('upload')}
                  style={{
                    flex: 1,
                    background: '#FFFFFF',
                    color: '#2C2C2C',
                    border: '1px solid #E8E8E3',
                    padding: '12px',
                    borderRadius: '8px',
                  }}
                >
                  重新选择
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={uploading}
                  style={{
                    flex: 1,
                    background: uploading ? '#CCC' : '#2C2C2C',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '12px',
                    borderRadius: '8px',
                    cursor: uploading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {uploading ? '上传中...' : '开始导入'}
                </Button>
              </div>
            </>
          )}

          {step === 'result' && uploadResult && (
            <>
              <div style={{
                background: uploadResult.results.failed > 0 ? '#FEF2F2' : '#F0FDF4',
                padding: '16px',
                borderRadius: '8px',
                marginBottom: '24px',
              }}>
                <h3 style={{ fontSize: '18px', marginBottom: '16px', color: '#2C2C2C' }}>
                  导入完成
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                  <div>
                    <p style={{ fontSize: '14px', color: '#666' }}>成功</p>
                    <p style={{ fontSize: '24px', fontWeight: '600', color: '#16A34A' }}>
                      {uploadResult.results.success}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: '14px', color: '#666' }}>跳过</p>
                    <p style={{ fontSize: '24px', fontWeight: '600', color: '#F59E0B' }}>
                      {uploadResult.results.skipped}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: '14px', color: '#666' }}>失败</p>
                    <p style={{ fontSize: '24px', fontWeight: '600', color: '#EF4444' }}>
                      {uploadResult.results.failed}
                    </p>
                  </div>
                </div>
              </div>

              {/* 错误列表 */}
              {uploadResult.results.errors.length > 0 && (
                <div style={{
                  border: '1px solid #FEE2E2',
                  borderRadius: '8px',
                  padding: '16px',
                  maxHeight: '300px',
                  overflow: 'auto',
                  background: '#FEF2F2',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <AlertCircle size={20} color="#EF4444" />
                    <p style={{ fontSize: '14px', fontWeight: '500', color: '#EF4444' }}>
                      错误详情
                    </p>
                  </div>
                  {uploadResult.results.errors.map((error: any, index: number) => (
                    <div key={index} style={{
                      padding: '8px',
                      marginBottom: '8px',
                      background: '#FFFFFF',
                      borderRadius: '4px',
                      fontSize: '13px',
                    }}>
                      <span style={{ color: '#999' }}>第{error.row}行</span> -{' '}
                      <span style={{ color: '#2C2C2C' }}>{error.dish_name}</span>:{' '}
                      <span style={{ color: '#EF4444' }}>{error.error}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* 按钮 */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <Button
                  onClick={() => {
                    onSuccess();
                    onClose();
                  }}
                  style={{
                    flex: 1,
                    background: '#2C2C2C',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '12px',
                    borderRadius: '8px',
                  }}
                >
                  完成
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

