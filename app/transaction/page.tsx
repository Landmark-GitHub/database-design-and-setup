'use client';

import { useMemo, useState } from 'react';
import { useStore } from '@/lib/store';
import { PRODUCT_TYPE_LABELS } from '@/lib/types';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Calendar, Users, TrendingUp, Package, CreditCard, Edit3, Unlock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type TabType = 'transaction' | 'typeSummary' | 'payment';

interface EditModalState {
  isOpen: boolean;
  billId: string;
  memberName: string;
  amountPaid: number;
}

export default function TransactionPage() {
  const bills = useStore((s) => s.bills);
  const allProducts = useStore((s) => s.products);
  const members = useStore((s) => s.members);
  
  const updateBill = useStore((s) => s.updateBill);

  const handleRevertBillStatus = (billId: string, memberName: string) => {
    const confirmRevert = window.confirm(
      `คุณแน่ใจหรือไม่ที่จะ "ปลดล็อกบิล" ของ "${memberName}"?\n(บิลจะถูกเปลี่ยนสถานะกลับไปเป็น 'กำลังเบิก/ร่าง' เพื่อให้แก้ไขข้อมูลใหม่ได้)`
    );
    
    if (confirmRevert) {
      updateBill(billId, { status: 'draft' });
      alert(`ปลดล็อกบิลของ ${memberName} สำเร็จแล้ว!`);
    }
  };

  // States
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedMemberId, setSelectedMemberId] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<TabType>('transaction');

  const [editModal, setEditModal] = useState<EditModalState>({
    isOpen: false,
    billId: '',
    memberName: '',
    amountPaid: 0,
  });

  const openEditModal = (billId: string, memberName: string, currentPaid: number) => {
    setEditModal({
      isOpen: true,
      billId,
      memberName,
      amountPaid: currentPaid,
    });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    updateBill(editModal.billId, { amountPaid: Number(editModal.amountPaid) });
    setEditModal((prev) => ({ ...prev, isOpen: false }));
  };

  // Filter logic
  const membersWithBillsToday = useMemo(() => {
    const dailyBills = bills.filter((bill) => bill.date === selectedDate);
    const uniqueMembers = Array.from(new Set(dailyBills.map((b) => b.memberId)));
    return uniqueMembers.map((mId) => {
      const match = members.find((m) => m.id === mId);
      return {
        id: mId,
        name: match ? match.name : dailyBills.find((b) => b.memberId === mId)?.memberName || 'ไม่ระบุชื่อ',
      };
    });
  }, [bills, selectedDate, members]);

  const filteredBills = useMemo(() => {
    let result = bills.filter((bill) => bill.date === selectedDate);
    if (selectedMemberId !== 'all') {
      result = result.filter((bill) => bill.memberId === selectedMemberId);
    }
    return result;
  }, [bills, selectedDate, selectedMemberId]);

  const summary = useMemo(() => {
    return filteredBills.reduce(
      (acc, bill) => {
        acc.totalSales += bill.totalSales || 0;
        acc.totalPaid += bill.amountPaid || 0;
        acc.totalOwed += bill.amountOwed || 0;
        return acc;
      },
      { totalSales: 0, totalPaid: 0, totalOwed: 0 }
    );
  }, [filteredBills]);

  const recordSummaryByType = useMemo(() => {
    const result: Array<{
      memberName: string;
      date: string;
      type: string;
      typeName: string;
      oldStock: number;
      newStock: number;
      totalStock: number;
      returned: number;
      sold: number;
      netPrice: number;
    }> = [];

    filteredBills.forEach((bill) => {
      const member = members.find((m) => m.id === bill.memberId);
      const memberClass = member?.class ?? 'In';

      const distinctTypes = Array.from(
        new Set(allProducts.filter((p) => p.type !== 'Car' && p.type !== 'House' && p.type !== 'D').map((p) => p.type))
      );

      distinctTypes.forEach((type) => {
        const typeProducts = allProducts.filter((p) => p.type === type);
        const typeItems = bill.items.filter((item) => typeProducts.some((p) => p.id === item.productId));

        const oldStockGroup = typeItems.reduce((sum, i) => sum + (i.oldStock || 0), 0);
        const newStockGroup = typeItems.reduce((sum, i) => sum + (i.newStock || 0), 0);
        const totalStockGroup = typeItems.reduce((sum, i) => sum + (i.totalStock || 0), 0);
        
        const returnedGroup = bill.returnInputs?.[type] || 0;
        const soldGroup = Math.max(0, totalStockGroup - returnedGroup);

        const baseProduct = typeProducts[0];
        let price = 0;
        if (memberClass === 'Out') price = baseProduct?.priceOut || 0;
        else if (memberClass === 'WalkIn') price = baseProduct?.priceWorkIn || 0;
        else price = baseProduct?.priceIn || 0;

        const netPrice = soldGroup * price;

        if (totalStockGroup > 0 || soldGroup > 0) {
          result.push({
            memberName: bill.memberName,
            date: bill.date,
            type,
            typeName: PRODUCT_TYPE_LABELS[type as keyof typeof PRODUCT_TYPE_LABELS] || type,
            oldStock: oldStockGroup,
            newStock: newStockGroup,
            totalStock: totalStockGroup,
            returned: returnedGroup,
            sold: soldGroup,
            netPrice,
          });
        }
      });
    });

    return result;
  }, [filteredBills, allProducts, members]);

  const formatDateThai = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('th-TH', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ChevronLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="font-bold text-foreground">บันทึกรายวัน</h1>
              <p className="text-xs text-muted-foreground">ตรวจสอบข้อมูลเบิกคลัง & สรุปยอด</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 space-y-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 bg-card p-4 rounded-2xl border shadow-sm">
          <div className="flex-1">
            <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1 mb-2">
              <Calendar className="w-3 h-3" /> เลือกวันที่
            </Label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setSelectedMemberId('all');
              }}
              className="w-full border rounded-xl px-3 py-2 bg-background font-medium focus:outline-none focus:ring-2 focus:ring-primary text-sm h-10"
            />
          </div>

          <div className="flex-1">
            <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1 mb-2">
              <Users className="w-3 h-3" /> เลือกสมาชิก
            </Label>
            <select
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="w-full border rounded-xl px-3 py-2 bg-background font-medium focus:outline-none focus:ring-2 focus:ring-primary text-sm h-10 cursor-pointer"
            >
              <option value="all">ทุกคน ({membersWithBillsToday.length} คน)</option>
              {membersWithBillsToday.map((member) => (
                <option key={member.id} value={member.id}>{member.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Date display */}
        <div className="text-center">
          <p className="text-lg font-semibold text-primary">{formatDateThai(selectedDate)}</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl border p-5 bg-card shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">ยอดขายรวม</p>
            </div>
            <h2 className="text-3xl font-extrabold text-primary">{Math.round(summary.totalSales).toLocaleString()} บ.</h2>
          </div>
          
          <div className="rounded-2xl border p-5 bg-card shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">จ่ายเงินแล้ว</p>
            </div>
            <h2 className="text-3xl font-extrabold text-green-600">{Math.round(summary.totalPaid).toLocaleString()} บ.</h2>
          </div>
          
          <div className="rounded-2xl border p-5 bg-card shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                <Package className="w-5 h-5 text-red-500" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">ยอดค้างชำระ</p>
            </div>
            <h2 className="text-3xl font-extrabold text-red-500">{Math.round(summary.totalOwed).toLocaleString()} บ.</h2>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-muted gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('transaction')}
            className={`px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${activeTab === 'transaction' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            ยอดเบิกสินค้า
          </button>
          <button
            onClick={() => setActiveTab('typeSummary')}
            className={`px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${activeTab === 'typeSummary' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            รวมยอดตาม Type
          </button>
          <button
            onClick={() => setActiveTab('payment')}
            className={`px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${activeTab === 'payment' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            ยอดชำระ & จัดการ
          </button>
        </div>

        {/* Tab Content */}
        <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
          
          {/* Tab: Transaction */}
          {activeTab === 'transaction' && (
            <div>
              <div className="p-4 border-b bg-muted/20">
                <h3 className="font-semibold text-lg">รายการเบิกสินค้า (Transaction)</h3>
                <p className="text-xs text-muted-foreground">แสดงเฉพาะรายการที่มีการเบิกสินค้าใหม่</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-muted-foreground">
                    <tr>
                      <th className="text-left p-3">ชื่อ</th>
                      <th className="text-left p-3">วันที่</th>
                      <th className="text-left p-3">สินค้า</th>
                      <th className="text-center p-3">จำนวน (เบิกเพิ่ม)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredBills.length === 0 ? (
                      <tr><td colSpan={4} className="text-center p-8 text-muted-foreground">ไม่มีข้อมูลรายการเบิก</td></tr>
                    ) : (
                      filteredBills.flatMap((bill) =>
                        bill.items.filter((item) => item.newStock > 0).map((item, idx) => (
                          <tr key={`${bill.id}-${item.productId}-${idx}`} className="hover:bg-muted/30">
                            <td className="p-3 font-semibold">{bill.memberName}</td>
                            <td className="p-3 text-muted-foreground">{bill.date}</td>
                            <td className="p-3">{item.productName}</td>
                            <td className="text-center p-3 font-bold text-blue-600">+{item.newStock} ชิ้น</td>
                          </tr>
                        ))
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab: Type Summary */}
          {activeTab === 'typeSummary' && (
            <div>
              <div className="p-4 border-b bg-muted/20">
                <h3 className="font-semibold text-lg">สรุปยอดแยกตามประเภท (Record Item)</h3>
                <p className="text-xs text-muted-foreground">ยอดเก่า + ยอดใหม่ = ยอดรวม → ยอดเหลือ → ยอดขาย</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-muted-foreground">
                    <tr>
                      <th className="text-left p-3">ชื่อ</th>
                      <th className="text-left p-3">ชนิด</th>
                      <th className="text-center p-3">ยอดเก่า</th>
                      <th className="text-center p-3">ยอดใหม่</th>
                      <th className="text-center p-3">ยอดรวม</th>
                      <th className="text-center p-3 text-orange-600">ยอดเหลือ</th>
                      <th className="text-center p-3 text-green-600">ยอดขาย</th>
                      <th className="text-right p-3 font-bold text-primary">สุทธิ (บาท)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {recordSummaryByType.length === 0 ? (
                      <tr><td colSpan={8} className="text-center p-8 text-muted-foreground">ไม่มีข้อมูล</td></tr>
                    ) : (
                      recordSummaryByType.map((item, idx) => (
                        <tr key={`${item.memberName}-${item.type}-${idx}`} className="hover:bg-muted/30">
                          <td className="p-3 font-semibold">{item.memberName}</td>
                          <td className="p-3">
                            <span className="px-2 py-1 text-xs rounded-md bg-secondary font-medium">{item.typeName}</span>
                          </td>
                          <td className="text-center p-3 text-muted-foreground">{item.oldStock}</td>
                          <td className="text-center p-3 text-blue-600">+{item.newStock}</td>
                          <td className="text-center p-3 font-medium">{item.totalStock}</td>
                          <td className="text-center p-3 text-orange-600 font-bold">{item.returned}</td>
                          <td className="text-center p-3 text-green-600 font-semibold">{item.sold}</td>
                          <td className="text-right p-3 font-extrabold text-primary bg-primary/5">{Math.round(item.netPrice).toLocaleString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab: Payment */}
          {activeTab === 'payment' && (
            <div>
              <div className="p-4 border-b bg-muted/20">
                <h3 className="font-semibold text-lg">ยอดชำระเงิน & จัดการบิล</h3>
                <p className="text-xs text-muted-foreground">ตรวจสอบยอดเงินคงค้าง พร้อมปุ่มแก้ไข</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-muted-foreground">
                    <tr>
                      <th className="text-left p-3">ชื่อ</th>
                      <th className="text-center p-3">สถานะ</th>
                      <th className="text-right p-3">ยอดขาย</th>
                      <th className="text-right p-3 text-green-600">จ่ายแล้ว</th>
                      <th className="text-right p-3 text-orange-500">ค้างเก่า</th>
                      <th className="text-right p-3 text-red-500">ค้างใหม่</th>
                      <th className="text-center p-3">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredBills.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center p-8 text-muted-foreground">ไม่มีข้อมูล</td>
                      </tr>
                    ) : (
                      filteredBills.map((bill) => (
                        <tr key={bill.id} className="hover:bg-muted/30 transition-colors">
                          <td className="p-3 font-semibold">{bill.memberName}</td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                              bill.status === 'completed' ? 'bg-green-100 text-green-700' :
                              bill.status === 'checkout' ? 'bg-blue-100 text-blue-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              {bill.status === 'completed' ? 'ปิดวันแล้ว' :
                               bill.status === 'checkout' ? 'เบิกแล้ว' : 'ร่าง'}
                            </span>
                          </td>
                          <td className="text-right p-3 font-medium">
                            {Math.round(bill.totalSales).toLocaleString()} บ.
                          </td>
                          <td className="text-right p-3 text-green-600 font-bold">
                            {Math.round(bill.amountPaid).toLocaleString()} บ.
                          </td>
                          <td className="text-right p-3 text-orange-500">
                            {Math.round(bill.previousOwed || 0).toLocaleString()} บ.
                          </td>
                          <td className="text-right p-3 text-red-500 font-extrabold">
                            {Math.round(bill.amountOwed).toLocaleString()} บ.
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openEditModal(bill.id, bill.memberName, bill.amountPaid)}
                                className="h-8 text-xs"
                              >
                                <Edit3 className="w-3 h-3 mr-1" />
                                แก้ไข
                              </Button>
                              {(bill.status === 'completed' || bill.status === 'checkout') && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleRevertBillStatus(bill.id, bill.memberName)}
                                  className="h-8 text-xs text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                >
                                  <Unlock className="w-3 h-3 mr-1" />
                                  ปลดล็อก
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      <Dialog open={editModal.isOpen} onOpenChange={(open) => setEditModal(prev => ({ ...prev, isOpen: open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>แก้ไขยอดจ่ายเงิน - {editModal.memberName}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveEdit}>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="amountPaid">ยอดจ่ายเงิน (บาท)</Label>
                <Input
                  id="amountPaid"
                  type="number"
                  value={editModal.amountPaid}
                  onChange={(e) => setEditModal(prev => ({ ...prev, amountPaid: parseFloat(e.target.value) || 0 }))}
                  className="mt-1"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditModal(prev => ({ ...prev, isOpen: false }))}>
                ยกเลิก
              </Button>
              <Button type="submit">บันทึก</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}
