'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface DishItem {
  dish_id: string;
  dish_name: string;
  dish_type: string;
  tags?: any;
  description?: string;
  cookingMethod?: string;
}

interface DayMenu {
  day_label: string;
  lunch: DishItem[];
}

interface MenuDialogProps {
  isOpen: boolean;
  onClose: () => void;
  menuData: {
    menu_id: string;
    menu_items_json: {
      days: DayMenu[];
    };
  };
}

const MenuDialog: React.FC<MenuDialogProps> = ({ isOpen, onClose, menuData }) => {
  const [selectedDish, setSelectedDish] = React.useState<DishItem | null>(null);

  if (!isOpen) return null;

  const days = menuData.menu_items_json.days || [];

  // 按菜品类型分组 - 符合PRD的4分类
  const groupByDishType = (dishes: DishItem[]) => {
    const groups: Record<string, DishItem[]> = {
      '主荤': [],
      '半荤': [],
      '素菜': [],
      '凉菜': [],
    };

    dishes.forEach((dish) => {
      const type = dish.dish_type || 'unknown';
      console.log('菜品类型:', dish.dish_name, type); // 调试日志
      
      // 映射数据库字段到显示名称（符合PRD）
      if (type === '热菜主荤') {
        groups['主荤'].push(dish);
      } else if (type === '热菜半荤') {
        groups['半荤'].push(dish);
      } else if (type === '热菜素菜') {
        groups['素菜'].push(dish);
      } else if (type === '凉菜') {
        groups['凉菜'].push(dish);
      } else {
        // 兼容旧数据：hot_dish -> 主荤, cold_dish -> 凉菜
        if (type === 'hot_dish') {
          groups['主荤'].push(dish);
        } else if (type === 'cold_dish') {
          groups['凉菜'].push(dish);
        } else {
          // 未知类型，默认放到主荤
          console.warn('未知菜品类型:', dish.dish_name, type);
          groups['主荤'].push(dish);
        }
      }
    });

    console.log('分组结果:', groups); // 调试日志
    return groups;
  };

  // 下载Excel
  const handleDownloadExcel = () => {
    alert('下载Excel功能待实现');
  };

  return (
    <>
      {/* 遮罩层 */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      
      {/* 弹窗主体 */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-6xl max-h-[90vh] overflow-auto bg-white">
          {/* 标题栏 */}
          <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800">
              🍱 一周午餐菜单
            </h2>
            <div className="flex gap-2">
              <Button
                onClick={handleDownloadExcel}
                className="bg-green-500 hover:bg-green-600"
              >
                📥 下载Excel
              </Button>
              <Button
                onClick={onClose}
                variant="outline"
              >
                ✕ 关闭
              </Button>
            </div>
          </div>

          {/* 菜单表格 */}
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700 w-32">
                      类别
                    </th>
                    {days.map((day, index) => (
                      <th 
                        key={index}
                        className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-700"
                      >
                        {day.day_label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {['主荤', '半荤', '素菜', '凉菜'].map((dishType) => (
                    <tr key={dishType} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-3 font-medium text-gray-700 bg-gray-50">
                        {dishType}
                      </td>
                      {days.map((day, dayIndex) => {
                        const groups = groupByDishType(day.lunch);
                        const dishesInType = groups[dishType] || [];
                        
                        return (
                          <td 
                            key={dayIndex}
                            className="border border-gray-300 px-2 py-2"
                          >
                            <div className="space-y-1">
                              {dishesInType.length > 0 ? (
                                dishesInType.map((dish, dishIndex) => (
                                  <button
                                    key={dishIndex}
                                    onClick={() => setSelectedDish(dish)}
                                    className="block w-full text-left px-3 py-2 rounded hover:bg-blue-50 hover:text-blue-600 transition-colors text-sm"
                                  >
                                    {dish.dish_name}
                                  </button>
                                ))
                              ) : (
                                <span className="text-gray-400 text-sm px-3">-</span>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      </div>

      {/* 菜品详情弹窗 */}
      {selectedDish && (
        <>
          <div 
            className="fixed inset-0 bg-black bg-opacity-60 z-60"
            onClick={() => setSelectedDish(null)}
          />
          <div className="fixed inset-0 z-70 flex items-center justify-center p-4">
            <Card className="w-full max-w-2xl bg-white p-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">
                {selectedDish.dish_name}
              </h3>
              
              {/* 标签信息 */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-600 mb-2">菜品信息</h4>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                    {selectedDish.dish_type || '类型未知'}
                  </span>
                  {selectedDish.tags ? (
                    Object.entries(selectedDish.tags).map(([key, value]) => (
                      <span 
                        key={key}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                      >
                        {String(value)}
                      </span>
                    ))
                  ) : (
                    <span className="px-3 py-1 bg-gray-200 text-gray-500 rounded-full text-sm">
                      标签信息缺失
                    </span>
                  )}
                </div>
              </div>

              {/* 简介 */}
              {selectedDish.description ? (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-600 mb-2">菜品简介</h4>
                  <p className="text-gray-700 leading-relaxed">
                    {selectedDish.description}
                  </p>
                </div>
              ) : (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-600 mb-2">菜品简介</h4>
                  <p className="text-gray-400">暂无简介</p>
                </div>
              )}

              {/* 烹饪方法 */}
              {selectedDish.cookingMethod ? (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-600 mb-2">烹饪方法</h4>
                  <p className="text-gray-700 leading-relaxed">
                    {selectedDish.cookingMethod}
                  </p>
                </div>
              ) : (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-600 mb-2">烹饪方法</h4>
                  <p className="text-gray-400">暂无烹饪方法</p>
                </div>
              )}

              <Button
                onClick={() => setSelectedDish(null)}
                className="w-full mt-4"
              >
                关闭
              </Button>
            </Card>
          </div>
        </>
      )}
    </>
  );
};

export default MenuDialog;

