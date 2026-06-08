'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { getToday } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  ChevronLeft, 
  ChevronRight, 
  Trash2, 
  Home, 
  Plus, 
  Settings, 
  Banknote, 
  ClipboardList, 
  Tag,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';

export default function ExpensesPage() {
  const store = useStore();
  
  // สำหรับการคุมวันที่ย้อนหลัง/ไปข้างหน้า
  const [selectedDate, setSelectedDate] = useState<string>('');
  
  // สถานะฟอร์มเพิ่มรายจ่าย
  const [amount, setAmount] = useState<string>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [note, setNote] = useState<string>('');
  
  // สถานะฟอร์มการจัดการหมวดหมู่
  const [newCatName, setNewCatName] = useState<string>('');
  const [newCatIcon, setNewCatIcon] = useState<string>('📝');
  const [isManageCatOpen, setIsManageCatOpen] = useState<boolean>(false);

  // ควบคุม Dialog ยืนยันลบ
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleteType, setDeleteType] = useState<'expense' | 'category' | null>(null);

  // ตั้งค่าวันที่ปัจจุบันเมื่อเข้าหน้าจอครั้งแรก
  useEffect(() => {
    setSelectedDate(getToday());
  }, []);

  // เลื่อนวันไปข้างหน้า/หลัง
  const changeDate = (days: number) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + days);
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, '0');
    const day = String(current.getDate()).padStart(2, '0');
    setSelectedDate(`${year}-${month}-${day}`);
  };

  // คัดกรองรายจ่ายเฉพาะวันนั้นๆ
  const todayExpenses = store.expenses?.filter((e) => e.date === selectedDate) || [];
  
  // ยอดรวมรวมของวันปัจจุบัน
  const todayTotal = todayExpenses.reduce((sum, item) => sum + item.amount, 0);

  // บันทึกยอดรายจ่ายลงในตารางหลัก
  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0 || !selectedCategoryId) {
      alert('กรุณากรอกจำนวนเงินและเลือกหมวดหมู่ให้ครบถ้วน');
      return;
    }

    store.addExpense({
      date: selectedDate,
      categoryId: selectedCategoryId,
      amount: parseFloat(amount),
      note: note.trim() || undefined,
    });

    // รีเซ็ตค่าในฟอร์มเมื่อบันทึกเสร็จ
    setAmount('');
    setNote('');
  };

  // จัดการเพิ่มหมวดหมู่ใหม่
  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    store.addExpenseCategory(newCatName.trim(), newCatIcon);
    setNewCatName('');
    setNewCatIcon('📝');
  };

  // ประมวลผลเมื่อกดยืนยันการลบตัวเลือก (ทั้งรายการจ่าย และ หมวดหมู่)
  const handleConfirmDelete = () => {
    if (!deleteTargetId) return;

    if (deleteType === 'expense') {
      store.deleteExpense(deleteTargetId);
    } else if (deleteType === 'category') {
      store.deleteExpenseCategory(deleteTargetId);
      if (selectedCategoryId === deleteTargetId) {
        setSelectedCategoryId('');
      }
    }

    setDeleteTargetId(null);
    setDeleteType(null);
  };

  // รูปแบบแสดงวันที่ภาษาไทย
  const formatDateThai = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    });
  };

  return (
    <main className="container mx-auto p-4 max-w-6xl space-y-6">
      
      {/* ส่วนหัวหน้าจอ */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-4 rounded-xl border shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button variant="outline" size="icon" className="h-9 w-9">
              <Home className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight">บันทึกรายจ่ายประจำวัน</h1>
            <p className="text-sm text-muted-foreground">ลงบันทึกควบคุมต้นทุนและค่าใช้จ่ายในร้าน</p>
          </div>
        </div>

        {/* ตัวเลือกเปลี่ยนวันที่ */}
        <div className="flex items-center gap-2 bg-muted p-1 rounded-lg w-full sm:w-auto justify-between">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => changeDate(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium px-3 min-w-[140px] text-center">
            {formatDateThai(selectedDate)}
          </span>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => changeDate(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* บล็อกแสดงยอดรวมสรุปแบบเร่งด่วน */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-l-4 border-l-destructive">
          <CardContent className="flex items-center gap-4 py-4">
            <div className="p-3 bg-destructive/10 text-destructive rounded-lg">
              <Banknote className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">ยอดรวมรายจ่ายของวันนี้</p>
              <h3 className="text-2xl font-bold text-destructive">
                {todayTotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท
              </h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="flex items-center gap-4 py-4">
            <div className="p-3 bg-orange-500/10 text-orange-500 rounded-lg">
              <ClipboardList className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">รายการที่ลงบันทึก</p>
              <h3 className="text-2xl font-bold text-orange-500">{todayExpenses.length} รายการ</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ส่วนแสดงส่วนการทำงานหลักแบ่งเป็น ฟอร์ม และ ตาราง */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* บล็อกที่ 1: ฟอร์มเพิ่มข้อมูล (ฝั่งซ้าย) */}
        <div className="lg:col-span-5 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-base font-semibold">➕ เพิ่มรายการจ่ายใหม่</CardTitle>
              
              {/* ปุ่มเปิดหน้าต่าง จัดการหมวดหมู่ (เพิ่ม/ลบ) */}
              <Dialog open={isManageCatOpen} onOpenChange={setIsManageCatOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1 text-xs">
                    <Settings className="h-3 w-3" /> ตั้งค่าหมวดหมู่
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>⚙️ จัดการหมวดหมู่รายจ่าย</DialogTitle>
                  </DialogHeader>
                  
                  {/* ฟอร์มเพิ่มหมวดหมู่ย่อยใน Dialog */}
                  <form onSubmit={handleCreateCategory} className="flex items-end gap-2 pt-2 border-b pb-4">
                    <div className="grid gap-1.5 flex-1">
                      <Label htmlFor="catName" className="text-xs">ชื่อหมวดหมู่ใหม่</Label>
                      <div className="flex gap-1">
                        <Input 
                          id="catIcon"
                          value={newCatIcon}
                          onChange={(e) => setNewCatIcon(e.target.value)}
                          className="w-12 text-center px-1"
                          placeholder="ไอคอน"
                        />
                        <Input 
                          id="catName"
                          value={newCatName}
                          onChange={(e) => setNewCatName(e.target.value)}
                          placeholder="เช่น ค่าน้ำไฟ, ค่าแพ็คเกจ"
                        />
                      </div>
                    </div>
                    <Button type="submit" size="sm" className="gap-1">
                      <Plus className="h-3 w-3" /> เพิ่ม
                    </Button>
                  </form>

                  {/* ลิสต์รายการหมวดหมู่ที่มีอยู่และปุ่มลบ */}
                  <div className="space-y-2 max-h-60 overflow-y-auto pt-2">
                    <Label className="text-xs text-muted-foreground">หมวดหมู่ทั้งหมดในระบบ</Label>
                    {store.expenseCategories?.length === 0 ? (
                      <p className="text-center text-xs text-muted-foreground py-4">ไม่มีหมวดหมู่รายจ่ายในระบบ</p>
                    ) : (
                      store.expenseCategories?.map((cat) => (
                        <div key={cat.id} className="flex justify-between items-center bg-muted p-2 rounded-lg text-sm">
                          <span className="flex items-center gap-2">
                            <span>{cat.icon || '📝'}</span>
                            <span>{cat.name}</span>
                          </span>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 text-destructive hover:bg-destructive/10"
                            onClick={() => {
                              setDeleteTargetId(cat.id);
                              setDeleteType('category');
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </DialogContent>
              </Dialog>

            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveExpense} className="space-y-4">
                
                {/* จำนวนเงิน */}
                <div className="space-y-1.5">
                  <Label htmlFor="amount">จำนวนเงิน (บาท)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="text-lg font-semibold"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                </div>

                {/* เลือกหมวดหมู่แบบปุ่มคลิกใช้งานง่าย */}
                <div className="space-y-1.5">
                  <Label>เลือกประเภทรายจ่าย</Label>
                  {store.expenseCategories?.length === 0 ? (
                    <div className="text-xs text-amber-600 bg-amber-50 p-3 rounded-lg flex items-center gap-2 border border-amber-200">
                      <AlertCircle className="h-4 w-4" />
                      <span>กรุณากดปุ่ม <b>"ตั้งค่าหมวดหมู่"</b> เพื่อเพิ่มหมวดหมู่ก่อน</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1 border rounded-lg">
                      {store.expenseCategories?.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setSelectedCategoryId(cat.id)}
                          className={`flex items-center gap-2 p-2.5 rounded-lg border text-left text-xs transition-all ${
                            selectedCategoryId === cat.id
                              ? 'bg-primary text-primary-foreground border-primary shadow-sm font-medium'
                              : 'bg-card hover:bg-muted text-card-foreground border-input'
                          }`}
                        >
                          <span className="text-sm">{cat.icon || '📝'}</span>
                          <span className="truncate">{cat.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* บันทึกช่วยจำ */}
                <div className="space-y-1.5">
                  <Label htmlFor="note">หมายเหตุ / บันทึกช่วยจำ</Label>
                  <Input
                    id="note"
                    placeholder="ระบุคำอธิบายเพิ่มเติม (ถ้ามี)"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>

                <Button type="submit" className="w-full mt-2" disabled={store.expenseCategories?.length === 0}>
                  💾 บันทึกรายจ่าย
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* บล็อกที่ 2: ตารางแสดงรายการจ่ายของวันปัจจุบัน (ฝั่งขวา) */}
        <div className="lg:col-span-7">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">📋 รายการที่จ่ายวันนี้</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs bg-muted text-muted-foreground uppercase">
                    <tr>
                      <th className="p-3 font-semibold">เวลา</th>
                      <th className="p-3 font-semibold">ประเภท</th>
                      <th className="p-3 font-semibold">รายละเอียด</th>
                      <th className="p-3 font-semibold text-right">จำนวนเงิน</th>
                      <th className="p-3 text-center font-semibold">ลบ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {todayExpenses.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-muted-foreground text-xs">
                          ยังไม่มีการลงบันทึกรายจ่ายสำหรับวันนี้
                        </td>
                      </tr>
                    ) : (
                      todayExpenses.map((item) => {
                        const category = store.expenseCategories?.find((c) => c.id === item.categoryId);
                        const timeStr = new Date(item.createdAt).toLocaleTimeString('th-TH', {
                          hour: '2-digit',
                          minute: '2-digit',
                        });
                        return (
                          <tr key={item.id} className="hover:bg-muted/50 transition-colors">
                            <td className="p-3 text-xs text-muted-foreground">{timeStr} น.</td>
                            <td className="p-3">
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs bg-secondary font-medium">
                                <span>{category?.icon || '📝'}</span>
                                <span>{category?.name || 'ไม่ทราบประเภท'}</span>
                              </span>
                            </td>
                            <td className="p-3 max-w-[180px] truncate text-xs" title={item.note}>
                              {item.note || '-'}
                            </td>
                            <td className="p-3 text-right font-medium text-destructive">
                              -{item.amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="p-3 text-center">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                onClick={() => {
                                  setDeleteTargetId(item.id);
                                  setDeleteType('expense');
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>

      {/* ส่วนปิดท้าย: หน้าต่างเตือนยืนยันลบข้อมูลแบบครอบคลุม (Global Delete Alert Dialog) */}
      <AlertDialog 
        open={deleteTargetId !== null} 
        onOpenChange={(isOpen) => !isOpen && { setDeleteTargetId: null, setDeleteType: null }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>คุณแน่ใจหรือไม่ที่จะลบข้อมูลนี้?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteType === 'category' 
                ? 'การลบหมวดหมู่นี้ จะส่งผลให้รายการบันทึกรายจ่ายทั้งหมดที่เชื่อมโยงกับหมวดหมู่นี้ถูกลบออกจากระบบด้วยโดยอัตโนมัติ และไม่สามารถกู้กลับคืนมาได้'
                : 'ข้อมูลบันทึกรายจ่ายรายการนี้จะถูกลบออกถาวรจากยอดสรุปประจำวัน'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setDeleteTargetId(null); setDeleteType(null); }}>
              ยกเลิก
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              ยืนยันการลบ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </main>
  );
}