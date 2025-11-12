'use client';

import { CheckSquare, X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BulkActionToolbarProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onDelete: () => void;
}

export function BulkActionToolbar({
  selectedCount,
  totalCount,
  onSelectAll,
  onClearSelection,
  onDelete,
}: BulkActionToolbarProps) {
  if (selectedCount === 0) return null;

  return (
    <div style={{
      background: '#F0F9FF',
      border: '1px solid #BAE6FD',
      borderRadius: '12px',
      padding: '16px 24px',
      marginBottom: '24px',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      animation: 'slideDown 0.3s ease',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
    }}>
      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      {/* 已选计数 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '15px',
        color: '#0369A1',
        fontWeight: '500',
      }}>
        <CheckSquare size={20} />
        <span>
          已选 <strong style={{ fontSize: '16px' }}>{selectedCount}</strong> 项
        </span>
      </div>

      {/* 分隔线 */}
      <div style={{
        width: '1px',
        height: '24px',
        background: '#BAE6FD',
      }} />

      {/* 全选按钮 */}
      <button
        onClick={onSelectAll}
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          fontSize: '14px',
          color: '#0369A1',
          padding: '4px 8px',
          borderRadius: '6px',
          transition: 'background 0.2s',
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(3, 105, 161, 0.1)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
      >
        ✓ 全选当前页 ({totalCount})
      </button>

      {/* 取消选择按钮 */}
      <button
        onClick={onClearSelection}
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          fontSize: '14px',
          color: '#64748B',
          padding: '4px 8px',
          borderRadius: '6px',
          transition: 'background 0.2s',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(100, 116, 139, 0.1)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
      >
        <X size={16} />
        取消
      </button>

      {/* 弹性空间 */}
      <div style={{ flex: 1 }} />

      {/* 删除按钮 */}
      <Button
        onClick={onDelete}
        style={{
          background: '#FEF2F2',
          color: '#EF4444',
          border: '1px solid #FEE2E2',
          padding: '8px 20px',
          borderRadius: '8px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '14px',
          fontWeight: '500',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#FEE2E2';
          e.currentTarget.style.borderColor = '#FCA5A5';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#FEF2F2';
          e.currentTarget.style.borderColor = '#FEE2E2';
        }}
      >
        <Trash2 size={16} />
        删除选中
      </Button>
    </div>
  );
}

