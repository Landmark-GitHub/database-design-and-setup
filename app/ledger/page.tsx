'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useStore } from '@/lib/store';
import { Bill, calculateBillTotals, PRODUCT_TYPE_LABELS } from '@/lib/types';
import { ProductTable } from '@/components/product-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Package,
  Calculator,
  Banknote,
  CheckCircle2,
  Plus,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Lock,
  Home,
  Save,
  Users,
  Image as ImageIcon,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type Mode = 'checkout' | 'return';

function dateToString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getToday() {
  return dateToString(new Date());
}

function LedgerContent() {
  const {
    members,
    products,
    bills,
    createBill,
    updateBill,
    updateBillItem,
    deleteBill,
    confirmCheckout,
  } = useStore();

  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [selectedBillId, setSelectedBillId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(getToday());
  const [mode, setMode] = useState<Mode>('checkout');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [showMemberSelectModal, setShowMemberSelectModal] = useState(false);
  const [showPrintPreviewModal, setShowPrintPreviewModal] = useState(false);
  const [isSavingImage, setIsSavingImage] = useState(false);

  const printAreaRef = useRef<HTMLDivElement>(null);
  const today = getToday();
  const isToday = selectedDate === today;

  // นำทางวันที่
  const handlePrevDate = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
    setSelectedBillId('');
  };

  const handleNextDate = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    const next = d.toISOString().split('T')[0];
    setSelectedDate(next);
    setSelectedBillId('');
  };

  // ดึงรายชื่อสมาชิกที่มีสถานะ Active
  const activeMembers = members.filter((m) => m.statusOut === 'active');
  const currentMemberIndex = activeMembers.findIndex((m) => m.id === selectedMemberId);

  // ดึงบิลและสมาชิกที่เลือกอยู่ปัจจุบัน
  const currentBill = bills.find((b) => b.id === selectedBillId);
  const currentMember = members.find((m) => m.id === selectedMemberId);

  // ถ้าไม่มีการเลือกสมาชิก ให้ Auto Select คนแรกสุด
  useEffect(() => {
    if (!selectedMemberId && activeMembers.length > 0) {
      setSelectedMemberId(activeMembers[0].id);
    }
  }, [selectedMemberId, activeMembers]);

  // ค้นหาบิลอัตโนมัติเมื่อมีการเปลี่ยนตัวสมาชิกหรือเปลี่ยนวัน
  useEffect(() => {
    if (selectedMemberId) {
      const dateBills = bills.filter(
        (b) => b.memberId === selectedMemberId && b.date === selectedDate
      );
      if (dateBills.length > 0) {
        const draftBill = dateBills.find((b) => b.status === 'draft' || b.status === 'checkout');
        setSelectedBillId(draftBill?.id || dateBills[dateBills.length - 1].id);
      } else {
        setSelectedBillId('');
      }
    }
  }, [selectedMemberId, selectedDate, bills]);
  

  const handleCreateBill = useCallback(() => {
    if (!selectedMemberId) return;
    const newBill = createBill(selectedMemberId, selectedDate);
    setSelectedBillId(newBill.id);
  }, [selectedMemberId, selectedDate, createBill]);

  const handleItemChange = useCallback(
    (productId: string, field: 'newStock' | 'returned', value: number) => {
      if (!selectedBillId) return;
      updateBillItem(selectedBillId, productId, { [field]: value });
    },
    [selectedBillId, updateBillItem]
  );

  const handleBillFieldChange = useCallback(
    (field: keyof Bill, value: string | number) => {
      if (!selectedBillId) return;
      updateBill(selectedBillId, { [field]: value });
    },
    [selectedBillId, updateBill]
  );

  const handleConfirmCheckout = useCallback(() => {
    if (!selectedBillId) return;
    confirmCheckout(selectedBillId);
  }, [selectedBillId, confirmCheckout]);

  // ค้นหาบิลใบก่อนหน้าของสมาชิกคนนี้ที่มีการปิดวันเรียบร้อยแล้ว เพื่อดึงยอดค้างเก่ามาคำนวณ
  // ✅ แก้แล้ว
  const previousBill = bills
    .filter((b) => b.memberId === selectedMemberId && b.date < selectedDate && b.status === 'completed')
    .sort((a, b) => {
      const dateDiff = b.date.localeCompare(a.date);
      if (dateDiff !== 0) return dateDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  })[0];

  const previousOwed = previousBill ? previousBill.amountOwed : 0;

  
  // const handleConfirmDayClose = () => {
  //   if (!currentBill) return;

  //   // 1. คำนวณยอดของบิลวันนี้เพียวๆ (ยอดสินค้าวันนี้ทั้งหมด)
  //   const { totalSales } = calculateBillTotals(currentBill, products, currentMember);
    
  //   // 2. คำนวณแจกแจงรายละเอียดตามที่พี่กำหนด
  //   const currentProductTotal = totalSales;                               // ยอดสินค้าวันนี้
  //   const cumulativeOwed = previousOwed;                                 // ยอดค้างสะสม (จากบิลเก่าล่าสุดที่ดึงมาข้างบน)
  //   const finalAmountOwed = currentProductTotal + cumulativeOwed - (currentBill.amountPaid || 0); // ยอดค้างสุทธิรวม (ยอดสินค้า + ยอดค้างสะสม - ยอดจ่ายวันนี้ถ้ามี)

  //   // 3. แยกร่างคำนวณเฉพาะ "ค่าน้ำแข็ง" ออกมาเพื่อบันทึกเป็นสถิติลงฟิลด์ icePrice
  //   const dProduct = products.find((p) => p.type === 'D');
  //   const dItem = dProduct ? currentBill.items.find((item) => item.productId === dProduct.id) : null;
  //   const dQuantity = dItem ? dItem.totalStock : 0;

  //   const memberClass = currentMember?.class ?? 'In';
  //   let dPrice = 0;
  //   if (dProduct) {
  //     dPrice = memberClass === 'Out' ? (dProduct.priceOut || 0) : memberClass === 'WalkIn' ? (dProduct.priceWorkIn || 0) : (dProduct.priceIn || 0);
  //   }
  //   const totalIcePrice = dQuantity * dPrice;

  //   // 4. บันทึกค่าลงฐานข้อมูลอย่างชัดเจน (เพื่อให้เซฟลง store.json ครบทุกฟิลด์)
  //   updateBill(currentBill.id, { 
  //     totalSales: currentProductTotal,  // ยอดสินค้าของวันนี้
  //     previousOwed: cumulativeOwed,     // บันทึกยอดค้างสะสมลงบิลใบนี้ด้วย! (จากเดิมที่ทิ้งเป็น 0)
  //     amountOwed: finalAmountOwed,      // ยอดค้างสุทธิรวมทั้งหมด
  //     icePrice: totalIcePrice,  
  //     status: 'completed'          
  //   });

  //   setShowCloseConfirm(false);
  // };

  // const handleConfirmDayClose = () => {
  //   if (!currentBill) return;

  //   // 1. คำนวณยอดขายเฉพาะของวันนี้ (ยอดรวมสินค้าวันนี้)
  //   const { totalSales } = calculateBillTotals(currentBill, products, currentMember);
    
  //   // 2. จัดการตัวแปรแจกแจงรายละเอียดตามที่พี่ต้องการ
  //   const currentProductTotal = totalSales;                               // ยอดสินค้าวันนี้
  //   const cumulativeOwed = previousOwed;                                 // ยอดค้างสะสม (ดึงมาจากบิลเก่าล่าสุด)
    
  //   // ยอดค้างสุทธิรวม = ยอดสินค้าวันนี้ + ยอดค้างสะสม - ยอดที่จ่ายเงินในบิลวันนี้
  //   const finalAmountOwed = currentProductTotal + cumulativeOwed - (currentBill.amountPaid || 0);

  //   // 3. คำนวณเฉพาะ "ค่าน้ำแข็ง" บันทึกเป็นสถิติแนบไปตามปกติ
  //   const dProduct = products.find((p) => p.type === 'D');
  //   const dItem = dProduct ? currentBill.items.find((item) => item.productId === dProduct.id) : null;
  //   const dQuantity = dItem ? dItem.totalStock : 0;

  //   const memberClass = currentMember?.class ?? 'In';
  //   let dPrice = 0;
  //   if (dProduct) {
  //     dPrice = memberClass === 'Out' ? (dProduct.priceOut || 0) : memberClass === 'WalkIn' ? (dProduct.priceWorkIn || 0) : (dProduct.priceIn || 0);
  //   }
  //   const totalIcePrice = dQuantity * dPrice;

  //   // 4. สั่ง update บันทึกค่าลงฐานข้อมูล (จะส่งไปเขียนลง store.json ถาวร)
  //   updateBill(currentBill.id, { 
  //     totalSales: currentProductTotal,  // บันทึกยอดสินค้าของวัน
  //     previousOwed: cumulativeOwed,     // บันทึกยอดค้างสะสมลงในฟิลด์บิลใบนี้ (แก้ปัญหาเดิมที่เป็น 0)
  //     amountOwed: finalAmountOwed >= 0 ? finalAmountOwed : 0, // ยอดค้างสุทธิรวม (ดักไม่ให้ติดลบ)
  //     icePrice: totalIcePrice,  
  //     status: 'completed'          
  //   });

  //   setShowCloseConfirm(false);
  // };

  // const handleConfirmDayClose = () => {
  //   if (!currentBill) return;

  //   // 1. คำนวณยอดขายเฉพาะของของวันนี้สุทธิ (ยอดขายสินค้าวันนี้เพียวๆ)
  //   const { totalSales } = calculateBillTotals(currentBill, products, currentMember);
    
  //   // 2. แตกแจงรายละเอียดสถิติข้อมูลตามแผนตารางสรุปใน UI
  //   const currentProductTotal = totalSales;                               // ยอดสินค้าวันนี้
  //   const cumulativeOwed = previousOwed;                                 // ยอดค้างสะสมเดิมที่ยกมา
    
  //   // ยอดค้างสุทธิรวมทั้งหมด = ยอดสินค้าวันนี้ + ยอดค้างสะสมเดิม - เงินสดที่จ่ายเข้ามาในวันนี้
  //   const finalAmountOwed = currentProductTotal + cumulativeOwed - (currentBill.amountPaid || 0);

  //   // 3. แยกร่างคำนวณเฉพาะสถิติ "ค่าน้ำแข็ง" แนบประวัติ
  //   const dProduct = products.find((p) => p.type === 'D');
  //   const dItem = dProduct ? currentBill.items.find((item) => item.productId === dProduct.id) : null;
  //   const dQuantity = dItem ? dItem.totalStock : 0;

  //   const memberClass = currentMember?.class ?? 'In';
  //   let dPrice = 0;
  //   if (dProduct) {
  //     dPrice = memberClass === 'Out' ? (dProduct.priceOut || 0) : memberClass === 'WalkIn' ? (dProduct.priceWorkIn || 0) : (dProduct.priceIn || 0);
  //   }
  //   const totalIcePrice = dQuantity * dPrice;

  //   // 4. สั่งส่งข้อมูลอัปเดตแยกฟิลด์ บันทึกประวัติ previousOwed ลงไฟล์ระบบอย่างเป็นทางการ
  //   updateBill(currentBill.id, { 
  //     totalSales: currentProductTotal,                        // ยอดสินค้าของวัน
  //     previousOwed: cumulativeOwed,                           // บันทึกยอดค้างสะสมลงในข้อมูลบิลใบนี้ถาวร
  //     amountOwed: finalAmountOwed >= 0 ? finalAmountOwed : 0, // ยอดค้างสุทธิรวมทั้งหมด (ป้องกันไม่ให้หนี้ติดลบ)
  //     icePrice: totalIcePrice,  
  //     status: 'completed'          
  //   });

  //   setShowCloseConfirm(false);
  // };

// page.tsx บรรทัด 181-209
// ✅ แก้แล้ว
  const handleConfirmDayClose = () => {
    if (!currentBill) return;

    // คำนวณแค่ icePrice เพื่อบันทึกสถิติ
    const dProduct = products.find((p) => p.type === 'D');
    const dItem = dProduct ? currentBill.items.find((item) => item.productId === dProduct.id) : null;
    const dQuantity = dItem ? dItem.totalStock : 0;
    const memberClass = currentMember?.class ?? 'In';
    const dPrice = dProduct
      ? memberClass === 'Out' ? dProduct.priceOut
      : memberClass === 'WalkIn' ? dProduct.priceWorkIn
      : dProduct.priceIn
      : 0;

    // updateBill จะ recalculate totalSales และ amountOwed ให้อัตโนมัติ
    // ไม่ต้องส่ง amountOwed มาเองเพราะจะ double-count previousOwed
    updateBill(currentBill.id, {
      icePrice: dQuantity * dPrice,
      status: 'completed',
    });

    setShowCloseConfirm(false);
  };
    
  const handleDeleteBill = useCallback(() => {
    if (!selectedBillId) return;
    deleteBill(selectedBillId);
    setShowDeleteConfirm(false);
    setSelectedBillId('');
  }, [selectedBillId, deleteBill]);

  const handlePayFull = useCallback(() => {
    if (!currentBill) return;

    const { totalSales } = calculateBillTotals(currentBill, products, currentMember);
    const totalToPayFull = Math.round(totalSales + previousOwed);

    updateBill(selectedBillId, { amountPaid: totalToPayFull });
  }, [currentBill, products, currentMember, selectedBillId, updateBill, previousOwed]);

  // เลื่อนเปลี่ยนสมาชิกแถบล่าง
  const handlePrevMember = () => {
    if (currentMemberIndex > 0) {
      setSelectedMemberId(activeMembers[currentMemberIndex - 1].id);
    }
  };
  const handleNextMember = () => {
    if (currentMemberIndex < activeMembers.length - 1) {
      setSelectedMemberId(activeMembers[currentMemberIndex + 1].id);
    }
  };

  // ฟังก์ชันแปลง HTML ของตัวบิลให้เซฟเป็นไฟล์รูปภาพ .jpg
  const handleSaveAsJpg = async () => {
    if (!printAreaRef.current) return;
    setIsSavingImage(true);
    try {
      const { toJpeg } = await import('html-to-image');
      
      const dataUrl = await toJpeg(printAreaRef.current, {
        quality: 0.95,
        backgroundColor: '#ffffff',
        style: {
          transform: 'scale(1)',
          borderRadius: '0px',
        }
      });
      
      const link = document.createElement('a');
      const filename = `บิล-${currentMember?.name || 'สมาชิก'}-${selectedDate}-${mode}.jpg`;
      link.download = filename;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('ไม่สามารถบันทึกรูปภาพได้:', error);
    } finally {
      setIsSavingImage(false);
    }
  };

  // คำนวณยอดเงินรวมและจำนวนสินค้าท้ายหน้า
  const billTotals = currentBill ? calculateBillTotals(currentBill, products, currentMember) : { totalSales: 0, amountOwed: 0 };
  const totalOld = currentBill?.items.reduce((sum, i) => sum + i.oldStock, 0) || 0;
  const totalNew = currentBill?.items.reduce((sum, i) => sum + i.newStock, 0) || 0;
  const totalStock = currentBill?.items.reduce((sum, i) => sum + i.totalStock, 0) || 0;

  if (activeMembers.length === 0) {
    return (
      <main className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="text-center">
          <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">ยังไม่มีสมาชิก</h2>
          <p className="text-muted-foreground mb-4">กรุณาเพิ่มสมาชิกในหน้าตั้งค่าก่อน</p>
          <Link href="/settings">
            <Button>ไปหน้าตั้งค่า</Button>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background flex flex-col pb-14">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-card border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Link href="/">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Home className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="font-bold text-foreground">
                {mode === 'checkout' ? 'เบิกสินค้า' : 'บันทึกยอด'}
              </h1>
              <div className="flex items-center gap-1">
                <button onClick={handlePrevDate} className="text-muted-foreground hover:text-foreground p-0.5">
                  <ChevronLeft className="w-3 h-3" />
                </button>
                <p className={cn('text-xs font-medium cursor-pointer', isToday ? 'text-primary' : 'text-muted-foreground')}>
                  {new Date(selectedDate + 'T00:00:00').toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric', month: 'short' })}
                  {isToday && ' (วันนี้)'}
                </p>
                <button onClick={handleNextDate} className="text-muted-foreground hover:text-foreground p-0.5">
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* ปุ่มพิมพ์บิลที่เรียกใช้ Modal Preview ตัวอย่างใบเสร็จ */}
            <Button 
              variant="outline" 
              size="sm" 
              disabled={!currentBill}
              onClick={() => setShowPrintPreviewModal(true)}
            >
              <Save className="w-4 h-4 mr-1" />
              พิมพ์บิล
            </Button>
            
            <Button size="sm" onClick={() => setShowMemberSelectModal(true)} className="bg-primary">
              <Plus className="w-4 h-4 mr-1" />
              เพิ่ม
            </Button>
          </div>
        </div>

        {/* รายชื่อแท็บสมาชิกด้านบน */}
        <div className="px-4 pb-2 overflow-x-auto">
          <div className="flex items-center gap-2 min-w-max">
            {activeMembers
              .filter((member) => bills.some((b) => b.memberId === member.id && b.date === selectedDate))
              .flatMap((member) => {
                const memberBills = bills.filter((b) => b.memberId === member.id && b.date === selectedDate);
                return memberBills.map((bill, index) => (
                  <button
                    key={bill.id}
                    onClick={() => {
                      setSelectedMemberId(member.id);
                      setSelectedBillId(bill.id);
                    }}
                    className={cn(
                      'px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap',
                      selectedBillId === bill.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    )}
                  >
                    {member.name}
                    {index > 0 && `(${index})`}
                  </button>
                ));
              })}

            <Button
              size="icon"
              variant="outline"
              className="rounded-full shrink-0"
              onClick={() => setShowMemberSelectModal(true)}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Modal เลือกรายชื่อสมาชิกเมื่อกดเพิ่มบิล */}
        <Dialog open={showMemberSelectModal} onOpenChange={setShowMemberSelectModal}>
          <DialogContent className="max-w-4xl">
            <DialogHeader className="sr-only" >
              <DialogTitle>เลือกสมาชิก</DialogTitle>
            </DialogHeader>
            
            <div ref={printAreaRef} className="space-y-2">
              {activeMembers.map((member) => (
                <Button
                  key={member.id}
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    const newBill = createBill(member.id, selectedDate);
                    setSelectedMemberId(member.id);
                    setSelectedBillId(newBill.id);
                    setShowMemberSelectModal(false);
                  }}
                >
                  {member.name}
                </Button>
              ))}
            </div>
          </DialogContent>
        </Dialog>
        
        <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-muted">
            <TabsTrigger value="checkout">เบิกสินค้า</TabsTrigger>
            <TabsTrigger value="return">บันทึกยอด</TabsTrigger>
          </TabsList>
        </Tabs>
      </header>

      {/* Main Content พื้นหลังตารางสินค้า */}
      <div className="flex-1 overflow-y-auto">
        {!currentBill ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <Package className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">ยังไม่มีบิลสำหรับวันนี้</p>
            <Button onClick={handleCreateBill}>
              <Plus className="w-4 h-4 mr-2" />
              สร้างบิลใหม่
            </Button>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {mode === 'checkout' && (
              <ProductTable
                bill={currentBill}
                products={products}
                mode={mode}
                readOnly={currentBill.status === 'completed'}
                onItemChange={handleItemChange}
              />
            )}

            {mode === 'return' && (
              <Card className="border-border">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Calculator className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-foreground truncate">กรอกยอดรวมคงเหลือรายชนิด</h3>
                      <p className="text-xs text-muted-foreground truncate">ตรวจสอบยอดขายแยกตามประเภทสินค้า</p>
                    </div>

                    <button
                      type="button"
                      disabled={currentBill.status === 'completed'}
                      onClick={() => {
                        const distinctTypes = Array.from(
                          new Set(products.filter((p) => p.type !== 'D' && p.type !== 'Car' && p.type !== 'House').map((p) => p.type))
                        );
                        const autoInputs: Record<string, number> = { ...currentBill.returnInputs };

                        distinctTypes.forEach((type) => {
                          // เพิ่ม && p.type !== 'D' เพื่อให้เงื่อนไขตรงกับด้านล่าง
                          const typeProducts = products.filter((p) => p.type === type && p.type !== 'D');
                          const typeItems = currentBill.items.filter((item) => typeProducts.some((p) => p.id === item.productId));
                          
                          // ถ้าไม่มีสินค้านี้ในบิล ไม่ต้องใส่ค่าลงไป
                          if (typeItems.length === 0) return;

                          // เปลี่ยนจาก systemSoldTotal เป็นคำนวณจาก totalStock (typeTotal)
                          const typeTotal = typeItems.reduce((sum, i) => sum + i.totalStock, 0);
                          autoInputs[type] = typeTotal; 
                        });

                        updateBill(selectedBillId, { returnInputs: autoInputs });
                      }}
                      className="ml-auto px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md text-xs transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                    >
                      ไม่เช็คยอด
                    </button> 

                  </div>

                  <div className="space-y-4 pt-2 border-t border-border">
                    {Array.from(
                      new Set(products.filter((p) => p.type !== 'D' && p.type !== 'Car' && p.type !== 'House').map((p) => p.type))
                    ).map((type) => {
                      const typeProducts = products.filter((p) => p.type === type && p.type !== 'D');
                      const typeItems = currentBill.items.filter((item) => typeProducts.some((p) => p.id === item.productId));

                      const typeTotal = typeItems.reduce((sum, i) => sum + i.totalStock, 0);

                      if (typeItems.length === 0) return null;
                      const typeLabel = PRODUCT_TYPE_LABELS[type as keyof typeof PRODUCT_TYPE_LABELS] || type;

                      return (
                        <div key={type} className="grid grid-cols-12 items-center gap-2">
                          <Label className="col-span-6 text-sm font-medium text-muted-foreground truncate">
                            {typeLabel}
                          </Label>
                          <div className="col-span-6 flex items-center gap-2">
                            <Input
                              type="number"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              placeholder={`ระบบนับ: ${typeTotal}`}
                              disabled={currentBill.status === 'completed' || typeTotal === 0}
                              max={typeTotal} 
                              min={0}
                              className="text-right h-9"
                              value={currentBill.returnInputs?.[type] != null ? currentBill.returnInputs[type] : ''}
                              onChange={(e) => {
                                let val = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0;
                                
                                if (val < 0) val = 0;
                                
                                if (val > typeTotal) {
                                  val = typeTotal;
                                }

                                updateBill(selectedBillId, {
                                  returnInputs: { ...currentBill.returnInputs, [type]: val },
                                });
                              }}
                            />
                            <span className="text-xs text-muted-foreground shrink-0">ชิ้น</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                </CardContent>
              </Card>
            )}

            {/* โหมดสรุปยอดเบิกฝั่ง Checkout */}
            {mode === 'checkout' && (
              <Card className="border-primary/30 bg-card">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Package className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">สรุปยอดเบิก</h3>
                      <p className="text-xs text-muted-foreground">เก่า + ใหม่ = รวม × ราคา</p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border space-y-2">
                    {Array.from(
                      new Set(products.filter((p) => p.type !== 'D' && p.type !== 'Car' && p.type !== 'House').map((p) => p.type))
                    ).map((type) => {
                      const memberClass = currentMember?.class ?? 'In';
                      const typeProducts = products.filter((p) => p.type === type);
                      const typeItems = currentBill.items.filter((item) => typeProducts.some((p) => p.id === item.productId));

                      const typeOriginalOld = typeItems.reduce((sum, i) => sum + i.oldStock, 0);
                      const typeNew = typeItems.reduce((sum, i) => sum + i.newStock, 0);
                      const typeTotal = typeItems.reduce((sum, i) => sum + i.totalStock, 0);

                      if (typeTotal === 0 && typeNew === 0) return null;

                      const baseProduct = typeProducts[0];
                      let price = 0;
                      if (memberClass === 'Out') price = baseProduct?.priceOut || 0;
                      else if (memberClass === 'WalkIn') price = baseProduct?.priceWorkIn || 0;
                      else price = baseProduct?.priceIn || 0;

                      const typeLabel = PRODUCT_TYPE_LABELS[type as keyof typeof PRODUCT_TYPE_LABELS] || type;

                      return (
                        <div key={type} className="flex justify-between items-center">
                          <span className="font-medium text-sm">{typeLabel}</span>
                          <span className="text-sm">
                            <span className="text-muted-foreground">( {typeOriginalOld} + {typeNew} )</span>
                            <span className="text-muted-foreground mx-1">×</span>
                            <span className="text-foreground">{price}</span>
                            <span className="text-muted-foreground mx-1">=</span>
                            <span className="text-lg font-bold text-primary">
                              {(typeTotal * price).toLocaleString()}
                            </span>
                            <span className="text-xs text-muted-foreground ml-1">บาท</span>
                          </span>
                        </div>
                      );
                    })}

                    {currentMember?.class === 'In' && currentMember?.statusIn?.house && (() => {
                      const houseProd = products.find((p) => p.type === 'House');
                      if (!houseProd) return null;
                      return (
                        <div className="flex justify-between items-center pt-2 border-t border-dashed border-border">
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            🏠 <span>แพ็กเกจบ้าน</span>
                          </span>
                          <span className="text-sm font-semibold text-chart-2">
                            +{(houseProd.priceIn).toLocaleString()} บาท
                          </span>
                        </div>
                      );
                    })()}

                    {currentMember?.class === 'In' && currentMember?.statusIn?.car && (() => {
                      const carProd = products.find((p) => p.type === 'Car');
                      if (!carProd) return null;
                      return (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            🚗 <span>แพ็กเกจรถ</span>
                          </span>
                          <span className="text-sm font-semibold text-chart-2">
                            +{(carProd.priceIn).toLocaleString()} บาท
                          </span>
                        </div>
                      );
                    })()}

                    {(() => {
                      const dProduct = products.find((p) => p.type === 'D');
                      if (!dProduct) return null;
                      const dItem = currentBill?.items?.find((item) => item.productId === dProduct.id);
                      const quantity = dItem?.totalStock || 0;
                      if (quantity === 0) return null;
                      return (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            🧊 <span>น้ำแข็งแห้ง {dProduct.priceIn} × {quantity}</span>
                          </span>
                          <span className="text-sm font-semibold text-chart-2">
                            +{(dProduct.priceIn * quantity).toLocaleString()} บาท
                          </span>
                        </div>
                      );
                    })()}
                  </div>

                  {/* รวมจำนวนชิ้น */}
                  <div className="flex justify-between items-center pt-3 border-t border-border mt-2">
                    <span className="text-sm text-muted-foreground">รวมจำนวนชิ้น</span>
                    <span>
                      <span className="text-xl font-bold text-foreground">{totalStock}</span>
                      <span className="text-xs text-muted-foreground ml-1">ชิ้น</span>
                    </span>
                  </div>

                  {/* ยอดเงินรวม */}
                  <div className="flex justify-between items-center pt-2">
                    <span className="font-semibold">ยอดเงินรวม</span>
                    <span className="text-3xl font-bold text-primary">
                      {Math.round(billTotals.totalSales).toLocaleString()} บาท
                    </span>
                  </div>

                  <div className="flex gap-2 mt-4">
                    {currentBill.status === 'draft' && (
                      <Button
                        onClick={handleConfirmCheckout}
                        className="flex-1 bg-primary hover:bg-primary/90"
                        disabled={totalStock === 0}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        ยืนยันการเบิก
                      </Button>
                    )}
                    {currentBill.status === 'checkout' && (
                      <div className="flex-1 text-center py-2.5 text-sm text-chart-2 bg-chart-2/10 rounded-lg font-medium">
                        <CheckCircle2 className="w-4 h-4 inline mr-1" />
                        เบิกสินค้าแล้ว
                      </div>
                    )}
                    {currentBill.status === 'completed' && (
                      <div className="flex-1 text-center py-2.5 text-sm text-muted-foreground bg-muted rounded-lg">
                        <Lock className="w-4 h-4 inline mr-1" />
                        ปิดวันแล้ว
                      </div>
                    )}
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setShowDeleteConfirm(true)}
                      disabled={currentBill.status === 'completed'}
                      className="shrink-0"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* โหมดคิดเงินและบันทึกราคาส่งฝั่ง Return */}
            {mode === 'return' && (
              <>
                <Card className="border-primary/30">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Calculator className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">สรุปยอดขาย</h3>
                        <p className="text-xs text-muted-foreground">รวม - เหลือ = ขาย</p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-border space-y-2">
                      {Array.from(new Set(products.map((p) => p.type)))
                        .filter((type) => type !== 'D' && type !== 'Car' && type !== 'House')
                        .map((type) => {
                          const memberClass = currentMember?.class ?? 'In';
                          const typeProducts = products.filter((p) => p.type === type);
                          const typeItems = currentBill.items.filter((item) => typeProducts.some((p) => p.id === item.productId));
                          const typeStock = typeItems.reduce((sum, i) => sum + i.totalStock, 0);
                          if (typeStock === 0) return null;

                          const returnedInput = currentBill.returnInputs?.[type] ?? 0;
                          const actualSold = typeStock - returnedInput;

                          const baseProduct = typeProducts[0];
                          let price = 0;
                          if (memberClass === 'Out') price = baseProduct?.priceOut || 0;
                          else if (memberClass === 'WalkIn') price = baseProduct?.priceWorkIn || 0;
                          else price = baseProduct?.priceIn || 0;

                          const typeLabel = PRODUCT_TYPE_LABELS[type as keyof typeof PRODUCT_TYPE_LABELS] || type;

                          return (
                            <div key={type} className="flex justify-between items-center">
                              <span className="font-medium text-sm">{typeLabel}</span>
                              <span className="text-sm">
                                <span className="text-muted-foreground">( {typeStock} - {returnedInput} )</span>
                                <span className="text-muted-foreground mx-1">×</span>
                                <span className="text-foreground">{price}</span>
                                <span className="text-muted-foreground mx-1">=</span>
                                <span className="text-lg font-bold text-primary">
                                  {Math.max(0, actualSold * price).toLocaleString()}
                                </span>
                                <span className="text-xs text-muted-foreground ml-1">บาท</span>
                              </span>
                            </div>
                          );
                        })}

                      {currentMember?.class === 'In' && currentMember?.statusIn?.house && (() => {
                        const houseProd = products.find((p) => p.type === 'House');
                        if (!houseProd) return null;
                        return (
                          <div className="flex justify-between items-center pt-2 border-t border-dashed border-border">
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                              🏠 <span>แพ็กเกจบ้าน</span>
                            </span>
                            <span className="text-sm font-semibold text-chart-2">
                              +{(houseProd.priceIn).toLocaleString()} บาท
                            </span>
                          </div>
                        );
                      })()}

                      {currentMember?.class === 'In' && currentMember?.statusIn?.car && (() => {
                        const carProd = products.find((p) => p.type === 'Car');
                        if (!carProd) return null;
                        return (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                              🚗 <span>แพ็กเกจรถ</span>
                            </span>
                            <span className="text-sm font-semibold text-chart-2">
                              +{(carProd.priceIn).toLocaleString()} บาท
                            </span>
                          </div>
                        );
                      })()}

                      {(() => {
                        const dProduct = products.find((p) => p.type === 'D');
                        if (!dProduct) return null;

                        const dItem = currentBill?.items?.find((item) => item.productId === dProduct.id);
                        const quantity = dItem?.totalStock || 0;

                        return (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                              🚗 <span>น้ำแข็งแห้ง {dProduct.priceIn} * {quantity}</span>
                            </span>
                            <span className="text-sm font-semibold text-chart-2">
                              +{(dProduct.priceIn * quantity).toLocaleString()} บาท
                            </span>
                          </div>
                        );
                      })()}
                    </div>

                    <div className="flex justify-between items-center pt-3 border-t border-border mt-2">
                      <span className="font-semibold">ยอดเงินรวม</span>
                      <span className="text-3xl font-bold text-primary">
                        {Math.round(billTotals.totalSales).toLocaleString()} บาท
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* ส่วนคำนวณการค้างชำระและการจ่ายเงินเงิน */}
                <Card className="border-chart-2/30">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-chart-2/10 flex items-center justify-center">
                        <Banknote className="w-5 h-5 text-chart-2" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">บันทึกการจ่ายเงิน</h3>
                        <p className="text-xs text-muted-foreground">ยอดที่ได้รับจากผู้ขาย</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center bg-sky-500/10 p-2.5 rounded-lg border border-sky-500/20 text-sm">
                        <span className="font-medium text-sky-700">ยอดสินค้า:</span>
                        <span className="font-bold text-sky-700">
                          {Math.round(billTotals.totalSales).toLocaleString()} บาท
                        </span>
                      </div>
                      <div className="flex justify-between items-center bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20 text-sm">
                        <span className="font-medium text-amber-700">ยอดค้างสะสม:</span>
                        <span className="font-bold text-amber-700">
                          {Math.round(previousOwed).toLocaleString()} บาท
                        </span>
                      </div>

                      <div>
                        <Label className="text-sm text-muted-foreground">ยอดจ่ายวันนี้ (บาท)</Label>
                        <div className="flex gap-2 mt-1">
                          <Input
                            type="number"
                            value={currentBill.amountPaid?.toString() || ''}
                            onChange={(e) => handleBillFieldChange('amountPaid', parseFloat(e.target.value) || 0)}
                            placeholder="0"
                            disabled={currentBill.status === 'completed'}
                          />
                          <Button
                            variant="outline"
                            onClick={handlePayFull}
                            disabled={currentBill.status === 'completed'}
                          >
                            จ่ายครบ
                          </Button>
                        </div>
                      </div>

                      {(() => {
                        const { totalSales } = calculateBillTotals(currentBill, products, currentMember);
                        const amountOwed = (totalSales + previousOwed) - (currentBill.amountPaid || 0);

                        return (
                          <div className={cn('p-3 rounded-lg', amountOwed > 0 ? 'bg-destructive/10' : 'bg-chart-2/10')}>
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium">
                                {amountOwed > 0 ? 'ยอดค้างสุทธิรวม' : 'จ่ายครบหมดแล้ว'}
                              </span>
                              <span className={cn('text-3xl font-bold', amountOwed > 0 ? 'text-destructive' : 'text-chart-2')}>
                                {amountOwed > 0 ? Math.round(amountOwed).toLocaleString() : '0'} บาท
                              </span>
                            </div>
                          </div>
                        );
                      })()}

                      <div>
                        <Label className="text-sm text-muted-foreground">หมายเหตุ</Label>
                        <Input
                          value={currentBill.notes}
                          onChange={(e) => handleBillFieldChange('notes', e.target.value)}
                          placeholder="บันทึกเพิ่มเติม..."
                          disabled={currentBill.status === 'completed'}
                          className="mt-1"
                        />
                      </div>

                      {currentBill.status !== 'completed' && (
                        <Button
                          onClick={() => setShowCloseConfirm(true)}
                          className="w-full"
                          disabled={currentBill.status === 'draft'}
                        >
                          <Lock className="w-4 h-4 mr-2" />
                          ปิดวัน (บันทึกยอด)
                        </Button>
                      )}

                      {currentBill.status === 'draft' && (
                        <p className="text-xs text-muted-foreground text-center">
                          ต้องยืนยันการเบิกก่อนจึงจะปิดวันได้
                        </p>
                      )}

                      {currentBill.status === 'completed' && (
                        <div className="text-center py-2 text-sm text-muted-foreground bg-muted rounded-lg">
                          <Lock className="w-4 h-4 inline mr-1" />
                          ปิดวันแล้ว - ไม่สามารถแก้ไขได้
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        )}
      </div>

      {/* แถบเปลี่ยนสมาชิกด้านล่างสุด */}
      <footer className="fixed bottom-0 left-0 right-0 z-20 bg-card border-t border-border">
        <div className="flex items-center justify-between px-4 py-2">
          <button
            onClick={handlePrevMember}
            disabled={currentMemberIndex <= 0}
            className={cn('flex items-center gap-1 text-sm py-2', currentMemberIndex <= 0 ? 'text-muted-foreground/50' : 'text-foreground')}
          >
            <ChevronLeft className="w-4 h-4" />
            ก่อนหน้า
          </button>

          <div className="flex items-center gap-1 text-muted-foreground">
            <Users className="w-4 h-4" />
            <span className="text-sm">{activeMembers.length} คน</span>
          </div>

          <button
            onClick={handleNextMember}
            disabled={currentMemberIndex >= activeMembers.length - 1}
            className={cn('flex items-center gap-1 text-sm py-2', currentMemberIndex >= activeMembers.length - 1 ? 'text-muted-foreground/50' : 'text-foreground')}
          >
            ถัดไป
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </footer>


      {/* ==================== 🖼️ MODAL PREVIEW บิล (แสดงรายรายการสินค้า) ==================== */}
      <Dialog open={showPrintPreviewModal} onOpenChange={setShowPrintPreviewModal}>
        <DialogContent className="max-w-md w-[95vw] p-0 overflow-hidden gap-0 bg-white text-black border border-neutral-200 shadow-xl max-h-[90vh] flex flex-col rounded-xl">
          
          <DialogTitle className="sr-only">
            {mode === 'checkout' ? 'ตัวอย่างใบเบิกสินค้าไอศกรีม' : 'ตัวอย่างใบเสร็จรับเงิน'}
          </DialogTitle>

          {/* แถบหัวกระดาษคอนโทรล */}
          <div className="flex items-center justify-between p-3 border-b border-neutral-100 bg-neutral-50 shrink-0">
            <div className="flex items-center gap-1.5 text-neutral-700 font-medium text-sm">
              <ImageIcon className="w-4 h-4 text-primary" />
              <span>ตัวอย่างก่อนบันทึก</span>
            </div>
            <button 
              onClick={() => setShowPrintPreviewModal(false)}
              className="text-neutral-400 hover:text-neutral-600 rounded-lg p-1 hover:bg-neutral-200/50 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* ตัวครอบด้านนอกสุดให้เลื่อน Scroll ได้ */}
          <div className="flex-1 overflow-y-auto p-4 bg-neutral-100 flex flex-col items-center min-h-0">
            
            {/* แผ่นกระดาษจำลองใบสลิป POS */}
            <div 
              ref={printAreaRef} 
              className="w-[350px] h-auto p-5 bg-white font-mono text-xs leading-relaxed text-neutral-900 shadow-md border border-neutral-200 shrink-0 my-2"
            >
              {/* เปลี่ยนหัวข้อหลักตามเงื่อนไข Mode ของบิลปัจจุบัน */}
              <div className="text-center space-y-1 mb-4">
                <h2 className="text-base font-bold tracking-tight text-neutral-950">
                  {mode === 'checkout' ? '📋 ใบเบิกสินค้าไอศกรีม' : '🧾 ใบเสร็จรับเงิน / ใบส่งสินค้า'}
                </h2>
                <p className="text-[11px] text-neutral-500">ระบบจัดการคลังสินค้าไอศกรีมอัตโนมัติ</p>
              </div>

              {/* รายละเอียดหัวบิล */}
              <div className="space-y-2 text-[11px] text-neutral-600 bg-neutral-50 p-3 rounded-xl border border-neutral-200/60 mb-4 shadow-sm font-sans">
                
                {/* ข้อมูลชื่อร้านและเบอร์โทรศัพท์ที่ถูกต้อง */}
                <div className="text-center border-b border-dashed border-neutral-300 pb-2.5 mb-2">
                  <h2 className="text-[13px] font-bold text-neutral-950 tracking-wide">
                    🍦 ร้านไอศครีมโบราณ คลอง 7
                  </h2>
                  <p className="text-[10px] text-neutral-500 mt-1 leading-relaxed">
                    📞 โทร. 090-417-1125<br />
                    📱 064-419-4456 / 064-515-9924
                  </p>
                </div>

                {/* แถวที่ 1: ผู้เบิก/ลูกค้า */}
                <div className="flex justify-between items-center border-b border-neutral-100/70 pb-1.5">
                  <div className="flex items-center gap-1.5 text-neutral-500">
                    <span>👤</span>
                    <span>ผู้เบิก/ลูกค้า:</span>
                  </div>
                  <span className="font-bold text-neutral-950 bg-neutral-200/50 px-2 py-0.5 rounded-md">
                    {currentMember?.name || '-'}
                  </span>
                </div>

                {/* แถวที่ 2: ประเภทราคา */}
                <div className="flex justify-between items-center border-b border-neutral-100/70 pb-1.5">
                  <div className="flex items-center gap-1.5 text-neutral-500">
                    <span>💰</span>
                    <span>ประเภทราคา:</span>
                  </div>
                  <span className="font-semibold text-neutral-800">
                    {currentMember?.class === 'Out' ? '💼 ส่งออก (Out)' : currentMember?.class === 'WalkIn' ? '🚶 ลูกค้าภายนอก (WalkIn)' : '🏠 ส่งเข้าคลัง (In)'}
                  </span>
                </div>

                {/* แถวที่ 3: วันที่ทำรายการ */}
                <div className="flex justify-between items-center border-b border-neutral-100/70 pb-1.5">
                  <div className="flex items-center gap-1.5 text-neutral-500">
                    <span>📅</span>
                    <span>วันที่ทำรายการ:</span>
                  </div>
                  <span className="text-neutral-800 font-medium">
                    {currentBill ? new Date(currentBill.date + 'T00:00:00').toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                  </span>
                </div>

                {/* แถวที่ 4: Status บิล */}
                <div className="flex justify-between items-center pt-0.5">
                  <div className="flex items-center gap-1.5 text-neutral-500">
                    <span>📄</span>
                    <span>สถานะเอกสาร:</span>
                  </div>
                  <span className={cn(
                    "font-semibold text-[10px] px-2 py-0.5 rounded-full border", 
                    currentBill?.status === 'completed' 
                      ? "text-emerald-700 bg-emerald-50 border-emerald-200" 
                      : "text-amber-700 bg-amber-50 border-amber-200"
                  )}>
                    {currentBill?.status === 'completed' ? '🔒 ปิดวันสำเร็จ' : '📝 ฉบับร่าง'}
                  </span>
                </div>

              </div>

              {/* ส่วนโครงสร้างตารางข้อมูลสินค้าภายในบิล */}
              <div className="space-y-2">
                <div className="border-b border-dashed border-neutral-300 pb-1.5 font-bold grid grid-cols-12 text-neutral-800 text-[11px]">
                  <div className="col-span-4">รายการสินค้า</div>
                  {mode === 'checkout' ? (
                    <>
                      <div className="col-span-2 text-right">เก่า</div>
                      <div className="col-span-2 text-right">ใหม่</div>
                      <div className="col-span-2 text-right">รวมเบิก</div>
                      <div className="col-span-2 text-right">ราคา</div>
                      <div className="col-span-2 text-right">รวมเงิน</div>
                    </>
                  ) : (
                    <>
                      <div className="col-span-2 text-right">รวม</div>
                      <div className="col-span-2 text-right">เหลือ</div>
                      <div className="col-span-2 text-right">ขาย</div>
                      <div className="col-span-2 text-right">ราคา</div>
                      <div className="col-span-2 text-right">รวมเงิน</div>
                    </>
                  )}
                </div>

                {/* รายการสินค้าหลัก */}
                {/* รายการสินค้าหลัก */}
                {/* รายการสินค้าหลัก */}
                <div className="space-y-1.5 py-1 text-neutral-800">
                  {(() => {
                    // กำหนดตัวแปรสำหรับคำนวณยอดเงินในบล็อกพรีวิว
                    let totalItemsPriceSum = 0; // ยอดรวมเฉพาะสินค้าหลัก (ไอศกรีม)
                    let totalAddonsPriceSum = 0; // ยอดรวมค่าบริการเสริม (Car, House, D)

                    const memberClass = currentMember?.class ?? 'In';

                    // ==========================================
                    // 1. โหมดเบิกสินค้า (Checkout): แสดงแยกรายรายการสินค้า
                    // ==========================================
                    if (mode === 'checkout') {
                      // วนลูปแสดงสินค้าหลัก (ไม่รวม Car, House และไม่รวม D ในตารางหลัก)
                      const mainItemsHtml = currentBill?.items
                        .filter((item) => {
                          const prod = products.find((p) => p.id === item.productId);
                          return prod && prod.type !== 'Car' && prod.type !== 'House' && prod.type !== 'D';
                        })
                        .map((item) => {
                          const prod = products.find((p) => p.id === item.productId)!;
                          
                          let price = 0;
                          if (memberClass === 'Out') price = prod.priceOut || 0;
                          else if (memberClass === 'WalkIn') price = prod.priceWorkIn || 0;
                          else price = prod.priceIn || 0;

                          if (item.totalStock === 0 && item.newStock === 0) return null;

                          const itemTotalPrice = item.totalStock * price;
                          totalItemsPriceSum += itemTotalPrice;

                          return (
                            <div key={item.productId} className="grid grid-cols-12 items-center text-[11px] gap-y-0.5 border-b border-neutral-100 pb-1 last:border-0">
                              <div className="col-span-4 font-medium truncate">{prod.name}</div>
                              <div className="col-span-2 text-right text-neutral-500">{item.oldStock}</div>
                              <div className="col-span-2 text-right font-medium text-emerald-600">+{item.newStock}</div>
                              <div className="col-span-2 text-right font-semibold text-neutral-900">{item.totalStock}</div>
                              <div className="col-span-2 text-right text-neutral-600">{price}</div>
                              <div className="col-span-2 text-right font-bold text-neutral-900">
                                {itemTotalPrice.toLocaleString()}
                              </div>
                            </div>
                          );
                        });

                      // คำนวณค่าน้ำแข็งแห้ง (Type D) ในโหมด Checkout
                      const dProduct = products.find((p) => p.type === 'D');
                      const dItem = dProduct ? currentBill?.items?.find((item) => item.productId === dProduct.id) : null;
                      const dQuantity = dItem?.totalStock || 0;
                      if (dProduct && dQuantity > 0) {
                        let dPrice = memberClass === 'Out' ? dProduct.priceOut : memberClass === 'WalkIn' ? dProduct.priceWorkIn : dProduct.priceIn;
                        totalAddonsPriceSum += dQuantity * (dPrice || 0);
                      }

                      // คำนวณค่าแพ็กเกจประจำบ้าน/รถ (เฉพาะคลัง In)
                      if (memberClass === 'In') {
                        if (currentMember?.statusIn?.house) {
                          const houseProd = products.find((p) => p.type === 'House');
                          if (houseProd) totalAddonsPriceSum += houseProd.priceIn || 0;
                        }
                        if (currentMember?.statusIn?.car) {
                          const carProd = products.find((p) => p.type === 'Car');
                          if (carProd) totalAddonsPriceSum += carProd.priceIn || 0;
                        }
                      }

                      const finalCheckoutTotalToday = totalItemsPriceSum + totalAddonsPriceSum;
                      const totalDebtWithCheckout = finalCheckoutTotalToday + previousOwed;

                      return (
                        <>
                          {mainItemsHtml}

                          {/* 🧊 ส่วนแสดงค่าบริการ / ค่าแพ็กเกจเสริมท้ายบิล (Car, House, D) */}
                          {(totalAddonsPriceSum > 0) && (
                            <div className="space-y-1 pt-1.5 border-t border-neutral-200 mt-2">
                              <div className="text-[10px] font-bold text-neutral-400 mb-1">ค่าบริการ / แพ็กเกจเสริม</div>
                              
                              {memberClass === 'In' && currentMember?.statusIn?.house && (() => {
                                const houseProd = products.find((p) => p.type === 'House');
                                if (!houseProd) return null;
                                return (
                                  <div className="grid grid-cols-12 text-[11px] text-neutral-700 items-center">
                                    <div className="col-span-8">🏠 ค่าแพ็กเกจประจำบ้าน</div>
                                    <div className="col-span-2 text-right text-neutral-600">{houseProd.priceIn}</div>
                                    <div className="col-span-2 text-right font-bold text-neutral-900">+{houseProd.priceIn.toLocaleString()}</div>
                                  </div>
                                );
                              })()}

                              {memberClass === 'In' && currentMember?.statusIn?.car && (() => {
                                const carProd = products.find((p) => p.type === 'Car');
                                if (!carProd) return null;
                                return (
                                  <div className="grid grid-cols-12 text-[11px] text-neutral-700 items-center">
                                    <div className="col-span-8">🚗 ค่าแพ็กเกจประจำรถ</div>
                                    <div className="col-span-2 text-right text-neutral-600">{carProd.priceIn}</div>
                                    <div className="col-span-2 text-right font-bold text-neutral-900">+{carProd.priceIn.toLocaleString()}</div>
                                  </div>
                                );
                              })()}

                              {dProduct && dQuantity > 0 && (() => {
                                let dPrice = memberClass === 'Out' ? dProduct.priceOut : memberClass === 'WalkIn' ? dProduct.priceWorkIn : dProduct.priceIn;
                                return (
                                  <div className="grid grid-cols-12 text-[11px] text-neutral-700 items-center">
                                    <div className="col-span-6">🧊 น้ำแข็งแห้ง (จำนวน {dQuantity})</div>
                                    <div className="col-span-4 text-right text-neutral-600">{dPrice} / ชิ้น</div>
                                    <div className="col-span-2 text-right font-bold text-neutral-900">+{(dQuantity * (dPrice || 0)).toLocaleString()}</div>
                                  </div>
                                );
                              })()}
                            </div>
                          )}

                          {/* ส่วนท้ายบิลสรุปตัวเลขแบบที่ 1 (Checkout) */}
                          <div className="border-t border-dashed border-neutral-300 mt-3 pt-2 space-y-1 text-xs">
                            <div className="flex justify-between text-neutral-600">
                              <span>ค่าสินค้าไอศกรีมรวมวันนี้:</span>
                              <span className="font-medium text-neutral-900">{totalItemsPriceSum.toLocaleString()} บาท</span>
                            </div>
                            <div className="flex justify-between text-neutral-600">
                              <span>ค่าบริการเสริมรวมวันนี้:</span>
                              <span className="font-medium text-neutral-900">{totalAddonsPriceSum.toLocaleString()} บาท</span>
                            </div>
                            <div className="flex justify-between text-neutral-700 font-semibold border-t border-neutral-100 pt-1">
                              <span>ยอดเบิกรวมสุทธิวันนี้:</span>
                              <span className="text-neutral-950">{finalCheckoutTotalToday.toLocaleString()} บาท</span>
                            </div>
                            <div className="flex justify-between text-neutral-600">
                              <span>หนี้ค้างชำระสะสมเดิม:</span>
                              <span className="font-medium text-neutral-900">{Math.round(previousOwed).toLocaleString()} บาท</span>
                            </div>
                            
                            <div className="flex justify-between items-center font-bold text-sm text-neutral-950 bg-neutral-50 p-1.5 rounded border border-neutral-200 mt-1">
                              <span>ยอดหนี้สะสมรวมทั้งหมด:</span>
                              <span className={totalDebtWithCheckout > 0 ? "text-red-600" : "text-neutral-950"}>
                                {Math.round(totalDebtWithCheckout).toLocaleString()} บาท
                              </span>
                            </div>

                            {currentBill?.notes && (
                              <div className="mt-2 text-[10px] text-neutral-500 italic bg-neutral-50 p-1.5 rounded border border-neutral-100">
                                * หมายเหตุ: {currentBill.notes}
                              </div>
                            )}
                          </div>
                        </>
                      );
                    }

                    // ==========================================
                    // 2. โหมดบันทึกยอด (Return): จัดกลุ่มยอดขายจริงตามประเภทสินค้า
                    // ==========================================
                    // คำนวณยอดไอศกรีมที่ขายได้จริง (ยอดเบิกหักยอดคืน)
                    Array.from(new Set(products.map((p) => p.type)))
                      .filter((type) => type !== 'D' && type !== 'Car' && type !== 'House')
                      .forEach((type) => {
                        const typeProducts = products.filter((p) => p.type === type);
                        const typeItems = currentBill?.items.filter((item) => typeProducts.some((p) => p.id === item.productId)) || [];
                        const typeStock = typeItems.reduce((sum, i) => sum + i.totalStock, 0);
                        const returnedInput = currentBill?.returnInputs?.[type] ?? 0;
                        const actualSold = Math.max(0, typeStock - returnedInput);

                        const baseProduct = typeProducts[0];
                        let price = 0;
                        if (memberClass === 'Out') price = baseProduct?.priceOut || 0;
                        else if (memberClass === 'WalkIn') price = baseProduct?.priceWorkIn || 0;
                        else price = baseProduct?.priceIn || 0;

                        totalItemsPriceSum += actualSold * price;
                      });

                    // คำนวณค่าบริการเสริมในโหมด Return
                    const dProductReturn = products.find((p) => p.type === 'D');
                    const dItemReturn = dProductReturn ? currentBill?.items?.find((item) => item.productId === dProductReturn.id) : null;
                    const dQuantityReturn = dItemReturn?.totalStock || 0;
                    if (dProductReturn && dQuantityReturn > 0) {
                      let dPrice = memberClass === 'Out' ? dProductReturn.priceOut : memberClass === 'WalkIn' ? dProductReturn.priceWorkIn : dProductReturn.priceIn;
                      totalAddonsPriceSum += dQuantityReturn * (dPrice || 0);
                    }

                    if (memberClass === 'In') {
                      if (currentMember?.statusIn?.house) {
                        const houseProd = products.find((p) => p.type === 'House');
                        if (houseProd) totalAddonsPriceSum += houseProd.priceIn || 0;
                      }
                      if (currentMember?.statusIn?.car) {
                        const carProd = products.find((p) => p.type === 'Car');
                        if (carProd) totalAddonsPriceSum += carProd.priceIn || 0;
                      }
                    }

                    const finalReturnTotalToday = totalItemsPriceSum + totalAddonsPriceSum;
                    const amountPaidToday = currentBill?.amountPaid || 0;
                    const finalOwedAmount = (finalReturnTotalToday + previousOwed) - amountPaidToday;

                    return (
                      <>
                        {/* ตารางวนลูปแสดงยอดขายแยกประเภท */}
                        {Array.from(new Set(products.map((p) => p.type)))
                          .filter((type) => type !== 'D' && type !== 'Car' && type !== 'House')
                          .map((type) => {
                            const typeProducts = products.filter((p) => p.type === type);
                            const typeItems = currentBill?.items.filter((item) => typeProducts.some((p) => p.id === item.productId)) || [];
                            
                            const typeStock = typeItems.reduce((sum, i) => sum + i.totalStock, 0);
                            if (typeStock === 0) return null;

                            const returnedInput = currentBill?.returnInputs?.[type] ?? 0;
                            const actualSold = typeStock - returnedInput;

                            const baseProduct = typeProducts[0];
                            let price = 0;
                            if (memberClass === 'Out') price = baseProduct?.priceOut || 0;
                            else if (memberClass === 'WalkIn') price = baseProduct?.priceWorkIn || 0;
                            else price = baseProduct?.priceIn || 0;

                            const typeLabel = PRODUCT_TYPE_LABELS[type as keyof typeof PRODUCT_TYPE_LABELS] || type;

                            return (
                              <div key={type} className="grid grid-cols-12 items-center text-[11px] gap-y-0.5 border-b border-neutral-100 pb-1 last:border-0">
                                <div className="col-span-4 font-medium truncate">{typeLabel}</div>
                                <div className="col-span-2 text-right text-neutral-500">{typeStock}</div>
                                <div className="col-span-2 text-right text-neutral-500">{returnedInput}</div>
                                <div className="col-span-2 text-right font-semibold text-neutral-900">{Math.max(0, actualSold)}</div>
                                <div className="col-span-2 text-right text-neutral-600">{price}</div>
                                <div className="col-span-2 text-right font-bold text-neutral-900">
                                  {Math.max(0, actualSold * price).toLocaleString()}
                                </div>
                              </div>
                            );
                          })}
                        
                        {/* 🧊 ส่วนแสดงค่าบริการ / ค่าแพ็กเกจเสริมท้ายบิล สำหรับโหมด Return */}
                        {(totalAddonsPriceSum > 0) && (
                          <div className="space-y-1 pt-1.5 border-t border-neutral-200 mt-2">
                            <div className="text-[10px] font-bold text-neutral-400 mb-1">ค่าบริการ / แพ็กเกจเสริม</div>
                            
                            {memberClass === 'In' && currentMember?.statusIn?.house && (() => {
                              const houseProd = products.find((p) => p.type === 'House');
                              if (!houseProd) return null;
                              return (
                                <div className="grid grid-cols-12 text-[11px] text-neutral-700 items-center">
                                  <div className="col-span-8">🏠 ค่าแพ็กเกจประจำบ้าน</div>
                                  <div className="col-span-2 text-right text-neutral-600">{houseProd.priceIn}</div>
                                  <div className="col-span-2 text-right font-bold text-neutral-900">+{houseProd.priceIn.toLocaleString()}</div>
                                </div>
                              );
                            })()}

                            {memberClass === 'In' && currentMember?.statusIn?.car && (() => {
                              const carProd = products.find((p) => p.type === 'Car');
                              if (!carProd) return null;
                              return (
                                <div className="grid grid-cols-12 text-[11px] text-neutral-700 items-center">
                                  <div className="col-span-8">🚗 ค่าแพ็กเกจประจำรถ</div>
                                  <div className="col-span-2 text-right text-neutral-600">{carProd.priceIn}</div>
                                  <div className="col-span-2 text-right font-bold text-neutral-900">+{carProd.priceIn.toLocaleString()}</div>
                                </div>
                              );
                            })()}

                            {dProductReturn && dQuantityReturn > 0 && (() => {
                              let dPrice = memberClass === 'Out' ? dProductReturn.priceOut : memberClass === 'WalkIn' ? dProductReturn.priceWorkIn : dProductReturn.priceIn;
                              return (
                                <div className="grid grid-cols-12 text-[11px] text-neutral-700 items-center">
                                  <div className="col-span-6">🧊 น้ำแข็งแห้ง (จำนวน {dQuantityReturn})</div>
                                  <div className="col-span-4 text-right text-neutral-600">{dPrice} / ชิ้น</div>
                                  <div className="col-span-2 text-right font-bold text-neutral-900">+{(dQuantityReturn * (dPrice || 0)).toLocaleString()}</div>
                                </div>
                              );
                            })()}
                          </div>
                        )}

                        {/* ส่วนท้ายบิลสรุปตัวเลขแบบที่ 2 (Return - ปรับปรุงให้บล็อกแสดงผลเหมือนกับ Checkout) */}
                        <div className="border-t border-dashed border-neutral-300 mt-3 pt-2 space-y-1 text-xs">
                          <div className="flex justify-between text-neutral-600">
                            <span>ค่าสินค้าไอศกรีมรวมวันนี้:</span>
                            <span className="font-medium text-neutral-900">{totalItemsPriceSum.toLocaleString()} บาท</span>
                          </div>
                          <div className="flex justify-between text-neutral-600">
                            <span>ค่าบริการเสริมรวมวันนี้:</span>
                            <span className="font-medium text-neutral-900">{totalAddonsPriceSum.toLocaleString()} บาท</span>
                          </div>
                          <div className="flex justify-between text-neutral-700 font-semibold border-t border-neutral-100 pt-1">
                            <span>ยอดเบิกรวมสุทธิวันนี้:</span>
                            <span className="text-neutral-950">{finalReturnTotalToday.toLocaleString()} บาท</span>
                          </div>
                          <div className="flex justify-between text-neutral-600">
                            <span>หนี้ค้างชำระสะสมเดิม:</span>
                            <span className="font-medium text-neutral-900">{Math.round(previousOwed).toLocaleString()} บาท</span>
                          </div>
                          <div className="flex justify-between text-neutral-600 bg-neutral-50 p-1 rounded border border-neutral-150">
                            <span className="font-semibold text-neutral-800">ชำระเงินวันนี้:</span>
                            <span className="font-bold text-neutral-900">-{Math.round(amountPaidToday).toLocaleString()} บาท</span>
                          </div>
                          
                          <div className="flex justify-between items-center font-bold text-sm text-neutral-950 bg-neutral-50 p-1.5 rounded border border-neutral-200 mt-1">
                            <span>ยอดหนี้สะสมรวมทั้งหมด:</span>
                            <span className={finalOwedAmount > 0 ? "text-red-600" : "text-emerald-600"}>
                              {finalOwedAmount > 0 ? Math.round(finalOwedAmount).toLocaleString() : '0'} บาท
                            </span>
                          </div>

                          {currentBill?.notes && (
                            <div className="mt-2 text-[10px] text-neutral-500 italic bg-neutral-50 p-1.5 rounded border border-neutral-100">
                              * หมายเหตุ: {currentBill.notes}
                            </div>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>

          </div>

          {/* แถบปุ่มบันทึก JPG ด้านล่าง */}
          <div className="p-3 bg-neutral-50 border-t border-neutral-100 flex gap-2 shrink-0 justify-end">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowPrintPreviewModal(false)}
              className="text-neutral-500 border-neutral-200"
            >
              ปิดหน้าต่าง
            </Button>
            <Button 
              size="sm" 
              onClick={handleSaveAsJpg}
              disabled={isSavingImage}
              className="bg-neutral-900 hover:bg-neutral-800 text-white gap-1 px-4 font-medium"
            >
              <Save className="w-4 h-4" />
              {isSavingImage ? 'กำลังบันทึก...' : 'บันทึกรูปภาพ (JPG)'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบบิล</AlertDialogTitle>
            <AlertDialogDescription>
              คุณต้องการลบบิลนี้ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteBill}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              ลบ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Close Day Confirmation */}
      <AlertDialog open={showCloseConfirm} onOpenChange={setShowCloseConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการปิดวัน</AlertDialogTitle>
            <AlertDialogDescription>
              เมื่อปิดวันแล้วจะไม่สามารถแก้ไขข้อมูลได้อีก
              <br />
              ยอดเหลือจะถูกนำไปเป็นยอดเก่าในวันถัดไป
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDayClose}>
              ยืนยันปิดวัน
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}

// เอา <AuthGuard> ออกไปเรียบร้อยแล้ว ไม่ต้องใช้ระบบล็อคสิทธิ์ใดๆ
export default function LedgerPage() {
  return <LedgerContent />;
}


