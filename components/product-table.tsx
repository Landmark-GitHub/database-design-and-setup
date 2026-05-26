// 'use client';

// import { Bill, Product, groupProductsByCategory, PRODUCT_CATEGORY_LABELS, ProductCategory } from '@/lib/types';
// import { Input } from '@/components/ui/input';
// import { cn } from '@/lib/utils';

// interface ProductTableProps {
//   bill: Bill;
//   products: Product[];
//   mode: 'checkout' | 'return';
//   readOnly?: boolean;
//   onItemChange: (productId: string, field: 'newStock' | 'returned', value: number) => void;
// }

// export function ProductTable({ bill, products, mode, readOnly, onItemChange }: ProductTableProps) {
  
//   // 1. กรองเอาสินค้าประเภท House และ Car ออกไปเหมือนเดิม (เก็บน้ำแข็งแห้ง 'D' เอาไว้)
//   const filteredProducts = products.filter(
//     (product) => product.type !== 'House' && product.type !== 'Car'
//   );

//   // 2. 🔥 แก้ปัญหา: เปลี่ยนมาจัดกลุ่มตาม "product.type" แทน category
//   // วิธีนี้จะทำให้สินค้าแต่ละชิ้นวิ่งไปลงชื่อกลุ่มของตัวเองได้อย่างแม่นยำ
//   const groupedProducts: Record<string, Product[]> = {};
//   filteredProducts.forEach((product) => {
//     const typeGroup = product.type; 
//     if (!groupedProducts[typeGroup]) {
//       groupedProducts[typeGroup] = [];
//     }
//     groupedProducts[typeGroup].push(product);
//   });

//   // 3. 🔥 กำหนดกลุ่มที่ต้องการลูปแสดงผลบนหน้าจอ (ใส่ 'D' แทน 'null')
//   // สังเกตว่าเราใช้คำสะกด 'Sandwich' ให้ตรงกับในภาพสองแล้วนะครับ
//   const categories: string[] = ['XL', 'S', 'Coffee', 'Sandwich', 'Cup', 'Cone', 'D'];

//   const handleInputChange = (productId: string, field: 'newStock' | 'returned', value: string) => {
//     const numValue = parseInt(value) || 0;
//     if (numValue < 0) return;
//     onItemChange(productId, field, numValue);
//   };

//   return (
//     <div className="space-y-4">
//       {categories.map((category) => {
//         const categoryProducts = groupedProducts[category] || [];
//         if (categoryProducts.length === 0) return null;

//         // Get bill items for this category
//         const categoryItems = categoryProducts.map((product) => {
//           const item = bill.items.find((i) => i.productId === product.id);
//           return { product, item };
//         });

//         // Calculate category totals (ยอดรวมตรงนี้จะถูกลดลงอัตโนมัติตามสินค้าที่ถูกกรองออก)
//         const catOldTotal = categoryItems.reduce((sum, { item }) => sum + (item?.oldStock || 0), 0);
//         const catNewTotal = categoryItems.reduce((sum, { item }) => sum + (item?.newStock || 0), 0);
//         const catTotal = categoryItems.reduce((sum, { item }) => sum + (item?.totalStock || 0), 0);
//         const catReturnedTotal = categoryItems.reduce((sum, { item }) => sum + (item?.returned || 0), 0);
//         const catSoldTotal = categoryItems.reduce((sum, { item }) => sum + (item?.sold || 0), 0);

//         return (
//           <div key={category} className="bg-card rounded-lg border border-border overflow-hidden">
//             {/* Category Header with Summary */}
//             <div className="bg-muted/50 px-4 py-3 border-b border-border">
//               <h3 className="font-bold text-foreground mb-3">{PRODUCT_CATEGORY_LABELS[category]}</h3>
              
//               {mode === 'checkout' ? (
//                 // Checkout mode: เก่า | ใหม่ | รวม
//                 <div className="grid grid-cols-3 gap-4 text-center">
//                   <div>
//                     <div className="text-xs text-muted-foreground mb-1">เก่า</div>
//                     <div className="text-xl font-semibold text-muted-foreground">{catOldTotal}</div>
//                   </div>
//                   <div>
//                     <div className="text-xs text-muted-foreground mb-1">ใหม่</div>
//                     <div className="text-xl font-bold text-foreground">{catNewTotal}</div>
//                   </div>
//                   <div>
//                     <div className="text-xs text-muted-foreground mb-1">รวม</div>
//                     <div className="text-xl font-bold text-primary">{catTotal}</div>
//                   </div>
//                 </div>
//               ) : (
//                 // Return mode: รวม | เหลือ | ขาย
//                 <div className="grid grid-cols-3 gap-4 text-center">
//                   <div>
//                     <div className="text-xs text-muted-foreground mb-1">รวม</div>
//                     <div className="text-xl font-semibold text-muted-foreground">{catTotal}</div>
//                   </div>
//                   <div>
//                     <div className="text-xs text-muted-foreground mb-1">เหลือ</div>
//                     <div className="text-xl font-bold text-foreground">{catReturnedTotal}</div>
//                   </div>
//                   <div>
//                     <div className="text-xs text-muted-foreground mb-1">ขาย</div>
//                     <div className="text-xl font-bold text-primary">{catSoldTotal}</div>
//                   </div>
//                 </div>
//               )}
//             </div>

//             {/* Table Header */}
//             <div className="flex items-center justify-between px-4 py-2 bg-muted/30 text-xs font-medium text-muted-foreground border-b border-border">
//               <span>รายการ</span>
//               <span>{mode === 'checkout' ? 'จำนวนใหม่' : 'จำนวนเหลือ'}</span>
//             </div>

//             {/* Table Rows */}
//             <div className="divide-y divide-border">
//               {categoryItems.map(({ product, item }) => {
//                 if (!item) return null;

//                 return (
//                   <div
//                     key={product.id}
//                     className={cn(
//                       'flex items-center justify-between px-4 py-3',
//                       mode === 'checkout' && item.newStock > 0 && 'bg-primary/5',
//                       mode === 'return' && item.returned > 0 && 'bg-primary/5'
//                     )}
//                   >
//                     <span className="text-sm text-foreground">{product.name}</span>

//                     {mode === 'checkout' ? (
//                       <Input
//                         type="number"
//                         inputMode="numeric"
//                         min="0"
//                         value={item.newStock || ''}
//                         onChange={(e) => handleInputChange(product.id, 'newStock', e.target.value)}
//                         disabled={readOnly}
//                         className="w-20 h-9 text-center text-sm"
//                         placeholder="0"
//                       />
//                     ) : (
//                       <Input
//                         type="number"
//                         inputMode="numeric"
//                         min="0"
//                         max={item.totalStock}
//                         value={item.returned || ''}
//                         onChange={(e) => handleInputChange(product.id, 'returned', e.target.value)}
//                         disabled={readOnly}
//                         className="w-20 h-9 text-center text-sm"
//                         placeholder="0"
//                       />
//                     )}
//                   </div>
//                 );
//               })}
//             </div>
//           </div>
//         );
//       })}
//     </div>
//   );
// }

'use client';

import { Bill, Product } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// ส่วนที่เพิ่ม: ตัวแปลงชื่อภาษาไทยตามที่คุณกำหนด
const PRODUCT_TYPE_LABELS: Record<string, string> = {
  XL: 'แท่งใหญ่',
  S: 'แท่งเล็ก',
  Sandwich: 'แซนวิช',
  Cup: 'ถ้วย',
  Coffee: 'กาแฟ',
  Cone: 'โคน', // ปรับเปลี่ยนตามความเหมาะสมได้ครับ
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
  
  const filteredProducts = products.filter(
    (product) => product.type !== 'House' && product.type !== 'Car'
  );

  const groupedProducts: Record<string, Product[]> = {};
  filteredProducts.forEach((product) => {
    const typeGroup = product.type; 
    if (!groupedProducts[typeGroup]) {
      groupedProducts[typeGroup] = [];
    }
    groupedProducts[typeGroup].push(product);
  });

  // ลำดับการเรียงลำดับดึงจาก Key ของ Object
  const displayOrder = ['XL', 'S', 'Coffee','Sandwich', 'Cup', 'Cone', 'D'];

  return (
    <Accordion type="multiple" defaultValue={['XL', 'S']} className="w-full space-y-3">
      {displayOrder.map((type) => {
        const typeProducts = groupedProducts[type] || [];
        if (typeProducts.length === 0) return null;

        const categoryItems = typeProducts.map((product) => {
          const item = bill.items.find((i) => i.productId === product.id);
          return { product, item };
        });

        const catOldTotal = categoryItems.reduce((sum, { item }) => sum + (item?.oldStock || 0), 0);
        const catNewTotal = categoryItems.reduce((sum, { item }) => sum + (item?.newStock || 0), 0);
        const catTotal = categoryItems.reduce((sum, { item }) => sum + (item?.totalStock || 0), 0);
        const catReturnedTotal = categoryItems.reduce((sum, { item }) => sum + (item?.returned || 0), 0);
        const catSoldTotal = categoryItems.reduce((sum, { item }) => sum + (item?.sold || 0), 0);

        const totalItemsInGroup = categoryItems.reduce((sum, { item }) => {
          if (!item) return sum;
          return sum + (mode === 'checkout' ? (item.newStock || 0) : (item.returned || 0));
        }, 0);

        return (
          <AccordionItem key={type} value={type} className="border rounded-xl bg-card px-4">
            <AccordionTrigger className="hover:no-underline py-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full pr-4 gap-2">
                
                {/* 🔥 จุดที่แก้ไข: ดึงชื่อภาษาไทยจาก PRODUCT_TYPE_LABELS มาแสดงผล 
                  ถ้าไม่มีใน Object ให้ใช้ชื่อ type เดิม (Fallback กันพัง)
                */}
                <span className="font-bold text-base text-foreground">
                  {PRODUCT_TYPE_LABELS[type] || `ประเภท ${type}`}
                </span>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="bg-red-400 text-white text-xs px-2.5 py-0.5 rounded-full font-semibold">
                    เก่า {catOldTotal}
                  </span>

                  {mode === 'checkout' ? (
                    <>
                      <span className="bg-green-500 text-white text-xs px-2.5 py-0.5 rounded-full font-semibold">
                        ใหม่ {catNewTotal}
                      </span>
                      <span className="bg-blue-500 text-white text-xs px-2.5 py-0.5 rounded-full font-semibold">
                        รวม {catTotal}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="bg-red-400 text-white text-xs px-2.5 py-0.5 rounded-full font-semibold">
                        เหลือ {catReturnedTotal}
                      </span>
                      <span className="bg-green-500/10 text-green-600 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                        ขาย {catSoldTotal}
                      </span>
                    </>
                  )}

                  {/* {totalItemsInGroup > 0 && (
                    <span className="bg-primary/10 text-primary text-xs px-2.5 py-0.5 rounded-full font-semibold">
                      คีย์แล้ว {totalItemsInGroup} ชิ้น
                    </span>
                  )} */}
                </div>

              </div>
            </AccordionTrigger>

            <AccordionContent className="pt-1 pb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {categoryItems
                  .sort((a, b) => a.product.sortOrder - b.product.sortOrder)
                  .map(({ product, item }) => {
                    if (!item) return null;

                    return (
                      <div
                        key={product.id}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-lg border bg-muted/30 transition-colors",
                          mode === 'checkout' && item.newStock > 0 && 'bg-green-500/10 border-green-500 border-4',
                          mode === 'return' && item.returned > 0 && 'bg-amber-500/10 border-amber-500/20 border-4'
                        )}
                      >
                        <span className="text-sm font-medium text-foreground">{product.name}</span>

                        {mode === 'checkout' ? (
                          <Input
                            type="number"
                            inputMode="numeric"
                            min="0"
                            value={item.newStock || ''}
                            onChange={(e) => onItemChange(product.id, 'newStock', parseInt(e.target.value) || 0)}
                            disabled={readOnly}
                            className="w-20 h-9 text-center text-sm font-semibold"
                            placeholder="0"
                          />
                        ) : (
                          <Input
                            type="number"
                            inputMode="numeric"
                            min="0"
                            max={item.totalStock}
                            value={item.returned || ''}
                            onChange={(e) => onItemChange(product.id, 'returned', parseInt(e.target.value) || 0)}
                            disabled={readOnly}
                            className="w-20 h-9 text-center text-sm font-semibold"
                            placeholder="0"
                          />
                        )}
                      </div>
                    );
                  })}
              </div>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}