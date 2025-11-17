'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';
import { API_URL } from '@/lib/config';

interface StoreDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  store?: any; // 如果传入store，则为编辑模式
}

export default function StoreDialog({ isOpen, onClose, onSuccess, store }: StoreDialogProps) {
  const [storeName, setStoreName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isEditMode = !!store;

  useEffect(() => {
    if (store) {
      setStoreName(store.store_name || '');
      setUsername(store.username || '');
      setPassword('');
      setConfirmPassword('');
    } else {
      setStoreName('');
      setUsername('');
      setPassword('');
      setConfirmPassword('');
    }
    setError('');
  }, [store, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 表单验证
    if (!storeName.trim()) {
      setError('请输入门店名称');
      return;
    }

    if (!isEditMode && !username.trim()) {
      setError('请输入登录账号');
      return;
    }

    if (!isEditMode) {
      if (!password) {
        setError('请输入密码');
        return;
      }
      if (password !== confirmPassword) {
        setError('两次输入的密码不一致');
        return;
      }
      if (password.length < 6) {
        setError('密码长度至少6位');
        return;
      }
    } else {
      // 编辑模式，如果输入了密码则需要验证
      if (password && password !== confirmPassword) {
        setError('两次输入的密码不一致');
        return;
      }
      if (password && password.length < 6) {
        setError('密码长度至少6位');
        return;
      }
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('admin_token');
      const url = isEditMode 
        ? `${API_URL}/api/admin/stores/${store.id}`
        : `${API_URL}/api/admin/stores`;
      
      const body: any = {
        storeName: storeName.trim(),
      };

      if (!isEditMode) {
        body.username = username.trim();
        body.password = password;
      } else {
        if (username && username !== store.username) {
          body.username = username.trim();
        }
        if (password) {
          body.password = password;
        }
      }

      const response = await fetch(url, {
        method: isEditMode ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `${isEditMode ? '更新' : '创建'}门店失败`);
      }

      alert(`${isEditMode ? '更新' : '创建'}门店成功！`);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || `${isEditMode ? '更新' : '创建'}门店失败`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

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
      padding: '24px'
    }}>
      <div style={{
        background: '#FFFFFF',
        borderRadius: '12px',
        padding: '32px',
        maxWidth: '500px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        {/* 标题 */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <h2 style={{ 
            fontSize: '24px', 
            fontWeight: '400', 
            color: '#2C2C2C',
            letterSpacing: '0.5px'
          }}>
            {isEditMode ? '编辑门店' : '新增门店'}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              color: '#666'
            }}
          >
            <X size={24} />
          </button>
        </div>

        {/* 表单 */}
        <form onSubmit={handleSubmit}>
          {/* 门店名称 */}
          <div style={{ marginBottom: '24px' }}>
            <Label htmlFor="storeName" style={{ 
              fontSize: '16px', 
              color: '#2C2C2C',
              fontWeight: '400',
              marginBottom: '8px',
              display: 'block'
            }}>
              门店名称 <span style={{ color: '#EF4444' }}>*</span>
            </Label>
            <input
              id="storeName"
              type="text"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder="请输入门店名称"
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                fontSize: '16px',
                border: '1px solid #E8E8E3',
                borderRadius: '8px',
                background: '#FAFAFA',
                color: '#2C2C2C',
                fontWeight: '400'
              }}
            />
          </div>

          {/* 登录账号 */}
          <div style={{ marginBottom: '24px' }}>
            <Label htmlFor="username" style={{ 
              fontSize: '16px', 
              color: '#2C2C2C',
              fontWeight: '400',
              marginBottom: '8px',
              display: 'block'
            }}>
              登录账号 {!isEditMode && <span style={{ color: '#EF4444' }}>*</span>}
            </Label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={isEditMode ? '留空则不修改' : '请输入登录账号'}
              disabled={isEditMode && !username}
              required={!isEditMode}
              style={{
                width: '100%',
                padding: '12px 16px',
                fontSize: '16px',
                border: '1px solid #E8E8E3',
                borderRadius: '8px',
                background: isEditMode && !username ? '#F5F5F0' : '#FAFAFA',
                color: '#2C2C2C',
                fontWeight: '400'
              }}
            />
            {isEditMode && (
              <p style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                暂不支持修改账号
              </p>
            )}
          </div>

          {/* 密码 */}
          <div style={{ marginBottom: '24px' }}>
            <Label htmlFor="password" style={{ 
              fontSize: '16px', 
              color: '#2C2C2C',
              fontWeight: '400',
              marginBottom: '8px',
              display: 'block'
            }}>
              {isEditMode ? '新密码' : '密码'} {!isEditMode && <span style={{ color: '#EF4444' }}>*</span>}
            </Label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isEditMode ? '留空则不修改密码' : '请输入密码（至少6位）'}
              required={!isEditMode}
              style={{
                width: '100%',
                padding: '12px 16px',
                fontSize: '16px',
                border: '1px solid #E8E8E3',
                borderRadius: '8px',
                background: '#FAFAFA',
                color: '#2C2C2C',
                fontWeight: '400'
              }}
            />
          </div>

          {/* 确认密码 */}
          <div style={{ marginBottom: '24px' }}>
            <Label htmlFor="confirmPassword" style={{ 
              fontSize: '16px', 
              color: '#2C2C2C',
              fontWeight: '400',
              marginBottom: '8px',
              display: 'block'
            }}>
              确认密码 {!isEditMode && <span style={{ color: '#EF4444' }}>*</span>}
            </Label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={isEditMode ? '留空则不修改密码' : '请再次输入密码'}
              required={!isEditMode}
              style={{
                width: '100%',
                padding: '12px 16px',
                fontSize: '16px',
                border: '1px solid #E8E8E3',
                borderRadius: '8px',
                background: '#FAFAFA',
                color: '#2C2C2C',
                fontWeight: '400'
              }}
            />
          </div>

          {/* 错误提示 */}
          {error && (
            <div style={{
              padding: '12px',
              marginBottom: '24px',
              background: '#FEF2F2',
              border: '1px solid #FEE2E2',
              borderRadius: '8px',
              color: '#EF4444',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          {/* 按钮 */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <Button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                padding: '12px 24px',
                background: '#FFFFFF',
                color: '#666',
                border: '1px solid #E8E8E3',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                fontWeight: '400'
              }}
            >
              取消
            </Button>
            <Button
              type="submit"
              disabled={loading}
              style={{
                padding: '12px 24px',
                background: loading ? '#999' : '#2C2C2C',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                fontWeight: '400'
              }}
            >
              {loading ? '处理中...' : (isEditMode ? '保存' : '创建')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}



