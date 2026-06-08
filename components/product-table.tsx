'use client';

import { useState, useEffect } from 'react';
import { Bill, Product } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from '@/components/ui/button';
import { LayoutGrid, List } from 'lucide-react';

const PRODUCT_TYPE_LABELS: Record<string, string> = {
  XL: 'แท่งใหญ่',
  S: 'แท่งเล็ก',
  Sandwich: 'แซนวิช',
  Cup: 'ถ้วย',
  Coffee: 'กาแฟ',
  Cone: 'โคน',
  D: 'น้ำแข็งแห้ง'
};

interface ProductTableProps {
  bill: Bill;
  products: Product[];
  mode: 'checkout' | 'return';
  readOnly?: boolean;
  onItemChange: (productId: string, field: 'newStock' | 'returned', value: number) => void;
}

export function ProductTable({ bill, products, mode, readOnly, onItemChange }: ProductTableProps) {
  const [viewMode, setViewMode] = useState<'accordion' | 'grid'>('grid'); 

  // 1. กรองสินค้าตัดเฉพาะกลุ่ม House และ Car ออก
  const filteredProducts = products.filter(
    (product) => product.type !== 'House' && product.type !== 'Car'
  );

  // 2. เรียงลำดับสินค้าตามค่า sortOrder ที่ตั้งมาจาก Database คงที่
  const sortedProducts = [...filteredProducts].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  // 3. จัดกลุ่มข้อมูลแยกตาม Type สำหรับคำนวณแถบสรุปประเภท
  const groupedProducts: Record<string, Product[]> = {};
  filteredProducts.forEach((product) => {
    const typeGroup = product.type; 
    if (!groupedProducts[typeGroup]) {
      groupedProducts[typeGroup] = [];
    }
    groupedProducts[typeGroup].push(product);
  });

  const displayOrder = ['XL', 'S', 'Coffee', 'Sandwich', 'Cup', 'Cone', 'D'];

  // --- คำนวณยอดรวมบนกลุ่ม Tab ด้านบนแบบ Real-time ตาม Input ---
  const typeTotals = displayOrder.reduce((acc, type) => {
    const typeProducts = groupedProducts[type] || [];
    let oldSum = 0;
    let inputSum = 0;

    typeProducts.forEach((product) => {
      const item = bill.items.find((i) => i.productId === product.id);
      if (item) {
        oldSum += item.oldStock || 0;
        inputSum += mode === 'checkout' ? (item.newStock || 0) : (item.returned || 0);
      }
    });

    acc[type] = { oldTotal: oldSum, inputTotal: inputSum };
    return acc;
  }, {} as Record<string, { oldTotal: number; inputTotal: number }>);

  // 4. ฟังก์ชันพิมพ์ตัวเลขลงในช่องอินพุตโดยตรง
  const handleInputChange = (productId: string, valueStr: string, maxStock: number = Infinity) => {
    if (readOnly) return;
    const finalVal = parseInt(valueStr) || 0;
    if (finalVal < 0) return;
    if (mode === 'return' && finalVal > maxStock) return;

    onItemChange(productId, mode === 'checkout' ? 'newStock' : 'returned', finalVal);
  };

  return (
    <div className="w-full space-y-4 px-1">
      {/* ส่วนหัว: ปุ่มควบคุมการสลับโหมดมุมมอง */}
      <div className="flex justify-end gap-2">
        <Button
          variant={viewMode === 'accordion' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('accordion')}
          className="gap-1.5 h-9 rounded-lg text-xs"
        >
          <List className="w-4 h-4" /> แบบกลุ่ม
        </Button>
        <Button
          variant={viewMode === 'grid' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('grid')}
          className="gap-1.5 h-9 rounded-lg text-xs"
        >
          <LayoutGrid className="w-4 h-4" /> แบบตารางภาพ
        </Button>
      </div>

      {/* ================= โหมดที่ 1: ACCORDION MODE ================= */}
      {viewMode === 'accordion' && (
        <Accordion type="multiple" defaultValue={['XL', 'S']} className="w-full space-y-3">
          {displayOrder.map((type) => {
            const typeProducts = groupedProducts[type] || [];
            if (typeProducts.length === 0) return null;

            const categoryItems = typeProducts.map((product) => {
              const item = bill.items.find((i) => i.productId === product.id) || {
                productId: product.id, oldStock: 0, newStock: 0, totalStock: 0, returned: 0, sold: 0
              };
              return { product, item };
            });

            return (
              <AccordionItem key={type} value={type} className="border rounded-xl bg-card px-4">
                <AccordionTrigger className="hover:no-underline py-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full pr-4 gap-2">
                    <span className="font-bold text-base text-foreground">
                      {PRODUCT_TYPE_LABELS[type] || `ประเภท ${type}`}
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="bg-muted text-muted-foreground text-xs px-2.5 py-0.5 rounded-full font-semibold">
                        เก่า {typeTotals[type]?.oldTotal || 0}
                      </span>
                      {typeTotals[type]?.inputTotal > 0 && (
                        <span className={cn(
                          "text-xs px-2.5 py-0.5 rounded-full font-semibold text-white",
                          mode === 'checkout' ? "bg-green-500" : "bg-amber-500"
                        )}>
                          {mode === 'checkout' ? `ใหม่ +${typeTotals[type].inputTotal}` : `คืน ${typeTotals[type].inputTotal}`}
                        </span>
                      )}
                    </div>
                  </div>
                </AccordionTrigger>

                <AccordionContent className="pt-1 pb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {categoryItems
                      .sort((a, b) => a.product.sortOrder - b.product.sortOrder)
                      .map(({ product, item }) => {
                        const currentQty = mode === 'checkout' ? (item?.newStock || 0) : (item?.returned || 0);

                        return (
                          <div
                            key={product.id}
                            className={cn(
                              "flex items-center justify-between p-3 rounded-lg border bg-muted/30 transition-colors",
                              mode === 'checkout' && (item?.newStock || 0) > 0 && 'bg-green-500/10 border-green-500 border-2',
                              mode === 'return' && (item?.returned || 0) > 0 && 'bg-amber-500/10 border-amber-500 border-2'
                            )}
                          >
                            <span className="text-sm font-medium text-foreground">{product.name}</span>
                            <Input
                              type="number"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              autoComplete="off"
                              min="0"
                              max={mode === 'return' ? item?.totalStock : undefined}
                              value={currentQty || ''}
                              onChange={(e) => handleInputChange(product.id, e.target.value, item?.totalStock)}
                              disabled={readOnly}
                              className="w-20 h-9 text-center text-sm font-semibold bg-background"
                              placeholder="0"
                            />
                          </div>
                        );
                      })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}

      {/* ================= โหมดที่ 2: GRID MODE (ลื่นไหล 100% ไร้ปัญหาระบบลาก) ================= */}
      {viewMode === 'grid' && (
        <div className="space-y-4">
          
          {/* แถบเมนู (Tab) แสดงยอดรวมแยกตามประเภท */}
          <div className="w-full bg-muted/40 border rounded-2xl p-2.5">
            <div className="text-[10px] font-bold text-muted-foreground mb-1.5 px-1">
              📊 สรุปยอดเก่าและรายการกรอกแยกตามประเภท (Type)
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-7 gap-1.5">
              {displayOrder.map((type) => {
                const totals = typeTotals[type] || { oldTotal: 0, inputTotal: 0 };
                if (!groupedProducts[type]) return null;
                
                return (
                  <div 
                    key={type} 
                    className="bg-card border rounded-lg p-1.5 flex flex-col items-center justify-center text-center shadow-sm min-w-0"
                  >
                    <span className="text-[10px] font-bold text-muted-foreground truncate w-full">
                      {PRODUCT_TYPE_LABELS[type] || type}
                    </span>
                    <div className="flex flex-col items-center justify-center mt-0.5 leading-tight">
                      <span className="text-xs font-black text-foreground">
                        {totals.oldTotal}
                      </span>
                      {totals.inputTotal > 0 && (
                        <span className={cn(
                          "text-[9px] font-extrabold mt-0.5 px-1 rounded-sm",
                          mode === 'checkout' ? "text-green-600 bg-green-50" : "text-amber-600 bg-amber-50"
                        )}>
                          {mode === 'checkout' ? `+${totals.inputTotal}` : `เหลือ ${totals.inputTotal}`}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ตารางสินค้า Grid แบบปกติ: สไลด์นิ้วเลื่อนหน้าจอได้นุ่มนวลสูงสุด ขยาย px-2 เพื่อเพิ่มร่องระยะปลอดภัยข้างจอ */}
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-1.5 sm:gap-2.5 px-2">
            {sortedProducts.map((product) => {
              const item = bill.items.find((i) => i.productId === product.id) || {
                productId: product.id, oldStock: 0, newStock: 0, totalStock: 0, returned: 0, sold: 0
              };
              const currentQty = mode === 'checkout' ? (item.newStock || 0) : (item.returned || 0);
              const isSelected = currentQty > 0;
              
              return (
                <div
                  key={product.id}
                  className={cn(
                    "relative bg-card border rounded-xl flex flex-col items-center p-1.5 pb-2 select-none group transition-all shadow-sm gap-1 min-w-0",
                    isSelected && mode === 'checkout' && "border-green-500 ring-2 ring-green-500/10 bg-green-500/[0.01]",
                    isSelected && mode === 'return' && "border-amber-500 ring-2 ring-amber-500/10 bg-amber-500/[0.01]"
                  )}
                >
                  {/* ป้ายชนิดสินค้ามุมขวาบน */}
                  <span className="absolute top-1 right-1 text-[8px] font-black bg-muted text-muted-foreground px-1 rounded">
                    {product.type}
                  </span>

                  {/* รูปภาพสินค้า */}
                  <div className="w-full flex justify-center pt-2 min-h-[40px] items-center">
                    {product.imageUrl ? (
                      <img 
                        src={product.imageUrl} 
                        alt={product.name} 
                        className="w-9 h-9 object-cover rounded-lg pointer-events-none"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <span className="text-xl select-none">🍦</span>
                    )}
                  </div>

                  {/* ชื่อสินค้า */}
                  <div className="text-[10px] font-bold text-center line-clamp-1 px-0.5 w-full text-foreground min-h-[16px] flex items-center justify-center">
                    {product.name}
                  </div>

                  {/* สต็อกเดิม */}
                  <div className="text-[9px] text-muted-foreground/80 flex gap-1 font-medium scale-90">
                    <span>เก่า:{item.oldStock}</span>
                    {mode === 'return' && <span>เบิก:{item.totalStock}</span>}
                  </div>

                  {/* ช่องกรอกจำนวนสินค้า */}
                  <div className="w-full mt-0.5">
                    <Input
                      type="number"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      autoComplete="off"
                      min="0"
                      max={mode === 'return' ? item.totalStock : undefined}
                      value={currentQty || ''}
                      onChange={(e) => handleInputChange(product.id, e.target.value, item.totalStock)}
                      disabled={readOnly}
                      placeholder="0"
                      className={cn(
                        "w-full h-7 text-center font-black text-sm rounded-lg bg-muted/40 border focus-visible:ring-1 focus-visible:ring-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none px-1",
                        isSelected && mode === 'checkout' && "bg-green-500/5 border-green-300 text-green-700",
                        isSelected && mode === 'return' && "bg-amber-500/5 border-amber-300 text-amber-700"
                      )}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}