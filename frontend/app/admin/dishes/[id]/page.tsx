'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trash2 } from 'lucide-react';

interface DishDetail {
  id: string;
  store_id: string;
  store_name: string;
  dish_name: string;
  dish_type: string;
  ingredient_tags: string[];
  knife_skill: string | null;
  cuisine: string | null;
  cook_method8: string;
  flavor: string | null;
  main_ingredients: string[];
  sub_ingredients: string[];
  seasons: string[];
  common_dish_id: string | null;
  analysis: any;
  is_active: boolean;
  created_at: string;
}

export default function DishDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [dish, setDish] = useState<DishDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDishDetail();
  }, [params.id]);

  const fetchDishDetail = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`http://localhost:8080/api/admin/dishes/${params.id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('获取菜品详情失败');

      const data = await response.json();
      setDish(data.dish);
    } catch (error: any) {
      console.error('获取菜品详情失败:', error);
      alert(error.message || '获取菜品详情失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`确定要删除菜品"${dish?.dish_name}"吗？此操作为软删除。`)) return;

    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`http://localhost:8080/api/admin/dishes/${params.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('删除失败');

      alert('删除成功！');
      router.push('/admin/dishes');
    } catch (error: any) {
      alert(error.message || '删除失败');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div style={{ padding: '48px', textAlign: 'center', color: '#999' }}>
        加载中...
      </div>
    );
  }

  if (!dish) {
    return (
      <div style={{ padding: '48px', textAlign: 'center', color: '#999' }}>
        菜品不存在
      </div>
    );
  }

  const analysis = dish.analysis || {};

  return (
    <div style={{ padding: '48px' }}>
      {/* 顶部操作栏 */}
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Button
            onClick={() => router.push('/admin/dishes')}
            style={{
              background: '#FFFFFF',
              color: '#666',
              border: '1px solid #E8E8E3',
              padding: '8px',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 style={{
              fontSize: '32px',
              fontWeight: '400',
              color: '#2C2C2C',
              letterSpacing: '1px',
              marginBottom: '8px'
            }}>
              {dish.dish_name}
            </h1>
            <p style={{ fontSize: '14px', color: '#999' }}>
              ID: {dish.id}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <Button
            onClick={handleDelete}
            style={{
              background: '#FEF2F2',
              color: '#EF4444',
              border: '1px solid #FEE2E2',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Trash2 size={20} />
            删除菜品
          </Button>
        </div>
      </div>

      {/* 基础信息 */}
      <Card style={{ marginBottom: '24px', border: '1px solid #E8E8E3' }}>
        <CardHeader>
          <CardTitle style={{ fontSize: '20px', fontWeight: '500' }}>基础信息</CardTitle>
        </CardHeader>
        <CardContent>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '24px'
          }}>
            <InfoItem label="菜品名称" value={dish.dish_name} />
            <InfoItem label="所属门店" value={dish.store_name} />
            <InfoItem label="菜品类型" value={dish.dish_type} />
            <InfoItem label="状态" value={dish.is_active ? '有效' : '已删除'} />
            <InfoItem label="创建时间" value={formatDate(dish.created_at)} />
            {dish.common_dish_id && (
              <InfoItem label="关联通用菜品" value={`ID: ${dish.common_dish_id.substring(0, 16)}...`} />
            )}
          </div>
        </CardContent>
      </Card>

      {/* 标签信息 - 七大标签 */}
      <Card style={{ marginBottom: '24px', border: '1px solid #E8E8E3' }}>
        <CardHeader>
          <CardTitle style={{ fontSize: '20px', fontWeight: '500' }}>标签信息（只读）</CardTitle>
        </CardHeader>
        <CardContent>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '24px'
          }}>
            <InfoItem label="烹饪方式（八大法）" value={dish.cook_method8} />
            <InfoItem label="刀工" value={dish.knife_skill || '未标注'} />
            <InfoItem label="菜系" value={dish.cuisine || '未标注'} />
            <InfoItem label="口味" value={dish.flavor || '未标注'} />
            <div>
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>食材特征（原材料类）</div>
              <div style={{ fontSize: '16px', color: '#2C2C2C', fontWeight: '400' }}>
                {dish.ingredient_tags && dish.ingredient_tags.length > 0 
                  ? dish.ingredient_tags.join('、') 
                  : '未标注'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>季节</div>
              <div style={{ fontSize: '16px', color: '#2C2C2C', fontWeight: '400' }}>
                {dish.seasons && dish.seasons.length > 0 
                  ? dish.seasons.join('、') 
                  : '未标注'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 食材信息 */}
      {((dish.main_ingredients && dish.main_ingredients.length > 0) || 
        (dish.sub_ingredients && dish.sub_ingredients.length > 0)) && (
        <Card style={{ marginBottom: '24px', border: '1px solid #E8E8E3' }}>
          <CardHeader>
            <CardTitle style={{ fontSize: '20px', fontWeight: '500' }}>食材信息</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '24px'
            }}>
              {dish.main_ingredients && dish.main_ingredients.length > 0 && (
                <div>
                  <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>主料</div>
                  <div style={{ fontSize: '16px', color: '#2C2C2C', fontWeight: '400' }}>
                    {dish.main_ingredients.join('、')}
                  </div>
                </div>
              )}
              {dish.sub_ingredients && dish.sub_ingredients.length > 0 && (
                <div>
                  <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>辅料</div>
                  <div style={{ fontSize: '16px', color: '#2C2C2C', fontWeight: '400' }}>
                    {dish.sub_ingredients.join('、')}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI解析信息 */}
      {Object.keys(analysis).length > 0 && (
        <Card style={{ border: '1px solid #E8E8E3' }}>
          <CardHeader>
            <CardTitle style={{ fontSize: '20px', fontWeight: '500' }}>AI解析信息</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '24px'
            }}>
              {analysis.auto_parsed !== undefined && (
                <InfoItem 
                  label="解析方式" 
                  value={analysis.auto_parsed ? 'AI自动解析' : '人工标注'} 
                />
              )}
              {analysis.confidence !== undefined && (
                <InfoItem 
                  label="置信度" 
                  value={`${(analysis.confidence * 100).toFixed(0)}%`} 
                />
              )}
              {analysis.status && (
                <InfoItem 
                  label="数据来源" 
                  value={
                    analysis.status === 'uploaded_by_user' ? '用户上传' :
                    analysis.status === 'generated_by_system' ? '系统生成' :
                    analysis.status === 'human_verified' ? '人工验证' :
                    analysis.status
                  } 
                />
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// 信息项组件
function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>{label}</div>
      <div style={{ fontSize: '16px', color: '#2C2C2C', fontWeight: '400' }}>{value}</div>
    </div>
  );
}



