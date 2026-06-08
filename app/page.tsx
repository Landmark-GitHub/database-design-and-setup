'use client';

import Link from 'next/link';
import { useStore } from '@/lib/store';
import { getToday } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardList, Settings, TrendingUp, Users, Database, Sunrise, Sunset, Receipt } from 'lucide-react';

export default function HomePage() {
  const { members, bills , expenses} = useStore();

  // 1. แก้ไขการ getToday ให้ล็อกตาม Timezone ไทย (+7 ชั่วโมง) ชัวร์ที่สุด
  const tzOffset = 7 * 60 * 60 * 1000; // +7 hours in ms
  const localDate = new Date(Date.now() + tzOffset);
  const today = localDate.toISOString().split('T')[0]; 

  // 2. กรองบิลเฉพาะของวันนี้
  const todayBills = bills.filter((b) => b.date === today);

  // 3. ปรับการคิดยอดรวมวันนี้: ให้แสดง "ยอดรวมใบสั่งซื้อทั้งหมดของวันนี้" ทันที ไม่ต้องรอปิดบิล
  // const todaySalesTotal = todayBills.reduce((sum, b) => sum + (b.totalSales || 0), 0);
  const todaySalesTotal = todayBills
  .filter((b) => b.status === 'completed')
  .reduce((sum, b) => sum + (b.totalSales || 0), 0);

  //4.
    // คัดกรองรายจ่ายเฉพาะวันนั้นๆ
  const todayExpenses = expenses?.filter((e) => e.date === today) || [];
  // ยอดรวมรวมของวันปัจจุบัน
  const todayExpensesTotal = todayExpenses.reduce((sum, item) => sum + item.amount, 0);
  
  const activeMembers = members.filter((m) => m.statusOut === 'active');

  const formattedDate = new Date().toLocaleDateString('th-TH', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary/5 via-background to-chart-2/5">
        <div className="max-w-lg mx-auto px-4 py-8">
          {/* Logo & Title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-card shadow-lg mb-4">
              <span className="text-4xl" aria-hidden="true">
                <svg viewBox="0 0 64 64" className="w-12 h-12">
                  <path fill="#8B5CF6" d="M32 8c-8 0-14 6-14 14v4h28v-4c0-8-6-14-14-14z" />
                  <path fill="#EC4899" d="M18 26h28v6c0 12-6 24-14 24s-14-12-14-24v-6z" />
                  <path fill="#F59E0B" d="M28 8c-2-4-4-6-4-6s4 0 8 0 8 0 8 0-2 2-4 6h-8z" />
                </svg>
              </span>
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-1">Dream IceCream</h1>
            <p className="text-muted-foreground text-sm">Digital Ledger System</p>
            <p className="text-xs text-muted-foreground mt-2">{formattedDate}</p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <Card className="bg-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-chart-2/10 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-chart-2" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">ยอดวันนี้</p>
                    <p className="font-semibold text-foreground">
                      {todaySalesTotal.toLocaleString()} บาท
                    </p>
                    <span className="text-sm text-muted-foreground text-rose-500">
                      - {todayExpensesTotal.toLocaleString()} บาท
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Link href="/settings">
              <Card className="bg-card">
                <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Users className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">สมาชิก</p>
                        <p className="font-semibold text-foreground">
                          {activeMembers.length} คน
                        </p>
                      </div>
                    </div>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Main Actions */}
          <h3 className="text-sm font-medium text-muted-foreground mb-3">การทำงานประจำวัน</h3>
            <div className="grid grid-cols-2 gap-3 mb-6">
              <Link href="/ledger" className="block">
                <Card className="hover:shadow-sm transition-all cursor-pointer hover:border-border/60 h-full">
                  <CardContent className="p-5">
                    <div className="w-11 h-11 rounded-lg bg-amber-500/10 flex items-center justify-center mb-3.5">
                      <ClipboardList className="w-5 h-5 text-amber-700" />
                    </div>
                    <p className="text-sm font-medium text-foreground">บันทึกการเบิก</p>
                    <p className="text-xs text-muted-foreground mt-1">สินค้าประจำวัน</p>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/expenses" className="block">
                <Card className="hover:shadow-sm transition-all cursor-pointer hover:border-border/60 h-full">
                  <CardContent className="p-5">
                    <div className="w-11 h-11 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-3.5">
                      <Receipt className="w-5 h-5 text-emerald-700" />
                    </div>
                    <p className="text-sm font-medium text-foreground">บันทึกรายจ่าย</p>
                    <p className="text-xs text-muted-foreground mt-1">ค่าใช้จ่ายประจำวัน</p>
                  </CardContent>
                </Card>
              </Link>
            </div>
          {/* Menu Grid */}
          <h3 className="text-sm font-medium text-muted-foreground mb-3">เมนูอื่นๆ</h3>
          <div className="grid grid-cols-3 gap-3">
            <Link href="/transaction">
              <Card className="hover:shadow-md transition-shadow cursor-pointer bg-card h-full">
                <CardHeader className="p-3 pb-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                    <ClipboardList className="w-4 h-4 text-primary" />
                  </div>
                  <CardTitle className="text-xs">สรุปยอด</CardTitle>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/settings">
              <Card className="hover:shadow-md transition-shadow cursor-pointer bg-card h-full">
                <CardHeader className="p-3 pb-2">
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center mb-2">
                    <Settings className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <CardTitle className="text-xs">ตั้งค่า</CardTitle>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/data">
              <Card className="hover:shadow-md transition-shadow cursor-pointer bg-card h-full">
                <CardHeader className="p-3 pb-2">
                  <div className="w-8 h-8 rounded-lg bg-chart-2/10 flex items-center justify-center mb-2">
                    <Database className="w-4 h-4 text-chart-2" />
                  </div>
                  <CardTitle className="text-xs">ข้อมูล/Export</CardTitle>
                </CardHeader>
              </Card>
            </Link>
          </div>

          {/* Today's Bills Summary
          {todayBills.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">บิลวันนี้</h3>
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    {todayBills.slice(0, 5).map((bill) => (
                      <div
                        key={bill.id}
                        className="flex items-center justify-between py-2 border-b border-border last:border-0"
                      >
                        <div>
                          <p className="font-medium text-sm">{bill.memberName}</p>
                          <p className="text-xs text-muted-foreground">
                            {bill.status === 'draft' && 'กำลังเบิก'}
                            {bill.status === 'checkout' && 'เบิกแล้ว'}
                            {bill.status === 'completed' && 'ปิดวันแล้ว'}
                          </p>
                        </div>
                        <p className="font-semibold text-sm">
                          {bill.totalSales.toLocaleString()} บาท
                        </p>
                      </div>
                    ))}
                    {todayBills.length > 5 && (
                      <p className="text-xs text-muted-foreground text-center pt-2">
                        และอีก {todayBills.length - 5} บิล
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )} */}

          {/* Footer */}
          <footer className="mt-8 text-center">
            <p className="text-xs text-muted-foreground">
              Dream IceCream Digital Ledger v2.0
            </p>
          </footer>
        </div>
      </div>
    </main>
  );
}
