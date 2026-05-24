'use client';

import { useState, useEffect, useCallback } from 'react';
import { useStore } from '@/lib/store';
import { Bill, calculateBillTotals } from '@/lib/types';
import { ProductTable } from '@/components/product-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
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

function getToday() {
  return new Date().toISOString().split('T')[0];
}

export default function LedgerPage() {
  const {
    members,
    products,
    bills,
    createBill,
    updateBill,
    updateBillItem,
    deleteBill,
    confirmCheckout,
    confirmDayClose,
  } = useStore();

  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [selectedBillId, setSelectedBillId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(getToday());
  const [mode, setMode] = useState<Mode>('checkout');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [showMemberSelectModal, setShowMemberSelectModal] = useState(false);

  const today = getToday();
  const isToday = selectedDate === today;

  // Date navigation
  const handlePrevDate = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
    setSelectedBillId('');
  };
  // const handleNextDate = () => {
  //   const d = new Date(selectedDate);
  //   d.setDate(d.getDate() + 1);
  //   const next = d.toISOString().split('T')[0];
  //   if (next <= today) {
  //     setSelectedDate(next);
  //     setSelectedBillId('');
  //   }
  // };

  //  โค้ดที่ถูกต้อง (แก้ไขแล้ว)
  const handleNextDate = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    const next = d.toISOString().split('T')[0];
    setSelectedDate(next); // ปลดล็อคให้เปลี่ยนเป็นวันไหนก็ได้ในอนาคต
    setSelectedBillId('');
  };

  // Get active members
  const activeMembers = members.filter((m) => m.statusOut === 'active');

  // Get current member index
  const currentMemberIndex = activeMembers.findIndex((m) => m.id === selectedMemberId);

  // Get selected date's bills for selected member
  const memberBillsToday = bills.filter(
    (b) => b.memberId === selectedMemberId && b.date === selectedDate
  );

  // Current selected bill
  const currentBill = bills.find((b) => b.id === selectedBillId);
  const currentMember = members.find((m) => m.id === selectedMemberId);

  // Auto-select first member if none selected
  useEffect(() => {
    if (!selectedMemberId && activeMembers.length > 0) {
      setSelectedMemberId(activeMembers[0].id);
    }
  }, [selectedMemberId, activeMembers]);

  // Auto-select bill when member or date changes
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

    // 1. ค้นหาบิลใบก่อนหน้าของสมาชิกคนนี้ที่มีการปิดวันเรียบร้อยแล้ว
  const previousBill = bills
    .filter((b) => b.memberId === selectedMemberId && b.date < selectedDate && b.status === 'completed')
    .sort((a, b) => b.date.localeCompare(a.date))[0]; // เอาใบที่ล่าสุดที่สุดก่อนวันนี้

  // 2. ดึงค่ายอดค้างจากบิลใบนั้นมา ถ้าไม่มีหรือจ่ายครบแล้วให้เป็น 0
  const previousOwed = previousBill ? previousBill.amountOwed : 0;

  const handleConfirmDayClose = () => {
    if (!currentBill) return;

    // คิดยอดเฉพาะของวันนี้ออกมาก่อน
    const { totalSales, amountOwed: todayAmountOwed } = calculateBillTotals(currentBill, products, currentMember);

    // ยอดค้างสุทธิรวมสะสมที่จะบันทึกจริง = ยอดค้างวันนี้ + ยอดค้างเก่าสะสม
    const finalAmountOwed = todayAmountOwed + previousOwed;

    updateBill(currentBill.id, { 
      totalSales: totalSales, 
      amountOwed: finalAmountOwed, // เซฟยอดค้างสุทธิรวมสะสมที่แท้จริง
      status: 'completed'          
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

    // คิดยอดขายของวันนี้ทั้งหมดแบบยังไม่หักเงินจ่าย
    const { totalSales } = calculateBillTotals(currentBill, products, currentMember);

    // ยอดที่ต้องจ่ายเพื่อให้เคลียร์หนี้จบ
    const totalToPayFull = Math.round(totalSales + previousOwed);

    updateBill(selectedBillId, { amountPaid: totalToPayFull });
  }, [currentBill, products, currentMember, selectedBillId, updateBill, previousOwed]);

  // Navigate between members
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

  // Navigate between bills
  const currentBillIndex = memberBillsToday.findIndex((b) => b.id === selectedBillId);

  // Calculate totals
  const billTotals = currentBill ? calculateBillTotals(currentBill, products, currentMember) : { totalSales: 0, amountOwed: 0 };
  const totalOld = currentBill?.items.reduce((sum, i) => sum + i.oldStock, 0) || 0;
  const totalNew = currentBill?.items.reduce((sum, i) => sum + i.newStock, 0) || 0;
  const totalStock = currentBill?.items.reduce((sum, i) => sum + i.totalStock, 0) || 0;
  const totalReturned = currentBill?.items.reduce((sum, i) => sum + i.returned, 0) || 0;
  const totalSold = currentBill?.items.reduce((sum, i) => sum + i.sold, 0) || 0;

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
                <button 
                    onClick={handleNextDate} 
                    // เอา disabled และเงื่อนไขสามส่วน (Ternary) ของคลาสออก เพื่อให้กดได้ตลอดเวลา
                    className="text-muted-foreground hover:text-foreground p-0.5"
                  >
                    <ChevronRight className="w-3 h-3" />
                  </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/settings">
              <Button variant="outline" size="sm">
                <Save className="w-4 h-4 mr-1" />
                บันทึก
              </Button>
            </Link>
            <Button size="sm" onClick={() => setShowMemberSelectModal(true)} className="bg-primary">
              <Plus className="w-4 h-4 mr-1" />
              เพิ่ม
            </Button>
          </div>

        </div>

        {/* Member Tabs */}
        {/* Bill Tabs */}
        <div className="px-4 pb-2 overflow-x-auto">
          <div className="flex items-center gap-2 min-w-max">

            {/* Existing Bills */}
            {activeMembers
              .filter((member) =>
                bills.some(
                  (b) =>
                    b.memberId === member.id &&
                    b.date === selectedDate
                )
              )
              .flatMap((member) => {
              const memberBills = bills.filter(
                (b) =>
                  b.memberId === member.id &&
                  b.date === selectedDate
              );

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

            {/* Add Bill */}
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

        <Dialog
          open={showMemberSelectModal}
          onOpenChange={setShowMemberSelectModal}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>เลือกสมาชิก</DialogTitle>
            </DialogHeader>

            <div className="space-y-2">
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
        
        {/* Mode Tabs */}
        <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-muted">
            <TabsTrigger value="checkout">เบิกสินค้า</TabsTrigger>
            <TabsTrigger value="return">บันทึกยอด</TabsTrigger>
          </TabsList>
        </Tabs>

      </header>

      {/* Content */}
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

            {/* Buyer Name Input */}
            {/* <div>
              <Label className="text-sm text-muted-foreground">ชื่อ:</Label>
              <Input
                value={currentBill.buyerName || ''}
                onChange={(e) => handleBillFieldChange('buyerName', e.target.value)}
                placeholder="กรอกชื่อผู้ขาย..."
                disabled={currentBill.status === 'completed'}
                className="mt-1"
              />
            </div> */}

            {/* Additional Info - shown in checkout mode */}
            {mode === 'checkout' && (
              <>
                {/* Product Table */}
                <ProductTable
                  bill={currentBill}
                  products={products}
                  mode={mode}
                  readOnly={currentBill.status === 'completed'}
                  onItemChange={handleItemChange}
                />
                </>
            )}

            {/* Additional Info - shown in return mode */}
            {mode === 'return' && (
              <Card className="border-border">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Calculator className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">กรอกยอดรวมรายชนิด</h3>
                      <p className="text-xs text-muted-foreground">ตรวจสอบยอดขายแยกตามประเภทสินค้า</p>
                    </div>
                  </div>

                  <div className="space-y-4 pt-2 border-t border-border">
                    {Array.from(
                      new Set(
                        products
                          .filter((p) => p.type !== 'D' && p.type !== 'Car' && p.type !== 'House')
                          .map((p) => p.type)
                      )
                    ).map((type) => {
                      const typeProducts = products.filter(
                        (p) =>
                          p.type === type &&
                          p.type !== 'D'
                      );

                      const typeItems = currentBill.items.filter((item) =>
                        typeProducts.some((p) => p.id === item.productId)
                      );

                      // ระบบนับขาย
                      const systemSoldTotal = typeItems.reduce(
                        (sum, i) => sum + i.sold,
                        0
                      );

                      if (typeItems.length === 0) return null;

                      return (
                        <div
                          key={type}
                          className="grid grid-cols-12 items-center gap-2"
                        >
                          <Label className="col-span-6 text-sm font-medium text-muted-foreground truncate">
                            {type}
                          </Label>

                          <div className="col-span-6 flex items-center gap-2">
                            <Input
                              type="number"
                              placeholder={`ระบบนับ: ${systemSoldTotal}`}
                              disabled={currentBill.status === 'completed'}
                              className="text-right h-9"
                              value={
                                currentBill.returnInputs?.[type] != null
                                  ? currentBill.returnInputs[type]
                                  : ''
                              }
                              onChange={(e) => {
                                const val = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0;
                                updateBill(selectedBillId, {
                                  returnInputs: { ...currentBill.returnInputs, [type]: val },
                                });
                              }}
                            />

                            <span className="text-xs text-muted-foreground shrink-0">
                              ชิ้น
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                </CardContent>
              </Card>
            )}

            {/* Summary Card - Checkout Mode */}
            {mode === 'checkout' && (
              <Card className="border-primary/30 bg-card">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Package className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">สรุปยอดเบิก</h3>
                      <p className="text-xs text-muted-foreground">เก่า + ใหม่ = รวม</p>
                    </div>
                  </div>

                  {/* Summary by type */}
                  <div className="space-y-2 py-3 border-t border-border">
                    {Array.from(
                      new Set(
                        products
                          .filter((p) => p.type !== 'D')
                          .map((p) => p.type)
                      )
                    ).map((type) => {
                      const typeProducts = products.filter(
                        (p) => p.type === type && p.type !== 'D'
                      );

                      const typeItems = currentBill.items.filter((item) =>
                        typeProducts.some((p) => p.id === item.productId)
                      );

                      const typeOld = typeItems.reduce(
                        (sum, i) => sum + i.oldStock,
                        0
                      );

                      const typeNew = typeItems.reduce(
                        (sum, i) => sum + i.newStock,
                        0
                      );

                      const typeTotal = typeItems.reduce(
                        (sum, i) => sum + i.totalStock,
                        0
                      );

                      if (typeTotal === 0 && typeNew === 0) return null;

                      return (
                        <div
                          key={type}
                          className="flex justify-between items-center text-sm"
                        >
                          <span className="text-muted-foreground">
                            {type}
                          </span>

                          <span>
                            <span className="text-muted-foreground">
                              {typeOld}
                            </span>

                            <span className="text-muted-foreground mx-1">
                              +
                            </span>

                            <span>{typeNew}</span>

                            <span className="text-muted-foreground mx-1">
                              =
                            </span>

                            <span className="font-semibold text-primary">
                              {typeTotal}
                            </span>
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-3 border-t border-border">
                    <div className="flex justify-between items-center">
                      <span className="font-bold">รวมทั้งหมด</span>
                      <span className="text-sm">
                        <span className="text-muted-foreground">{totalOld}</span>
                        <span className="text-muted-foreground mx-1">+</span>
                        <span className="text-foreground">{totalNew}</span>
                        <span className="text-muted-foreground mx-1">=</span>
                        <span className="text-xl font-bold text-primary">{totalStock}</span>
                        <span className="text-xs text-muted-foreground ml-1">ชิ้น</span>
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
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

            {/* Summary Card - Return Mode */}
            {mode === 'return' && (
              <>
                {/* Sales Summary */}
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

                      {/* ===== แถวราคาแยกตาม type ===== */}
                      {Array.from(new Set(products.map((p) => p.type)))
                        .filter((type) => type !== 'D' && type !== 'Car' && type !== 'House')
                        .map((type) => {
                          const memberClass = currentMember?.class ?? 'In';
                          const typeProducts = products.filter((p) => p.type === type);
                          const typeItems = currentBill.items.filter((item) =>
                            typeProducts.some((p) => p.id === item.productId)
                          );
                          const typeStock = typeItems.reduce((sum, i) => sum + i.totalStock, 0);
                          if (typeStock === 0) return null;

                          const returnedInput = currentBill.returnInputs?.[type] ?? 0;
                          const actualSold = typeStock - returnedInput;

                          // เลือกราคาตาม member.class
                          const baseProduct = typeProducts[0];
                          let price = 0;
                          if (memberClass === 'Out') price = baseProduct?.priceOut || 0;
                          else if (memberClass === 'WalkIn') price = baseProduct?.priceWorkIn || 0;
                          else price = baseProduct?.priceIn || 0;

                          return (
                            <div key={type} className="flex justify-between items-center">
                              <span className="font-medium text-sm">{type}</span>
                              <span className="text-sm">
                                <span className="text-muted-foreground">
                                  ( {typeStock} - {returnedInput} )
                                </span>
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

                      {/* ===== House plan (In เท่านั้น) ===== */}
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

                      {/* ===== Car plan (In เท่านั้น) ===== */}
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
                        const totalPrice = quantity * dProduct.priceIn;

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


                      {/* ===== Member class badge ===== */}
                      {currentMember?.class && currentMember.class !== 'In' && (
                        <div className="flex justify-end pt-1">
                          <span className={cn(
                            'text-xs px-2 py-0.5 rounded-full font-medium',
                            currentMember.class === 'Out'
                              ? 'bg-chart-2/15 text-chart-2'
                              : 'bg-orange-500/15 text-orange-600'
                          )}>
                            {currentMember.class === 'Out' ? '💼 ราคา Out' : '🚶 ราคา Walk-in'}
                          </span>
                        </div>
                      )}

                    </div>

                    {/* ===== สร้างตัวแปรคำนวณยอดรวมใหม่ (บวกน้ำแข็งแห้งแล้ว) ไว้ใช้งานแทน ===== */}
                    {(() => {
                      const dProduct = products.find((p) => p.type === 'D');
                      const dItem = currentBill?.items?.find((item) => item.productId === dProduct?.id);
                      const quantity = dItem?.totalStock || 0;
                      const iceTotalPrice = dProduct ? quantity * dProduct.priceIn : 0;

                      // คำนวณยอดใหม่เก็บในตัวแปรแยกต่างหาก ไม่ Reassign ทับตัวแปร const หลัก
                      const finalTotalSales = billTotals.totalSales 
                      const finalAmountOwed = finalTotalSales - (currentBill.amountPaid || 0);

                      // นำตัวแปรชุดนี้ไปเซ็ตใส่ window object เพื่อให้โค้ด Payment Card ด้านล่างดึงไปใช้ได้ถูกต้อง
                      (window as any).__finalTotalSales = finalTotalSales;
                      (window as any).__finalAmountOwed = finalAmountOwed;

                      return (
                        <div className="flex justify-between items-center pt-3 border-t border-border mt-2">
                          <span className="font-semibold">ยอดเงินรวม</span>
                          <span className="text-3xl font-bold text-primary">
                            {Math.round(finalTotalSales).toLocaleString()} บาท
                          </span>
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>


                {/* Payment Card */}
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
                      {/* 🏠 เพิ่มช่องแสดงค้างเก่า (Read-only) */}
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
                            onChange={(e) =>
                              handleBillFieldChange('amountPaid', parseFloat(e.target.value) || 0)
                            }
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

                      {/* คำนวณยอดค้างสุทธิใหม่: (ยอดขายวันนี้ + น้ำแข็งแห้ง + ค้างเก่า) - ยอดจ่าย */}
                      {(() => {
                        // เรียกคำนวณยอดเฉพาะของวันนี้
                        const { totalSales } = calculateBillTotals(currentBill, products, currentMember);

                        // ยอดค้างสุทธิรวม = (ยอดขายวันนี้ + ยอดค้างเก่า) - ยอดที่จ่ายมาวันนี้
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

                      {/* Action Buttons ... */}
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

      {/* Sticky Footer Navigation */}
      <footer className="fixed bottom-0 left-0 right-0 z-20 bg-card border-t border-border">
        <div className="flex items-center justify-between px-4 py-2">
          <button
            onClick={handlePrevMember}
            disabled={currentMemberIndex <= 0}
            className={cn(
              'flex items-center gap-1 text-sm py-2',
              currentMemberIndex <= 0 ? 'text-muted-foreground/50' : 'text-foreground'
            )}
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
            className={cn(
              'flex items-center gap-1 text-sm py-2',
              currentMemberIndex >= activeMembers.length - 1 ? 'text-muted-foreground/50' : 'text-foreground'
            )}
          >
            เพิ่ม
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </footer>

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
