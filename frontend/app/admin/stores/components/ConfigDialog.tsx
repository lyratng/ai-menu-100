'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, ChevronDown, ChevronRight } from 'lucide-react';
import { API_URL } from '@/lib/config';

interface ConfigDialogProps {
  storeId: string;
  storeName: string;
  currentConfig: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ConfigDialog({ 
  storeId, 
  storeName, 
  currentConfig, 
  onClose, 
  onSuccess 
}: ConfigDialogProps) {
  const [config, setConfig] = useState({
    breakfast: {
      coldDishes: 5,
      pickles: 5,
      westernPastries: 3,
      soupAndCongee: 5,
      specialStaple: 15,
      eggs: 2,
    },
    lunch: {
      coldDishes: 4,
      hotDishes: 18,
      soupAndCongee: 4,
      westernPastries: 3,
      specialStaple: 7,
      specialFlavor: 6,
    },
    dinner: {
      coldDishes: 4,
      hotDishes: 18,
      soupAndCongee: 4,
      westernPastries: 2,
      specialStaple: 6,
      specialFlavor: 7,
    },
    lateNight: {
      coldDishes: 4,
      hotDishes: 3,
      soupAndCongee: 3,
      specialStaple: 6,
      specialFlavor: 2,
    },
  });

  const [expandedSections, setExpandedSections] = useState({
    breakfast: false,
    lunch: true,
    dinner: false,
    lateNight: false,
  });

  useEffect(() => {
    if (currentConfig) {
      setConfig(currentConfig);
    }
  }, [currentConfig]);

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_URL}/api/admin/stores/${storeId}/config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ defaultConfig: config }),
      });

      if (!response.ok) throw new Error('保存配置失败');

      alert('配置保存成功！');
      onSuccess();
      onClose();
    } catch (error: any) {
      alert(error.message || '保存配置失败');
    }
  };

  const updateValue = (meal: string, field: string, value: number) => {
    setConfig((prev: any) => ({
      ...prev,
      [meal]: {
        ...prev[meal],
        [field]: Math.max(0, value),
      },
    }));
  };

  const toggleSection = (section: string) => {
    setExpandedSections((prev: any) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const mealLabels: Record<string, string> = {
    breakfast: '早餐',
    lunch: '午餐',
    dinner: '晚餐',
    lateNight: '夜宵',
  };

  const fieldLabels: Record<string, Record<string, string>> = {
    breakfast: {
      coldDishes: '凉菜',
      pickles: '咸菜',
      westernPastries: '西餐糕点',
      soupAndCongee: '汤粥类（含特色风味）',
      specialStaple: '花色（特色）主食',
      eggs: '蛋类',
    },
    lunch: {
      coldDishes: '凉菜',
      hotDishes: '热菜',
      soupAndCongee: '汤粥',
      westernPastries: '西餐糕点',
      specialStaple: '花色主食',
      specialFlavor: '特色风味食品',
    },
    dinner: {
      coldDishes: '凉菜',
      hotDishes: '热菜',
      soupAndCongee: '汤粥',
      westernPastries: '西餐糕点',
      specialStaple: '花色主食',
      specialFlavor: '特色风味食品',
    },
    lateNight: {
      coldDishes: '凉菜',
      hotDishes: '热菜',
      soupAndCongee: '汤粥',
      specialStaple: '花色主食',
      specialFlavor: '特色风味食品',
    },
  };

  return (
    <div
      style={{
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
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '12px',
          width: '90%',
          maxWidth: '800px',
          maxHeight: '90vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 标题栏 */}
        <div
          style={{
            padding: '24px',
            borderBottom: '1px solid #E8E8E3',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: '500', color: '#2C2C2C', letterSpacing: '1px' }}>
              修改门店初始化配置
            </h2>
            <p style={{ fontSize: '14px', color: '#999', marginTop: '8px' }}>
              {storeName}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#999',
              padding: '8px',
            }}
          >
            <X size={24} />
          </button>
        </div>

        {/* 配置内容 */}
        <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
          {Object.keys(config).map((mealKey) => {
            const isExpanded = expandedSections[mealKey as keyof typeof expandedSections];
            const mealConfig = config[mealKey as keyof typeof config];
            const fields = fieldLabels[mealKey];

            return (
              <div
                key={mealKey}
                style={{
                  marginBottom: '16px',
                  border: '1px solid #E8E8E3',
                  borderRadius: '8px',
                  overflow: 'hidden',
                }}
              >
                {/* 标题（可折叠） */}
                <button
                  onClick={() => toggleSection(mealKey)}
                  style={{
                    width: '100%',
                    padding: '16px',
                    background: isExpanded ? '#FAFAFA' : '#FFFFFF',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '18px',
                    fontWeight: '400',
                    color: '#2C2C2C',
                  }}
                >
                  <span>{mealLabels[mealKey]}</span>
                  {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                </button>

                {/* 配置项 */}
                {isExpanded && (
                  <div style={{ padding: '16px', background: '#FAFAFA' }}>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                        gap: '16px',
                      }}
                    >
                      {Object.keys(fields).map((fieldKey) => (
                        <div key={fieldKey}>
                          <label
                            style={{
                              display: 'block',
                              fontSize: '14px',
                              color: '#666',
                              marginBottom: '8px',
                            }}
                          >
                            {fields[fieldKey]}
                          </label>
                          <Input
                            type="number"
                            min="0"
                            value={mealConfig[fieldKey as keyof typeof mealConfig]}
                            onChange={(e) =>
                              updateValue(mealKey, fieldKey, parseInt(e.target.value) || 0)
                            }
                            style={{
                              height: '40px',
                              border: '1px solid #E8E8E3',
                              borderRadius: '8px',
                              padding: '0 12px',
                              fontSize: '16px',
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 底部按钮 */}
        <div
          style={{
            padding: '24px',
            borderTop: '1px solid #E8E8E3',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
          }}
        >
          <Button
            onClick={onClose}
            style={{
              padding: '12px 24px',
              background: '#FFFFFF',
              color: '#666',
              border: '1px solid #E8E8E3',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            取消
          </Button>
          <Button
            onClick={handleSave}
            style={{
              padding: '12px 24px',
              background: '#2C2C2C',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            保存配置
          </Button>
        </div>
      </div>
    </div>
  );
}



