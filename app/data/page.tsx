'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import { getCurrentMonth } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  ChevronLeft,
  Download,
  Trash2,
  History,
  RefreshCw,
  Settings2,
  AlertTriangle,
} from 'lucide-react';

export default function DataManagementPage() {
  const {
    bills,
    historyLogs,
    settings,
    exportToCSV,
    runAutoCleanup,
    updateSettings,
    resetAll,
  } = useStore();

  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [showCleanupConfirm, setShowCleanupConfirm] = useState(false);

  // Get available months from bills
  const availableMonths = [...new Set(bills.map((b) => b.date.slice(0, 7)))].sort().reverse();

  // Auto cleanup check on mount
  useEffect(() => {
    // Check if cleanup needed (run once per day)
    const today = new Date().toISOString().split('T')[0];
    const store = useStore.getState();
    if (store.lastCleanup !== today) {
      // Will be triggered on next interaction
    }
  }, []);

  const handleExportCSV = () => {
    const csv = exportToCSV(selectedMonth);
    if (!csv) {
      alert('ไม่มีข้อมูลในเดือนที่เลือก');
      return;
    }

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' }); // BOM for Excel
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dream-icecream-${selectedMonth}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    const state = useStore.getState();
    const dataStr = JSON.stringify(
      {
        members: state.members,
        products: state.products,
        bills: state.bills.filter((b) => b.date.startsWith(selectedMonth)),
        exportedAt: new Date().toISOString(),
      },
      null,
      2
    );

    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dream-icecream-${selectedMonth}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleRunCleanup = () => {
    runAutoCleanup();
    setShowCleanupConfirm(false);
  };

  const handleReset = () => {
    if (confirmText === 'ลบข้อมูล') {
      resetAll();
      setShowResetConfirm(false);
      setConfirmText('');
      window.location.href = '/';
    }
  };

  // Calculate stats
  const totalBills = bills.length;
  const monthBills = bills.filter((b) => b.date.startsWith(selectedMonth)).length;
  const totalSales = bills.reduce((sum, b) => sum + b.totalSales, 0);

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Link href="/settings">
              <Button variant="ghost" size="icon">
                <ChevronLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="font-bold text-foreground">จัดการข้อมูล</h1>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Stats Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">สถิติข้อมูล</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-primary">{totalBills}</p>
              <p className="text-xs text-muted-foreground">บิลทั้งหมด</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-chart-2">{monthBills}</p>
              <p className="text-xs text-muted-foreground">บิลเดือนนี้</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {totalSales.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">ยอดขายรวม (บาท)</p>
            </div>
          </CardContent>
        </Card>

        {/* Export Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Download className="w-4 h-4" />
              ส่งออกข้อมูล
            </CardTitle>
            <CardDescription>ดาวน์โหลดข้อมูลเป็นไฟล์ CSV หรือ JSON</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>เลือกเดือน</Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกเดือน" />
                </SelectTrigger>
                <SelectContent>
                  {availableMonths.length === 0 ? (
                    <SelectItem value={getCurrentMonth()} disabled>
                      ไม่มีข้อมูล
                    </SelectItem>
                  ) : (
                    availableMonths.map((month) => (
                      <SelectItem key={month} value={month}>
                        {new Date(month + '-01').toLocaleDateString('th-TH', {
                          year: 'numeric',
                          month: 'long',
                        })}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleExportCSV}
                disabled={availableMonths.length === 0}
              >
                <Download className="w-4 h-4 mr-2" />
                CSV
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleExportJSON}
                disabled={availableMonths.length === 0}
              >
                <Download className="w-4 h-4 mr-2" />
                JSON
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Retention Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Settings2 className="w-4 h-4" />
              การเก็บข้อมูล
            </CardTitle>
            <CardDescription>
              ตั้งค่าการลบข้อมูลอัตโนมัติ (เก็บข้อมูล N เดือน)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>จำนวนเดือนที่เก็บข้อมูล</Label>
              <Select
                value={settings.retentionMonths.toString()}
                onValueChange={(v) => updateSettings({ retentionMonths: parseInt(v) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 เดือน</SelectItem>
                  <SelectItem value="2">2 เดือน</SelectItem>
                  <SelectItem value="3">3 เดือน (แนะนำ)</SelectItem>
                  <SelectItem value="6">6 เดือน</SelectItem>
                  <SelectItem value="12">12 เดือน</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                ข้อมูลที่เก่ากว่า {settings.retentionMonths} เดือนจะถูกลบอัตโนมัติ
                และบันทึกสรุปไว้ใน History Log
              </p>
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowCleanupConfirm(true)}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              รัน Cleanup ตอนนี้
            </Button>
          </CardContent>
        </Card>

        {/* History Logs */}
        {historyLogs.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <History className="w-4 h-4" />
                History Log
              </CardTitle>
              <CardDescription>สรุปข้อมูลเดือนที่ถูกลบไปแล้ว</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {historyLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                  >
                    <div>
                      <p className="font-medium text-sm">
                        {new Date(log.month + '-01').toLocaleDateString('th-TH', {
                          year: 'numeric',
                          month: 'long',
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {log.totalBills} บิล | ยอดขาย {log.totalSales.toLocaleString()} บาท
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      ลบเมื่อ{' '}
                      {new Date(log.deletedAt).toLocaleDateString('th-TH', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Danger Zone */}
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-4 h-4" />
              โซนอันตราย
            </CardTitle>
            <CardDescription>การกระทำเหล่านี้ไม่สามารถย้อนกลับได้</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              className="w-full"
              onClick={() => setShowResetConfirm(true)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              ล้างข้อมูลทั้งหมด
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Cleanup Confirmation */}
      <AlertDialog open={showCleanupConfirm} onOpenChange={setShowCleanupConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>รัน Cleanup</AlertDialogTitle>
            <AlertDialogDescription>
              จะลบข้อมูลที่เก่ากว่า {settings.retentionMonths} เดือน
              และบันทึกสรุปไว้ใน History Log
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={handleRunCleanup}>รัน Cleanup</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Confirmation */}
      <AlertDialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบข้อมูล</AlertDialogTitle>
            <AlertDialogDescription>
              การกระทำนี้จะลบข้อมูลทั้งหมดอย่างถาวร ไม่สามารถกู้คืนได้
              <br />
              พิมพ์ <strong>&quot;ลบข้อมูล&quot;</strong> เพื่อยืนยัน
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder='พิมพ์ "ลบข้อมูล"'
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmText('')}>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReset}
              disabled={confirmText !== 'ลบข้อมูล'}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              ลบข้อมูลทั้งหมด
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
