// 'use client';

// import { useState } from 'react';
// import { useStore } from '@/lib/store';
// import { Product, ProductType, PRODUCT_TYPE_LABELS } from '@/lib/types';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from '@/components/ui/select';
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
// } from '@/components/ui/dialog';
// import {
//   AlertDialog,
//   AlertDialogAction,
//   AlertDialogCancel,
//   AlertDialogContent,
//   AlertDialogDescription,
//   AlertDialogFooter,
//   AlertDialogHeader,
//   AlertDialogTitle,
// } from '@/components/ui/alert-dialog';
// import {
//   Accordion,
//   AccordionContent,
//   AccordionItem,
//   AccordionTrigger,
// } from '@/components/ui/accordion';
// import { Plus, Pencil, Trash2 } from 'lucide-react';
// import { cn } from '@/lib/utils';

// interface ProductFormData {
//   name: string;
//   type: ProductType;
//   priceIn: number;
//   priceOut: number;
//   priceWalkIn: number;
// }

// const defaultFormData: ProductFormData = {
//   name: '',
//   type: 'XL',
//   priceIn: 0,
//   priceOut: 0,
//   priceWalkIn: 0,
// };

// export function ProductSettings() {
//   const {products, addProduct, updateProduct, deleteProduct } = useStore();
//   const [isDialogOpen, setIsDialogOpen] = useState(false);
//   const [editingProduct, setEditingProduct] = useState<Product | null>(null);
//   const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
//   const [formData, setFormData] = useState<ProductFormData>(defaultFormData);

//   // Group products by type
//   const groupedProducts = products.reduce((acc, product) => {
//     if (!acc[product.type]) {
//       acc[product.type] = [];
//     }
//     acc[product.type].push(product);
//     return acc;
//   }, {} as Record<ProductType, Product[]>);

//   const handleOpenAdd = () => {
//     setEditingProduct(null);
//     setFormData(defaultFormData);
//     setIsDialogOpen(true);
//   };

//   const handleOpenEdit = (product: Product) => {
//     setEditingProduct(product);
//     setFormData({
//       name: product.name,
//       type: product.type,
//       priceIn: product.priceIn,
//       priceOut: product.priceOut,
//       priceWalkIn: product.priceWalkIn,
//     });
//     setIsDialogOpen(true);
//   };

//   const handleSave = () => {
//     if (!formData.name.trim()) return;

//     if (editingProduct) {
//       updateProduct(editingProduct.id, formData);
//     } else {
//       addProduct(formData);
//     }

//     setIsDialogOpen(false);
//     setFormData(defaultFormData);
//     setEditingProduct(null);
//   };

//   const handleDelete = () => {
//     if (deleteTarget) {
//       deleteProduct(deleteTarget.id);
//       setDeleteTarget(null);
//     }
//   };

//   const productTypes = Object.keys(PRODUCT_TYPE_LABELS) as ProductType[];

//   return (
//     <Card>
//       <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
//         <CardTitle className="text-base font-semibold">สินค้า ({products.length})</CardTitle>
//         <Button size="sm" onClick={handleOpenAdd}>
//           <Plus className="w-4 h-4 mr-1" />
//           เพิ่ม
//         </Button>
//       </CardHeader>
//       <CardContent>
//         {products.length === 0 ? (
//           <p className="text-sm text-muted-foreground text-center py-4">
//             ยังไม่มีสินค้า กดปุ่มเพิ่มเพื่อเริ่มต้น
//           </p>
//         ) : (
//           <Accordion type="multiple" defaultValue={productTypes} className="w-full">
//             {productTypes.map((type) => {
//               const typeProducts = groupedProducts[type] || [];
//               if (typeProducts.length === 0) return null;

//               return (
//                 <AccordionItem key={type} value={type}>
//                   <AccordionTrigger className="text-sm font-medium">
//                     {PRODUCT_TYPE_LABELS[type]} ({typeProducts.length})
//                   </AccordionTrigger>
//                   <AccordionContent>
//                     <div className="space-y-2">
//                       {typeProducts.map((product) => (
//                         <div
//                           key={product.id}
//                           className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
//                         >
//                           <div className="flex-1 min-w-0">
//                             <p className="font-medium text-foreground">{product.name}</p>
//                             <div className="flex flex-wrap gap-2 mt-1 text-xs text-muted-foreground">
//                               <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
//                                 In: {product.priceIn}
//                               </span>
//                               <span className="bg-orange-50 text-orange-700 px-2 py-0.5 rounded">
//                                 Out: {product.priceOut}
//                               </span>
//                               <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded">
//                                 WalkIn: {product.priceWalkIn}
//                               </span>
//                             </div>
//                           </div>
//                           <div className="flex items-center gap-1 ml-2">
//                             <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(product)}>
//                               <Pencil className="w-4 h-4" />
//                             </Button>
//                             <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(product)}>
//                               <Trash2 className="w-4 h-4 text-destructive" />
//                             </Button>
//                           </div>
//                         </div>
//                       ))}
//                     </div>
//                   </AccordionContent>
//                 </AccordionItem>
//               );
//             })}
//           </Accordion>
//         )}
//       </CardContent>

//       {/* Add/Edit Dialog */}
//       <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
//         <DialogContent>
//           <DialogHeader>
//             <DialogTitle>{editingProduct ? 'แก้ไขสินค้า' : 'เพิ่มสินค้า'}</DialogTitle>
//             <DialogDescription>
//               กรอกข้อมูลสินค้าให้ครบถ้วน
//             </DialogDescription>
//           </DialogHeader>
//           <div className="space-y-4 py-4">
//             <div className="space-y-2">
//               <Label htmlFor="productName">ชื่อสินค้า</Label>
//               <Input
//                 id="productName"
//                 value={formData.name}
//                 onChange={(e) => setFormData({ ...formData, name: e.target.value })}
//                 placeholder="กรอกชื่อสินค้า"
//               />
//             </div>

//             <div className="space-y-2">
//               <Label>ประเภท</Label>
//               <Select
//                 value={formData.type}
//                 onValueChange={(value: ProductType) =>
//                   setFormData({ ...formData, type: value })
//                 }
//               >
//                 <SelectTrigger>
//                   <SelectValue />
//                 </SelectTrigger>
//                 <SelectContent>
//                   {productTypes.map((type) => (
//                     <SelectItem key={type} value={type}>
//                       {PRODUCT_TYPE_LABELS[type]}
//                     </SelectItem>
//                   ))}
//                 </SelectContent>
//               </Select>
//             </div>

//             <div className="grid grid-cols-3 gap-3">
//               <div className="space-y-2">
//                 <Label htmlFor="priceIn" className="text-xs">
//                   Price In (บ้าน/รถ)
//                 </Label>
//                 <Input
//                   id="priceIn"
//                   type="number"
//                   step="0.5"
//                   min="0"
//                   value={formData.priceIn}
//                   onChange={(e) =>
//                     setFormData({ ...formData, priceIn: parseFloat(e.target.value) || 0 })
//                   }
//                 />
//               </div>
//               <div className="space-y-2">
//                 <Label htmlFor="priceOut" className="text-xs">
//                   Price Out
//                 </Label>
//                 <Input
//                   id="priceOut"
//                   type="number"
//                   step="0.5"
//                   min="0"
//                   value={formData.priceOut}
//                   onChange={(e) =>
//                     setFormData({ ...formData, priceOut: parseFloat(e.target.value) || 0 })
//                   }
//                 />
//               </div>
//               <div className="space-y-2">
//                 <Label htmlFor="priceWalkIn" className="text-xs">
//                   Price WalkIn
//                 </Label>
//                 <Input
//                   id="priceWalkIn"
//                   type="number"
//                   step="0.5"
//                   min="0"
//                   value={formData.priceWalkIn}
//                   onChange={(e) =>
//                     setFormData({ ...formData, priceWalkIn: parseFloat(e.target.value) || 0 })
//                   }
//                 />
//               </div>
//             </div>
//           </div>
//           <DialogFooter>
//             <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
//               ยกเลิก
//             </Button>
//             <Button onClick={handleSave} disabled={!formData.name.trim()}>
//               {editingProduct ? 'บันทึก' : 'เพิ่ม'}
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>

//       {/* Delete Confirmation */}
//       <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
//         <AlertDialogContent>
//           <AlertDialogHeader>
//             <AlertDialogTitle>ยืนยันการลบ</AlertDialogTitle>
//             <AlertDialogDescription>
//               คุณต้องการลบสินค้า &quot;{deleteTarget?.name}&quot; ใช่หรือไม่?
//               การกระทำนี้ไม่สามารถย้อนกลับได้
//             </AlertDialogDescription>
//           </AlertDialogHeader>
//           <AlertDialogFooter>
//             <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
//             <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
//               ลบ
//             </AlertDialogAction>
//           </AlertDialogFooter>
//         </AlertDialogContent>
//       </AlertDialog>
//     </Card>
//   );
// }


'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { Product, ProductType, PRODUCT_TYPE_LABELS } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Plus, Pencil, Trash2, DollarSign } from 'lucide-react';

interface ProductFormData {
  name: string;
  type: string; // เปลี่ยนเป็น string เพื่อรองรับการพิมพ์ประเภทใหม่
  isCustomType: boolean;
  customTypeName?: string;
}

interface PriceCategoryFormData {
  type: string;
  priceIn: number;
  priceOut: number;
  priceWalkIn: number;
}

export function ProductSettings() {
  const { products, addProduct, updateProduct, deleteProduct, updatePricesByType } = useStore();
  
  // State สำหรับจัดการ Dialog ของสินค้า
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productFormData, setProductFormData] = useState<ProductFormData>({
    name: '',
    type: 'XL',
    isCustomType: false,
    customTypeName: '',
  });

  // State สำหรับจัดการ Dialog แก้ไขราคารายหมวดหมู่
  const [isPriceDialogOpen, setIsPriceDialogOpen] = useState(false);
  const [priceFormData, setPriceFormData] = useState<PriceCategoryFormData>({
    type: '',
    priceIn: 0,
    priceOut: 0,
    priceWalkIn: 0,
  });

  // State สำหรับการลบ
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  // ดึงหมวดหมู่ทั้งหมดที่มีอยู่จริงในระบบ (รวมถึงประเภทเก่าและประเภทที่ผู้ใช้ custom เพิ่มเข้ามา)
  const existingTypes = Array.from(new Set(products.map((p) => p.type)));
  
  // รวมป้ายชื่อ (Labels) สำหรับการแสดงผลหน้าจอ
  const getTypeLabel = (type: string) => {
    return PRODUCT_TYPE_LABELS[type as ProductType] || type;
  };

  // จัดกลุ่มสินค้าตามประเภท
  const groupedProducts = products.reduce((acc, product) => {
    if (!acc[product.type]) {
      acc[product.type] = [];
    }
    acc[product.type].push(product);
    return acc;
  }, {} as Record<string, Product[]>);

  // --- จัดการสินค้า (Add / Edit Product Name) ---
  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setProductFormData({
      name: '',
      type: existingTypes[0] || 'XL',
      isCustomType: false,
      customTypeName: '',
    });
    setIsProductDialogOpen(true);
  };

  const handleOpenEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductFormData({
      name: product.name,
      type: product.type,
      isCustomType: false,
      customTypeName: '',
    });
    setIsProductDialogOpen(true);
  };

  const handleSaveProduct = () => {
    if (!productFormData.name.trim()) return;

    // คำนวณหาชื่อประเภทสินค้าที่จะใช้บันทึก
    const finalType = productFormData.isCustomType 
      ? (productFormData.customTypeName?.trim() || 'General')
      : productFormData.type;

    if (editingProduct) {
      // คัดลอกราคาเดิมมาด้วยตอนแก้ไขเฉพาะชื่อสินค้า
      updateProduct(editingProduct.id, {
        name: productFormData.name,
        type: finalType,
        priceIn: editingProduct.priceIn,
        priceOut: editingProduct.priceOut,
        priceWalkIn: editingProduct.priceWalkIn,
      });
    } else {
      // ค้นหาว่าในหมวดหมู่นี้มีราคาตั้งต้นอยู่แล้วหรือไม่ เพื่อให้ราคาสินค้าชิ้นใหม่เท่ากับเพื่อนในกลุ่ม
      const sameTypeProduct = products.find(p => p.type === finalType);
      
      addProduct({
        name: productFormData.name,
        type: finalType,
        priceIn: sameTypeProduct ? sameTypeProduct.priceIn : 0,
        priceOut: sameTypeProduct ? sameTypeProduct.priceOut : 0,
        priceWalkIn: sameTypeProduct ? sameTypeProduct.priceWalkIn : 0,
      });
    }

    setIsProductDialogOpen(false);
  };

  // --- จัดการแก้ไขราคารายหมวดหมู่ (Edit Prices By Category) ---
  const handleOpenEditPrice = (type: string) => {
    const typeProducts = groupedProducts[type] || [];
    // ดึงราคาตัวอย่างจากสินค้าตัวแรกในหมวดหมู่
    const sampleProduct = typeProducts[0];

    setPriceFormData({
      type: type,
      priceIn: sampleProduct ? sampleProduct.priceIn : 0,
      priceOut: sampleProduct ? sampleProduct.priceOut : 0,
      priceWalkIn: sampleProduct ? sampleProduct.priceWalkIn : 0,
    });
    setIsPriceDialogOpen(true);
  };

  const handleSavePrice = () => {
    // เรียกฟังก์ชันเพื่ออัปเดตราคาทั้งหมดของสินค้ารายประเภทใน Store/JSON
    if (updatePricesByType) {
      updatePricesByType(priceFormData.type, {
        priceIn: priceFormData.priceIn,
        priceOut: priceFormData.priceOut,
        priceWalkIn: priceFormData.priceWalkIn,
      });
    } else {
      // กรณีฟังก์ชันเฉพาะเจาะจงไม่มี ให้วนลูป updateProduct รายตัวแทน
      const targets = groupedProducts[priceFormData.type] || [];
      targets.forEach(product => {
        updateProduct(product.id, {
          ...product,
          priceIn: priceFormData.priceIn,
          priceOut: priceFormData.priceOut,
          priceWalkIn: priceFormData.priceWalkIn,
        });
      });
    }
    setIsPriceDialogOpen(false);
  };

  const handleDelete = () => {
    if (deleteTarget) {
      deleteProduct(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-base font-semibold">สินค้า ({products.length})</CardTitle>
        <Button size="sm" onClick={handleOpenAddProduct}>
          <Plus className="w-4 h-4 mr-1" />
          เพิ่มสินค้า
        </Button>
      </CardHeader>
      <CardContent>
        {products.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            ยังไม่มีสินค้า กดปุ่มเพิ่มเพื่อเริ่มต้น
          </p>
        ) : (
          <Accordion type="multiple" defaultValue={existingTypes} className="w-full">
            {existingTypes.map((type) => {
              const typeProducts = groupedProducts[type] || [];
              if (typeProducts.length === 0) return null;
              
              const sample = typeProducts[0];

              return (
                <AccordionItem key={type} value={type} className="border-b">
                  <div className="flex items-center justify-between pr-2">
                    <AccordionTrigger className="text-sm font-medium flex-1 py-4 hover:no-underline">
                      <div className="flex items-center justify-between w-full text-left pr-4">
                        <span>{getTypeLabel(type)} ({typeProducts.length})</span>
                        {/* แสดงราคารวมประจำหมวดหมู่ตรงหัวข้อ */}
                        <div className="hidden sm:flex gap-3 text-xs text-muted-foreground ml-auto">
                          <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded">In: {sample?.priceIn}</span>
                          <span className="bg-orange-50 text-orange-700 px-2 py-0.5 rounded">Out: {sample?.priceOut}</span>
                          <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded">WalkIn: {sample?.priceWalkIn}</span>
                        </div>
                      </div>
                    </AccordionTrigger>
                    
                    {/* ปุ่มสำหรับแก้ไขราคาทั้งหมวดหมู่ */}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-8 gap-1 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEditPrice(type);
                      }}
                    >
                      <DollarSign className="w-3.5 h-3.5" />
                      แก้ไขราคาหมวดหมู่
                    </Button>
                  </div>

                  <AccordionContent className="pt-1 pb-4">
                    <div className="space-y-2 pl-2">
                      {typeProducts.map((product) => (
                        <div
                          key={product.id}
                          className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground text-sm">{product.name}</p>
                          </div>
                          <div className="flex items-center gap-1 ml-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenEditProduct(product)}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteTarget(product)}>
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
      </CardContent>

      {/* --- Dialog สำหรับ เพิ่ม/แก้ไข ชื่อและประเภทสินค้า --- */}
      <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'แก้ไขข้อมูลสินค้า' : 'เพิ่มสินค้าใหม่'}</DialogTitle>
            <DialogDescription>กรอกชื่อสินค้าและเลือกหมวดหมู่ที่ต้องการ</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="productName">ชื่อสินค้า</Label>
              <Input
                id="productName"
                value={productFormData.name}
                onChange={(e) => setProductFormData({ ...productFormData, name: e.target.value })}
                placeholder="กรอกชื่อสินค้า"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>ประเภทสินค้า</Label>
                <button
                  type="button"
                  className="text-xs text-blue-600 hover:underline"
                  onClick={() => setProductFormData({ 
                    ...productFormData, 
                    isCustomType: !productFormData.isCustomType 
                  })}
                >
                  {productFormData.isCustomType ? 'เลือกจากที่มีอยู่' : '+ เพิ่มประเภทใหม่'}
                </button>
              </div>

              {productFormData.isCustomType ? (
                <Input
                  value={productFormData.customTypeName || ''}
                  onChange={(e) => setProductFormData({ ...productFormData, customTypeName: e.target.value })}
                  placeholder="พิมพ์ชื่อประเภทสินค้าใหม่ เช่น XXL, ล้างรถ"
                />
              ) : (
                <Select
                  value={productFormData.type}
                  onValueChange={(value) => setProductFormData({ ...productFormData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกหมวดหมู่" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* แสดงป้ายเริ่มต้นร่วมกับประเภท Custom เดิมที่มีอยู่ในระบบ */}
                    {Array.from(new Set([...Object.keys(PRODUCT_TYPE_LABELS), ...existingTypes])).map((type) => (
                      <SelectItem key={type} value={type}>
                        {getTypeLabel(type)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsProductDialogOpen(false)}>ยกเลิก</Button>
            <Button 
              onClick={handleSaveProduct} 
              disabled={!productFormData.name.trim() || (productFormData.isCustomType && !productFormData.customTypeName?.trim())}
            >
              {editingProduct ? 'บันทึก' : 'เพิ่ม'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- Dialog สำหรับ แก้ไขราคาตามหมวดหมู่ (Batch Update) --- */}
      <Dialog open={isPriceDialogOpen} onOpenChange={setIsPriceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>แก้ไขราคาประจำหมวดหมู่: {getTypeLabel(priceFormData.type)}</DialogTitle>
            <DialogDescription>
              การแก้ไขราคาที่นี่ จะมีผลกับสินค้าทุกชิ้นที่อยู่ในหมวดหมู่นี้ทันที
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-3 py-4">
            <div className="space-y-2">
              <Label htmlFor="bulkPriceIn" className="text-xs">Price In (บ้าน/รถ)</Label>
              <Input
                id="bulkPriceIn"
                type="number"
                step="0.5"
                min="0"
                value={priceFormData.priceIn}
                onChange={(e) => setPriceFormData({ ...priceFormData, priceIn: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bulkPriceOut" className="text-xs">Price Out</Label>
              <Input
                id="bulkPriceOut"
                type="number"
                step="0.5"
                min="0"
                value={priceFormData.priceOut}
                onChange={(e) => setPriceFormData({ ...priceFormData, priceOut: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bulkPriceWalkIn" className="text-xs">Price WalkIn</Label>
              <Input
                id="bulkPriceWalkIn"
                type="number"
                step="0.5"
                min="0"
                value={priceFormData.priceWalkIn}
                onChange={(e) => setPriceFormData({ ...priceFormData, priceWalkIn: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPriceDialogOpen(false)}>ยกเลิก</Button>
            <Button onClick={handleSavePrice}>บันทึกราคาหมวดหมู่</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบ</AlertDialogTitle>
            <AlertDialogDescription>
              คุณต้องการลบสินค้า &quot;{deleteTarget?.name}&quot; ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              ลบ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}