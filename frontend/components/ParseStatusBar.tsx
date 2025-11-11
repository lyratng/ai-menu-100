'use client';

import { useState, useEffect } from 'react';
import { X, ChevronDown, ChevronUp, RefreshCw, CheckCircle, AlertCircle, Clock } from 'lucide-react';

interface ParseStatus {
  menuId: string;
  fileName: string;
  status: 'pending_parse' | 'parsing' | 'parsed' | 'parse_failed';
  progress: number;
  error?: string;
}

interface ParseStatusBarProps {
  onClose?: () => void;
}

const STORAGE_KEY = 'parseStatusBar_dismissed';

export default function ParseStatusBar({ onClose }: ParseStatusBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [parseQueue, setParseQueue] = useState<ParseStatus[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [dismissedMenuIds, setDismissedMenuIds] = useState<string[]>([]);

  // 初始化：从 localStorage 读取已关闭的菜单ID
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setDismissedMenuIds(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse dismissed menu IDs:', e);
      }
    }
  }, []);

  // 轮询获取解析状态
  useEffect(() => {
    const fetchParseStatus = async () => {
      try {
        const response = await fetch('http://localhost:8080/api/menu/parse-status', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setParseQueue(data.queue || []);
          
          // 检查是否有新的解析任务（不在已关闭列表中）
          const hasNewTask = data.queue && data.queue.some(
            (item: ParseStatus) => !dismissedMenuIds.includes(item.menuId)
          );
          
          // 如果有新任务或有正在进行的任务，显示状态栏
          if (hasNewTask || (data.queue && data.queue.length > 0 && !dismissedMenuIds.length)) {
            setIsVisible(true);
          }
          
          // 如果所有任务都完成了，3秒后自动隐藏
          if (data.recentlyCompleted) {
            setTimeout(() => {
              setIsVisible(false);
              setIsExpanded(false);
              // 清除已关闭列表
              localStorage.removeItem(STORAGE_KEY);
              setDismissedMenuIds([]);
            }, 3000);
          }
        }
      } catch (error) {
        console.error('获取解析状态失败:', error);
      }
    };

    fetchParseStatus();
    const interval = setInterval(fetchParseStatus, 3000); // 每3秒轮询一次

    return () => clearInterval(interval);
  }, [dismissedMenuIds]);

  const handleRetry = async (menuId: string) => {
    try {
      await fetch(`http://localhost:8080/api/menu/${menuId}/retry-parse`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      // 从已关闭列表中移除这个菜单（因为重新解析了）
      const updatedDismissed = dismissedMenuIds.filter(id => id !== menuId);
      setDismissedMenuIds(updatedDismissed);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedDismissed));
      
      // 立即刷新状态
      const response = await fetch('http://localhost:8080/api/menu/parse-status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setParseQueue(data.queue || []);
      }
    } catch (error) {
      console.error('重新解析失败:', error);
      alert('重新解析失败，请稍后重试');
    }
  };

  const handleClose = () => {
    // 将当前所有菜单ID存入已关闭列表
    const allMenuIds = parseQueue.map(item => item.menuId);
    setDismissedMenuIds(allMenuIds);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allMenuIds));
    setIsVisible(false);
    setIsExpanded(false);
    onClose?.();
  };

  if (!isVisible) return null;

  const totalCount = parseQueue.length;
  const completedCount = parseQueue.filter(item => item.status === 'parsed').length;
  const failedCount = parseQueue.filter(item => item.status === 'parse_failed').length;
  const parsingCount = parseQueue.filter(item => 
    item.status === 'parsing' || item.status === 'pending_parse'
  ).length;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'parsed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'parse_failed':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'parsing':
        return <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />;
      case 'pending_parse':
        return <Clock className="w-4 h-4 text-gray-400" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'parsed':
        return '解析成功';
      case 'parse_failed':
        return '解析失败';
      case 'parsing':
        return '解析中';
      case 'pending_parse':
        return '排队中';
      default:
        return '未知状态';
    }
  };

  return (
    <>
      {/* 右下角浮动卡片 */}
      <div
        style={{
          position: 'fixed',
          right: '24px',
          bottom: '24px',
          zIndex: 1000,
          maxWidth: isExpanded ? '480px' : '320px',
          width: isExpanded ? '480px' : 'auto',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
          border: '1px solid rgba(232, 232, 227, 0.8)',
          transition: 'all 0.3s ease',
        }}
      >
        {/* 紧凑版顶部 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            cursor: 'pointer',
          }}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <RefreshCw
              className={parsingCount > 0 ? 'animate-spin' : ''}
              style={{ width: '18px', height: '18px', color: '#2C2C2C' }}
            />
            <div>
              <div style={{ fontSize: '15px', fontWeight: '500', color: '#2C2C2C' }}>
                {totalCount === completedCount
                  ? `解析完成`
                  : `正在解析 ${completedCount}/${totalCount}`}
              </div>
              {failedCount > 0 && (
                <div style={{ fontSize: '12px', color: '#EF4444', marginTop: '2px' }}>
                  {failedCount} 份失败
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isExpanded ? (
              <ChevronDown style={{ width: '18px', height: '18px', color: '#666' }} />
            ) : (
              <ChevronUp style={{ width: '18px', height: '18px', color: '#666' }} />
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleClose();
              }}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X style={{ width: '18px', height: '18px', color: '#666' }} />
            </button>
          </div>
        </div>

        {/* 展开的详细列表 */}
        {isExpanded && (
          <div
            style={{
              maxHeight: '400px',
              overflowY: 'auto',
              borderTop: '1px solid rgba(232, 232, 227, 0.8)',
              background: 'rgba(250, 250, 250, 0.5)',
            }}
          >
            {parseQueue.map((item) => (
              <div
                key={item.menuId}
                style={{
                  padding: '14px 20px',
                  borderBottom: '1px solid rgba(232, 232, 227, 0.5)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      {getStatusIcon(item.status)}
                      <span 
                        style={{ 
                          fontSize: '14px', 
                          fontWeight: '400', 
                          color: '#2C2C2C',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={item.fileName}
                      >
                        {item.fileName}
                      </span>
                    </div>
                    
                    <div style={{ fontSize: '12px', color: '#999', marginBottom: '6px' }}>
                      {getStatusText(item.status)}
                    </div>

                    {/* 进度条 */}
                    {(item.status === 'parsing' || item.status === 'pending_parse') && (
                      <div
                        style={{
                          width: '100%',
                          height: '3px',
                          background: 'rgba(232, 232, 227, 0.8)',
                          borderRadius: '2px',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${item.progress}%`,
                            height: '100%',
                            background: '#2C2C2C',
                            transition: 'width 0.3s ease',
                          }}
                        />
                      </div>
                    )}

                    {/* 错误信息 */}
                    {item.status === 'parse_failed' && item.error && (
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#EF4444', 
                        marginTop: '6px',
                        padding: '6px 8px',
                        background: 'rgba(239, 68, 68, 0.1)',
                        borderRadius: '4px',
                      }}>
                        {item.error}
                      </div>
                    )}
                  </div>

                  {/* 重新解析按钮 */}
                  {item.status === 'parse_failed' && (
                    <button
                      onClick={() => handleRetry(item.menuId)}
                      style={{
                        marginLeft: '12px',
                        padding: '6px 12px',
                        background: '#2C2C2C',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        whiteSpace: 'nowrap',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#000000';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#2C2C2C';
                      }}
                    >
                      重试
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

