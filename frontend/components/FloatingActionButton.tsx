'use client';

import { useState } from 'react';
import { Plus, Upload, FileText, X } from 'lucide-react';

interface FloatingActionButtonProps {
  onNewDish: () => void;
  onBulkUpload: () => void;
}

export function FloatingActionButton({ onNewDish, onBulkUpload }: FloatingActionButtonProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleOptionClick = (action: () => void) => {
    action();
    setIsExpanded(false);
  };

  return (
    <div style={{
      position: 'fixed',
      right: '60px',
      bottom: '72px',
      zIndex: 999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end',
    }}>
      {/* 展开的选项 */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '12px',
        marginBottom: '12px',
        opacity: isExpanded ? 1 : 0,
        transform: isExpanded ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        pointerEvents: isExpanded ? 'auto' : 'none',
      }}>
        {/* 批量上传选项 */}
        <button
          onClick={() => handleOptionClick(onBulkUpload)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '14px 20px',
            background: '#FFFFFF',
            border: '1px solid #E8E8E3',
            borderRadius: '12px',
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)',
            transition: 'all 0.2s ease',
            fontSize: '15px',
            fontWeight: '400',
            color: '#2C2C2C',
            letterSpacing: '0.3px',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#FAFAFA';
            e.currentTarget.style.transform = 'translateX(-4px)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#FFFFFF';
            e.currentTarget.style.transform = 'translateX(0)';
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.12)';
          }}
        >
          <Upload size={20} strokeWidth={2} />
          <span>批量上传</span>
        </button>

        {/* 新增菜品选项 */}
        <button
          onClick={() => handleOptionClick(onNewDish)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '14px 20px',
            background: '#FFFFFF',
            border: '1px solid #E8E8E3',
            borderRadius: '12px',
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)',
            transition: 'all 0.2s ease',
            fontSize: '15px',
            fontWeight: '400',
            color: '#2C2C2C',
            letterSpacing: '0.3px',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#FAFAFA';
            e.currentTarget.style.transform = 'translateX(-4px)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#FFFFFF';
            e.currentTarget.style.transform = 'translateX(0)';
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.12)';
          }}
        >
          <FileText size={20} strokeWidth={2} />
          <span>新增菜品</span>
        </button>
      </div>

      {/* 主按钮 */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          background: '#2C2C2C',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 6px 24px rgba(44, 44, 44, 0.3)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: isExpanded ? 'rotate(45deg)' : 'rotate(0deg)',
        }}
        onMouseEnter={(e) => {
          if (!isExpanded) {
            e.currentTarget.style.transform = 'scale(1.08)';
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(44, 44, 44, 0.4)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isExpanded) {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 6px 24px rgba(44, 44, 44, 0.3)';
          }
        }}
      >
        {isExpanded ? (
          <X size={32} color="#FFFFFF" strokeWidth={2.5} />
        ) : (
          <Plus size={36} color="#FFFFFF" strokeWidth={2.5} />
        )}
      </button>
    </div>
  );
}

