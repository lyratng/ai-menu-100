'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';
import { API_URL } from '@/lib/config';

interface AddDishDialogProps {
  onClose: () => void;
  onSuccess: () => void;
}

const DISH_TYPES = ['热菜主荤', '热菜半荤', '热菜素菜', '凉菜', '主食', '风味小吃', '汤', '酱汁', '饮料', '手工'];
const COOK_METHODS = ['炒', '熘', '蒸', '烧', '烤', '炖', '煎', '烹'];
const INGREDIENT_TAGS = ['肉', '禽', '鱼', '蛋', '豆', '菌', '筋', '蔬'];
const KNIFE_SKILLS = ['片', '丁', '粒', '米', '末', '茸', '丝', '条', '段', '块', '球', '花刀'];
const SEASONS = ['春', '夏', '秋', '冬'];

export function AddDishDialog({ onClose, onSuccess }: AddDishDialogProps) {
  const [formData, setFormData] = useState({
    dish_name: '',
    dish_type: '',
    cook_method8: '',
    ingredient_tags: [] as string[],
    knife_skill: '',
    cuisine: '',
    flavor: '',
    main_ingredients: '',
    sub_ingredients: '',
    seasons: [] as string[],
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!formData.dish_name || !formData.dish_type || !formData.cook_method8) {
      alert('请填写所有必填字段（标注*的）');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_URL}/api/admin/dishes/common`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          main_ingredients: formData.main_ingredients ? formData.main_ingredients.split(',').map(s => s.trim()) : [],
          sub_ingredients: formData.sub_ingredients ? formData.sub_ingredients.split(',').map(s => s.trim()) : [],
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || '添加失败');
      }

      alert('添加成功！');
      onSuccess();
      onClose();
    } catch (error: any) {
      alert(error.message || '添加失败');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleArrayItem = (field: 'ingredient_tags' | 'seasons', value: string) => {
    const currentArray = formData[field];
    setFormData({
      ...formData,
      [field]: currentArray.includes(value)
        ? currentArray.filter(item => item !== value)
        : [...currentArray, value],
    });
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
        maxWidth: '800px',
        width: '90%',
        maxHeight: '90vh',
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
          position: 'sticky',
          top: 0,
          background: '#FFFFFF',
          zIndex: 1,
        }}>
          <h2 style={{ fontSize: '24px', fontWeight: '400', color: '#2C2C2C' }}>
            新增通用菜品
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

        {/* 表单区 */}
        <div style={{ padding: '24px' }}>
          <div style={{ display: 'grid', gap: '24px' }}>
            {/* 菜品名称 */}
            <div>
              <label style={{ display: 'block', fontSize: '14px', color: '#666', marginBottom: '8px' }}>
                菜品名称 <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <Input
                value={formData.dish_name}
                onChange={(e) => setFormData({ ...formData, dish_name: e.target.value })}
                placeholder="如：宫保鸡丁"
                style={{ border: '1px solid #E8E8E3', borderRadius: '8px', padding: '12px' }}
              />
            </div>

            {/* 菜品类型 */}
            <div>
              <label style={{ display: 'block', fontSize: '14px', color: '#666', marginBottom: '8px' }}>
                菜品类型 <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <select
                value={formData.dish_type}
                onChange={(e) => setFormData({ ...formData, dish_type: e.target.value })}
                style={{
                  width: '100%',
                  border: '1px solid #E8E8E3',
                  borderRadius: '8px',
                  padding: '12px',
                  fontSize: '14px',
                }}
              >
                <option value="">请选择</option>
                {DISH_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* 烹饪方式 */}
            <div>
              <label style={{ display: 'block', fontSize: '14px', color: '#666', marginBottom: '8px' }}>
                烹饪方式（8大法） <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <select
                value={formData.cook_method8}
                onChange={(e) => setFormData({ ...formData, cook_method8: e.target.value })}
                style={{
                  width: '100%',
                  border: '1px solid #E8E8E3',
                  borderRadius: '8px',
                  padding: '12px',
                  fontSize: '14px',
                }}
              >
                <option value="">请选择</option>
                {COOK_METHODS.map(method => (
                  <option key={method} value={method}>{method}</option>
                ))}
              </select>
            </div>

            {/* 食材特征（多选） */}
            <div>
              <label style={{ display: 'block', fontSize: '14px', color: '#666', marginBottom: '8px' }}>
                食材特征（可多选）
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {INGREDIENT_TAGS.map(tag => (
                  <label
                    key={tag}
                    style={{
                      padding: '8px 16px',
                      border: `2px solid ${formData.ingredient_tags.includes(tag) ? '#2C2C2C' : '#E8E8E3'}`,
                      borderRadius: '20px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      background: formData.ingredient_tags.includes(tag) ? '#FAFAFA' : '#FFFFFF',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={formData.ingredient_tags.includes(tag)}
                      onChange={() => toggleArrayItem('ingredient_tags', tag)}
                      style={{ marginRight: '4px' }}
                    />
                    {tag}
                  </label>
                ))}
              </div>
            </div>

            {/* 刀工 */}
            <div>
              <label style={{ display: 'block', fontSize: '14px', color: '#666', marginBottom: '8px' }}>
                刀工
              </label>
              <select
                value={formData.knife_skill}
                onChange={(e) => setFormData({ ...formData, knife_skill: e.target.value })}
                style={{
                  width: '100%',
                  border: '1px solid #E8E8E3',
                  borderRadius: '8px',
                  padding: '12px',
                  fontSize: '14px',
                }}
              >
                <option value="">请选择</option>
                {KNIFE_SKILLS.map(skill => (
                  <option key={skill} value={skill}>{skill}</option>
                ))}
              </select>
            </div>

            {/* 菜系 */}
            <div>
              <label style={{ display: 'block', fontSize: '14px', color: '#666', marginBottom: '8px' }}>
                菜系
              </label>
              <Input
                value={formData.cuisine}
                onChange={(e) => setFormData({ ...formData, cuisine: e.target.value })}
                placeholder="如：川菜、粤菜、鲁菜等"
                style={{ border: '1px solid #E8E8E3', borderRadius: '8px', padding: '12px' }}
              />
            </div>

            {/* 口味 */}
            <div>
              <label style={{ display: 'block', fontSize: '14px', color: '#666', marginBottom: '8px' }}>
                口味
              </label>
              <Input
                value={formData.flavor}
                onChange={(e) => setFormData({ ...formData, flavor: e.target.value })}
                placeholder="如：辣、酸甜、清淡等"
                style={{ border: '1px solid #E8E8E3', borderRadius: '8px', padding: '12px' }}
              />
            </div>

            {/* 主料 */}
            <div>
              <label style={{ display: 'block', fontSize: '14px', color: '#666', marginBottom: '8px' }}>
                主料（多个用逗号分隔）
              </label>
              <Input
                value={formData.main_ingredients}
                onChange={(e) => setFormData({ ...formData, main_ingredients: e.target.value })}
                placeholder="如：鸡胸肉,花生"
                style={{ border: '1px solid #E8E8E3', borderRadius: '8px', padding: '12px' }}
              />
            </div>

            {/* 辅料 */}
            <div>
              <label style={{ display: 'block', fontSize: '14px', color: '#666', marginBottom: '8px' }}>
                辅料（多个用逗号分隔）
              </label>
              <Input
                value={formData.sub_ingredients}
                onChange={(e) => setFormData({ ...formData, sub_ingredients: e.target.value })}
                placeholder="如：青椒,干辣椒,葱,姜,蒜"
                style={{ border: '1px solid #E8E8E3', borderRadius: '8px', padding: '12px' }}
              />
            </div>

            {/* 季节（多选） */}
            <div>
              <label style={{ display: 'block', fontSize: '14px', color: '#666', marginBottom: '8px' }}>
                适合季节（可多选）
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {SEASONS.map(season => (
                  <label
                    key={season}
                    style={{
                      padding: '8px 16px',
                      border: `2px solid ${formData.seasons.includes(season) ? '#2C2C2C' : '#E8E8E3'}`,
                      borderRadius: '20px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      background: formData.seasons.includes(season) ? '#FAFAFA' : '#FFFFFF',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={formData.seasons.includes(season)}
                      onChange={() => toggleArrayItem('seasons', season)}
                      style={{ marginRight: '4px' }}
                    />
                    {season}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* 按钮 */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #E8E8E3' }}>
            <Button
              onClick={onClose}
              style={{
                flex: 1,
                background: '#FFFFFF',
                color: '#2C2C2C',
                border: '1px solid #E8E8E3',
                padding: '12px',
                borderRadius: '8px',
              }}
            >
              取消
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              style={{
                flex: 1,
                background: submitting ? '#CCC' : '#2C2C2C',
                color: '#FFFFFF',
                border: 'none',
                padding: '12px',
                borderRadius: '8px',
                cursor: submitting ? 'not-allowed' : 'pointer',
              }}
            >
              {submitting ? '提交中...' : '确认添加'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

