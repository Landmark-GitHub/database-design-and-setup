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
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductFormData {
  name: string;
  type: ProductType;
  priceIn: number;
  priceOut: number;
  priceWalkIn: number;
}

const defaultFormData: ProductFormData = {
  name: '',
  type: 'XL',
  priceIn: 0,
  priceOut: 0,
  priceWalkIn: 0,
};

export function ProductSettings() {
  const {products, addProduct, updateProduct, deleteProduct } = useStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(defaultFormData);

  // Group products by type
  const groupedProducts = products.reduce((acc, product) => {
    if (!acc[product.type]) {
      acc[product.type] = [];
    }
    acc[product.type].push(product);
    return acc;
  }, {} as Record<ProductType, Product[]>);

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData(defaultFormData);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      type: product.type,
      priceIn: product.priceIn,
      priceOut: product.priceOut,
      priceWalkIn: product.priceWalkIn,
    });
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.name.trim()) return;

    if (editingProduct) {
      updateProduct(editingProduct.id, formData);
    } else {
      addProduct(formData);
    }

    setIsDialogOpen(false);
    setFormData(defaultFormData);
    setEditingProduct(null);
  };

  const handleDelete = () => {
    if (deleteTarget) {
      deleteProduct(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  const productTypes = Object.keys(PRODUCT_TYPE_LABELS) as ProductType[];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-base font-semibold">สินค้า ({products.length})</CardTitle>
        <Button size="sm" onClick={handleOpenAdd}>
          <Plus className="w-4 h-4 mr-1" />
          เพิ่ม
        </Button>
      </CardHeader>
      <CardContent>
        {products.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            ยังไม่มีสินค้า กดปุ่มเพิ่มเพื่อเริ่มต้น
          </p>
        ) : (
          <Accordion type="multiple" defaultValue={productTypes} className="w-full">
            {productTypes.map((type) => {
              const typeProducts = groupedProducts[type] || [];
              if (typeProducts.length === 0) return null;

              return (
                <AccordionItem key={type} value={type}>
                  <AccordionTrigger className="text-sm font-medium">
                    {PRODUCT_TYPE_LABELS[type]} ({typeProducts.length})
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2">
                      {typeProducts.map((product) => (
                        <div
                          key={product.id}
                          className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground">{product.name}</p>
                            <div className="flex flex-wrap gap-2 mt-1 text-xs text-muted-foreground">
                              <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                                In: {product.priceIn}
                              </span>
                              <span className="bg-orange-50 text-orange-700 px-2 py-0.5 rounded">
                                Out: {product.priceOut}
                              </span>
                              <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded">
                                WalkIn: {product.priceWalkIn}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 ml-2">
                            <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(product)}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(product)}>
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

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'แก้ไขสินค้า' : 'เพิ่มสินค้า'}</DialogTitle>
            <DialogDescription>
              กรอกข้อมูลสินค้าให้ครบถ้วน
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="productName">ชื่อสินค้า</Label>
              <Input
                id="productName"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="กรอกชื่อสินค้า"
              />
            </div>

            <div className="space-y-2">
              <Label>ประเภท</Label>
              <Select
                value={formData.type}
                onValueChange={(value: ProductType) =>
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {productTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {PRODUCT_TYPE_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="priceIn" className="text-xs">
                  Price In (บ้าน/รถ)
                </Label>
                <Input
                  id="priceIn"
                  type="number"
                  step="0.5"
                  min="0"
                  value={formData.priceIn}
                  onChange={(e) =>
                    setFormData({ ...formData, priceIn: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priceOut" className="text-xs">
                  Price Out
                </Label>
                <Input
                  id="priceOut"
                  type="number"
                  step="0.5"
                  min="0"
                  value={formData.priceOut}
                  onChange={(e) =>
                    setFormData({ ...formData, priceOut: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priceWalkIn" className="text-xs">
                  Price WalkIn
                </Label>
                <Input
                  id="priceWalkIn"
                  type="number"
                  step="0.5"
                  min="0"
                  value={formData.priceWalkIn}
                  onChange={(e) =>
                    setFormData({ ...formData, priceWalkIn: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              ยกเลิก
            </Button>
            <Button onClick={handleSave} disabled={!formData.name.trim()}>
              {editingProduct ? 'บันทึก' : 'เพิ่ม'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบ</AlertDialogTitle>
            <AlertDialogDescription>
              คุณต้องการลบสินค้า &quot;{deleteTarget?.name}&quot; ใช่หรือไม่?
              การกระทำนี้ไม่สามารถย้อนกลับได้
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
