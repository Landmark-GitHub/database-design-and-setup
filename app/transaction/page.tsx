'use client';

import { useMemo, useState } from 'react';
import { useStore } from '@/lib/store';
import { PRODUCT_TYPE_LABELS } from '@/lib/types';

type TabType = 'transaction' | 'typeSummary' | 'payment';

interface EditModalState {
  isOpen: boolean;
  billId: string;
  memberName: string;
  amountPaid: number;
}

export default function LedgerPage() {
  const bills = useStore((s) => s.bills);
  const allProducts = useStore((s) => s.products);
  const members = useStore((s) => s.members);
  
  // เรียก Actions จาก Zustand Store มาใช้ทั้งแก้ไขยอดเงินและลบบิล
  const updateBill = useStore((s) => s.updateBill);
  const deleteBill = useStore((s) => s.deleteBill);

  // ฟังก์ชันเปลี่ยนจากลบข้อมูล -> เป็นการส่งบิลกลับไปแก้ไข (คืนสถานะเป็น draft หรือ checkout)
    const handleRevertBillStatus = (billId: string, memberName: string) => {
    const confirmRevert = window.confirm(
        `คุณแน่ใจหรือไม่ที่จะ "ปลดล็อกบิล" ของ "${memberName}"?\n(บิลจะถูกเปลี่ยนสถานะกลับไปเป็น 'กำลังเบิก/ร่าง' เพื่อให้แก้ไขข้อมูลใหม่ได้)`
    );
    
    if (confirmRevert) {
        // ใช้ updateBill อัปเดตสถานะกลับไปเป็น 'draft' หรือ 'checkout' ตามที่ต้องการ
        updateBill(billId, {
        status: 'draft', // หรือเปลี่ยนเป็น 'checkout' ตามเวิร์กโฟลว์ของระบบคุณ
        });
        
        alert(`ปลดล็อกบิลของ ${memberName} สำเร็จแล้ว! บิลนี้จะเปลี่ยนเป็นสถานะ Draft`);
    }
    };

  // ==========================================
  // STATES
  // ==========================================
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedMemberId, setSelectedMemberId] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<TabType>('transaction');

  // State สำหรับควบคุมหน้าต่างจัดการแก้ไขข้อมูล (Modal Form)
  const [editModal, setEditModal] = useState<EditModalState>({
    isOpen: false,
    billId: '',
    memberName: '',
    amountPaid: 0,
  });

  // ==========================================
  // HANDLER FUNCTIONS
  // ==========================================
  const handleDeleteBill = (billId: string, memberName: string) => {
    const confirmDelete = window.confirm(`คุณแน่ใจหรือไม่ที่จะลบบิลของ "${memberName}" ในวันที่ ${selectedDate}? \n(การลบข้อมูลนี้จะไม่สามารถกู้คืนได้)`);
    if (confirmDelete) {
      deleteBill(billId);
    }
  };

  // ฟังก์ชันเปิด Modal พร้อมโหลดข้อมูลเดิมเข้าไปใน Form
  const openEditModal = (billId: string, memberName: string, currentPaid: number) => {
    setEditModal({
      isOpen: true,
      billId,
      memberName,
      amountPaid: currentPaid,
    });
  };

  // ฟังก์ชันบันทึกข้อมูลแก้ไขจาก Modal Form ไปยัง Zustand Store
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // อัปเดตข้อมูลเข้าไปที่ Store โดยส่งค่าตัวเลขจำนวนเงินที่กรอกใหม่เข้าไป
    updateBill(editModal.billId, {
      amountPaid: Number(editModal.amountPaid),
    });

    // ปิด Modal หลังบันทึกสำเร็จ
    setEditModal((prev) => ({ ...prev, isOpen: false }));
  };

  // ==========================================
  // FILTER BILLS & SUMMARIES LOGIC
  // ==========================================
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
            typeName: PRODUCT_TYPE_LABELS[type] || type,
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

  return (
    <main className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* HEADER SECTION & FILTERS */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-card p-4 rounded-2xl border shadow-sm">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">บันทึกรายวัน</h1>
            <p className="text-sm text-muted-foreground">ระบบค้นหา ตรวจสอบข้อมูลเบิกคลัง สรุปชนิดสินค้า และจัดการบิล</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-muted-foreground">เลือกวันที่:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setSelectedMemberId('all');
                }}
                className="border rounded-xl px-3 py-2 bg-background font-medium focus:outline-none focus:ring-2 focus:ring-primary text-sm h-10"
              />
            </div>

            <div className="flex flex-col gap-1 min-w-[180px]">
              <span className="text-xs font-semibold text-muted-foreground">เลือกสมาชิก:</span>
              <select
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                className="border rounded-xl px-3 py-2 bg-background font-medium focus:outline-none focus:ring-2 focus:ring-primary text-sm h-10 cursor-pointer"
              >
                <option value="all">ทุกคน (All Members)</option>
                {membersWithBillsToday.map((member) => (
                  <option key={member.id} value={member.id}>{member.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* CARDS SUMMARY */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl border p-5 bg-card shadow-sm">
            <p className="text-xs font-medium text-muted-foreground mb-1">ยอดขายรวม</p>
            <h2 className="text-3xl font-extrabold text-primary">{Math.round(summary.totalSales).toLocaleString()} บ.</h2>
          </div>
          <div className="rounded-2xl border p-5 bg-card shadow-sm">
            <p className="text-xs font-medium text-muted-foreground mb-1">จ่ายเงินแล้ว</p>
            <h2 className="text-3xl font-extrabold text-green-600">{Math.round(summary.totalPaid).toLocaleString()} บ.</h2>
          </div>
          <div className="rounded-2xl border p-5 bg-card shadow-sm">
            <p className="text-xs font-medium text-muted-foreground mb-1">ยอดค้างชำระ</p>
            <h2 className="text-3xl font-extrabold text-red-500">{Math.round(summary.totalOwed).toLocaleString()} บ.</h2>
          </div>
        </div>

        {/* TABS SELECT TABLE */}
        <div className="flex border-b border-muted gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('transaction')}
            className={`px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${activeTab === 'transaction' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}
          >
            1. ยอดเบิกสินค้า (Transaction)
          </button>
          <button
            onClick={() => setActiveTab('typeSummary')}
            className={`px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${activeTab === 'typeSummary' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}
          >
            2. รวมยอดเหลือแต่ละ Type (Record Item)
          </button>
          <button
            onClick={() => setActiveTab('payment')}
            className={`px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${activeTab === 'payment' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}
          >
            3. ยอดที่จ่ายเหลือค้าง & จัดการบิล (Payment & Actions)
          </button>
        </div>

        {/* DATA DISPLAY PANEL */}
        <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
          
          {activeTab === 'transaction' && (
            <div>
              <div className="p-4 border-b bg-muted/20">
                <h3 className="font-semibold text-lg">Transaction</h3>
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
                            <td className="text-center p-3 font-bold text-blue-600">{item.newStock} ชิ้น</td>
                          </tr>
                        ))
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'typeSummary' && (
            <div>
              <div className="p-4 border-b bg-muted/20">
                <h3 className="font-semibold text-lg">Record Item Type Summary</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-muted-foreground">
                    <tr>
                      <th className="text-left p-3">ชื่อ</th>
                      <th className="text-left p-3">วันที่</th>
                      <th className="text-left p-3">ชนิด (Type)</th>
                      <th className="text-center p-3">ยอดเก่า</th>
                      <th className="text-center p-3">ยอดใหม่</th>
                      <th className="text-center p-3">ยอดรวม</th>
                      <th className="text-center p-3 text-orange-600">ยอดเหลือ</th>
                      <th className="text-center p-3">ยอดขาย</th>
                      <th className="text-right p-3 font-bold text-primary">สุทธิ (บาท)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {recordSummaryByType.length === 0 ? (
                      <tr><td colSpan={9} className="text-center p-8 text-muted-foreground">ไม่มีข้อมูลสรุปประเภทสินค้า</td></tr>
                    ) : (
                      recordSummaryByType.map((item, idx) => (
                        <tr key={`${item.memberName}-${item.type}-${idx}`} className="hover:bg-muted/30">
                          <td className="p-3 font-semibold">{item.memberName}</td>
                          <td className="p-3 text-xs text-muted-foreground">{item.date}</td>
                          <td className="p-3"><span className="px-2 py-1 text-xs rounded-md bg-secondary font-medium">{item.typeName}</span></td>
                          <td className="text-center p-3 text-muted-foreground">{item.oldStock}</td>
                          <td className="text-center p-3 text-blue-600">+{item.newStock}</td>
                          <td className="text-center p-3 font-medium">{item.totalStock}</td>
                          <td className="text-center p-3 text-orange-600 font-bold">{item.returned}</td>
                          <td className="text-center p-3 text-primary font-semibold">{item.sold}</td>
                          <td className="text-right p-3 font-extrabold text-primary bg-primary/5">{Math.round(item.netPrice).toLocaleString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: PAYMENT SUMMARY + ACTIONS WITH MODAL TRIGGER */}
          {activeTab === 'payment' && (
            <div>
              <div className="p-4 border-b bg-muted/20">
                <h3 className="font-semibold text-lg">Payment Summary & Actions</h3>
                <p className="text-xs text-muted-foreground">ตรวจสอบยอดเงินคงค้าง พร้อมปุ่มสำหรับแก้ไขหรือลบบิลประจำวัน</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-muted-foreground">
                    <tr>
                      <th className="text-left p-3 font-medium">ชื่อ</th>
                      <th className="text-right p-3 font-medium">ยอดขายรวม</th>
                      <th className="text-right p-3 font-medium text-green-600">จ่ายแล้ว</th>
                      <th className="text-right p-3 font-medium text-orange-500">ค้างเก่า</th>
                      <th className="text-right p-3 font-medium text-red-500">ค้างใหม่</th>
                      <th className="text-center p-3 font-medium w-[160px]">จัดการบิล (Actions)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredBills.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center p-8 text-muted-foreground">ไม่มีข้อมูลทางการเงินในวันที่เลือก</td>
                      </tr>
                    ) : (
                      filteredBills.map((bill) => (
                        <tr key={bill.id} className="hover:bg-muted/30 transition-colors">
                          <td className="p-3 font-semibold">{bill.memberName}</td>
                          <td className="text-right p-3 font-medium">
                            {Math.round(bill.totalSales).toLocaleString()} บ.
                          </td>
                          <td className="text-right p-3 text-green-600 font-bold bg-green-50/20">
                            {Math.round(bill.amountPaid).toLocaleString()} บ.
                          </td>
                          <td className="text-right p-3 text-orange-500">
                            {Math.round(bill.previousOwed || 0).toLocaleString()} บ.
                          </td>
                          <td className="text-right p-3 text-red-500 font-extrabold bg-red-50/20">
                            {Math.round(bill.amountOwed).toLocaleString()} บ.
                          </td>
                          {/* คอลัมน์ปุ่ม Actions */}
                          <td className="p-3 text-center">
                            {/* ส่วนของปุ่ม EDIT และ REVERT STATUS */}
                            <div className="flex items-center justify-center gap-2">
                                {/* ปุ่มแก้ไขเดิมที่มีอยู่แล้ว */}
                                <button
                                    onClick={() => openEditModal(bill.id, bill.memberName, bill.amountPaid)}
                                    className="inline-flex items-center justify-center px-2.5 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:text-blue-700 transition-colors"
                                >
                                    แก้ไขเงิน
                                </button>
                                
                                {/* ปุ่มเดิม (ลบ) ถูกปรับปรุงเป็น "ปลดล็อกบิล/ส่งกลับไปร่าง" */}
                                <button
                                    onClick={() => handleRevertBillStatus(bill.id, bill.memberName)}
                                    className="inline-flex items-center justify-center px-2.5 py-1.5 text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 hover:text-amber-700 transition-colors"
                                >
                                    ปลดล็อกบิล
                                </button>
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

      {/* ========================================== */}
      {/* MODAL FORM EDIT: หน้าต่างป๊อปอัปแก้ไขยอดชำระเงิน */}
      {/* ========================================== */}
      {editModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-md rounded-2xl border shadow-xl overflow-hidden transform animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 border-b bg-muted/20 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg text-foreground">แก้ไขข้อมูลบิล</h3>
                <p className="text-xs text-muted-foreground">สมาชิก: {editModal.memberName}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditModal((prev) => ({ ...prev, isOpen: false }))}
                className="text-muted-foreground hover:text-foreground text-xl p-1 rounded-lg hover:bg-muted"
              >
                ✕
              </button>
            </div>

            {/* Modal Form Content */}
            <form onSubmit={handleSaveEdit}>
              <div className="p-5 space-y-4">
                <div className="space-y-2">
                  <label htmlFor="amountPaidInput" className="text-sm font-semibold text-muted-foreground">
                    ยอดเงินที่ชำระแล้ว (บาท)
                  </label>
                  <input
                    id="amountPaidInput"
                    type="number"
                    min="0"
                    required
                    value={editModal.amountPaid}
                    onChange={(e) => setEditModal((prev) => ({ ...prev, amountPaid: Number(e.target.value) }))}
                    className="w-full border rounded-xl px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary font-bold text-lg text-primary"
                    placeholder="กรอกจำนวนเงิน"
                  />
                  <p className="text-xs text-muted-foreground">
                    * เมื่อบันทึก ระบบจะคำนวณยอดค้างชำระ (Amount Owed) ของบิลใบนี้ให้ใหม่โดยอัตโนมัติ
                  </p>
                </div>
              </div>

              {/* Modal Footer Controls */}
              <div className="p-4 border-t bg-muted/10 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditModal((prev) => ({ ...prev, isOpen: false }))}
                  className="px-4 py-2 text-sm font-semibold text-muted-foreground border rounded-xl hover:bg-muted transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold text-white bg-primary rounded-xl hover:bg-primary/90 shadow transition-colors"
                >
                  บันทึกข้อมูล
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}