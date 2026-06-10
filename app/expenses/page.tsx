// 'use client';

// import { useState, useEffect, useMemo } from 'react';
// import {
//   DndContext,
//   closestCenter,
//   KeyboardSensor,
//   PointerSensor,
//   useSensor,
//   useSensors,
//   type DragEndEvent,
// } from '@dnd-kit/core';
// import {
//   arrayMove,
//   SortableContext,
//   sortableKeyboardCoordinates,
//   useSortable,
//   verticalListSortingStrategy,
// } from '@dnd-kit/sortable';
// import { CSS } from '@dnd-kit/utilities';
// import { useStore } from '@/lib/store';
// import { getToday, type ExpenseCategory } from '@/lib/types';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from '@/components/ui/dialog';
// import { 
//   ChevronLeft, 
//   ChevronRight, 
//   Trash2, 
//   Home, 
//   Plus, 
//   Settings, 
//   Banknote, 
//   ClipboardList, 
//   Tag,
//   AlertCircle,
//   CalendarDays,
//   LayoutDashboard,
//   TrendingDown,
//   PieChart,
//   GripVertical,
//   Pencil,
//   Check,
//   X,
// } from 'lucide-react';
// import Link from 'next/link';

// // ============================================================
// // Sortable Category Row
// // ============================================================
// function SortableCategoryRow({
//   cat,
//   isEditing,
//   editName,
//   editIcon,
//   onEditName,
//   onEditIcon,
//   onStartEdit,
//   onSaveEdit,
//   onCancelEdit,
//   onDelete,
// }: {
//   cat: ExpenseCategory;
//   isEditing: boolean;
//   editName: string;
//   editIcon: string;
//   onEditName: (v: string) => void;
//   onEditIcon: (v: string) => void;
//   onStartEdit: () => void;
//   onSaveEdit: () => void;
//   onCancelEdit: () => void;
//   onDelete: () => void;
// }) {
//   const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
//     id: cat.id,
//   });

//   const style = {
//     transform: CSS.Transform.toString(transform),
//     transition,
//     opacity: isDragging ? 0.5 : 1,
//   };

//   return (
//     <div
//       ref={setNodeRef}
//       style={style}
//       className="flex items-center gap-1 bg-muted p-2 rounded-lg text-sm"
//     >
//       <button
//         type="button"
//         className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none"
//         {...attributes}
//         {...listeners}
//       >
//         <GripVertical className="h-4 w-4" />
//       </button>

//       {isEditing ? (
//         <>
//           <Input
//             value={editIcon}
//             onChange={(e) => onEditIcon(e.target.value)}
//             className="w-12 text-center px-1 h-8"
//           />
//           <Input
//             value={editName}
//             onChange={(e) => onEditName(e.target.value)}
//             className="flex-1 h-8"
//             autoFocus
//           />
//           <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={onSaveEdit}>
//             <Check className="h-3.5 w-3.5 text-green-600" />
//           </Button>
//           <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={onCancelEdit}>
//             <X className="h-3.5 w-3.5" />
//           </Button>
//         </>
//       ) : (
//         <>
//           <span className="flex items-center gap-2 flex-1 min-w-0">
//             <span>{cat.icon || '📝'}</span>
//             <span className="truncate">{cat.name}</span>
//           </span>
//           <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={onStartEdit}>
//             <Pencil className="h-3.5 w-3.5" />
//           </Button>
//           <Button
//             type="button"
//             variant="ghost"
//             size="icon"
//             className="h-7 w-7 text-destructive hover:bg-destructive/10"
//             onClick={onDelete}
//           >
//             <Trash2 className="h-3.5 w-3.5" />
//           </Button>
//         </>
//       )}
//     </div>
//   );
// }

// // ============================================================
// // Monthly Dashboard Component
// // ============================================================
// function MonthlyDashboard({ store }: { store: ReturnType<typeof useStore> }) {
//   const today = new Date();
//   const [selectedYear, setSelectedYear] = useState(today.getFullYear());
//   const [selectedMonth, setSelectedMonth] = useState(today.getMonth()); // 0-indexed

//   const changeMonth = (delta: number) => {
//     let m = selectedMonth + delta;
//     let y = selectedYear;
//     if (m > 11) { m = 0; y++; }
//     if (m < 0) { m = 11; y--; }
//     setSelectedMonth(m);
//     setSelectedYear(y);
//   };

//   const monthLabel = new Date(selectedYear, selectedMonth, 1).toLocaleDateString('th-TH', {
//     year: 'numeric',
//     month: 'long',
//   });

//   // กรองรายจ่ายของเดือนที่เลือก
//   const monthExpenses = useMemo(() => {
//     const prefix = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;
//     return (store.expenses || []).filter((e) => e.date.startsWith(prefix));
//   }, [store.expenses, selectedYear, selectedMonth]);

//   const monthTotal = monthExpenses.reduce((s, e) => s + e.amount, 0);

//   // สรุปตามหมวดหมู่
//   const categoryTotals = useMemo(() => {
//     const map: Record<string, { name: string; icon: string; total: number }> = {};
//     monthExpenses.forEach((e) => {
//       const cat = store.expenseCategories?.find((c) => c.id === e.categoryId);
//       if (!map[e.categoryId]) {
//         map[e.categoryId] = { name: cat?.name || 'ไม่ทราบ', icon: cat?.icon || '📝', total: 0 };
//       }
//       map[e.categoryId].total += e.amount;
//     });
//     return Object.entries(map)
//       .map(([id, v]) => ({ id, ...v }))
//       .sort((a, b) => b.total - a.total);
//   }, [monthExpenses, store.expenseCategories]);

//   // สรุปรายวัน (เพื่อแสดงกราฟแท่ง)
//   const dailyTotals = useMemo(() => {
//     const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
//     const result: { day: number; total: number }[] = [];
//     for (let d = 1; d <= daysInMonth; d++) {
//       const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
//       const total = monthExpenses
//         .filter((e) => e.date === dateStr)
//         .reduce((s, e) => s + e.amount, 0);
//       result.push({ day: d, total });
//     }
//     return result;
//   }, [monthExpenses, selectedYear, selectedMonth]);

//   const maxDaily = Math.max(...dailyTotals.map((d) => d.total), 1);
//   const avgDaily = monthTotal / (dailyTotals.filter((d) => d.total > 0).length || 1);

//   // สรุปรายวันแบบตาราง (เฉพาะวันที่มีรายการ)
//   const dailyRows = useMemo(() => {
//     return dailyTotals
//       .filter((d) => d.total > 0)
//       .map((d) => {
//         const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`;
//         const label = new Date(dateStr + 'T00:00:00').toLocaleDateString('th-TH', {
//           weekday: 'short', day: 'numeric',
//         });
//         const count = monthExpenses.filter((e) => e.date === dateStr).length;
//         return { day: d.day, label, total: d.total, count };
//       });
//   }, [dailyTotals, monthExpenses, selectedYear, selectedMonth]);

//   // วันที่จ่ายสูงสุด
//   const topDay = dailyTotals.reduce((a, b) => (b.total > a.total ? b : a), { day: 0, total: 0 });

//   return (
//     <div className="space-y-6">
//       {/* Month Navigator */}
//       <div className="flex items-center justify-between bg-card p-3 rounded-xl border shadow-sm">
//         <Button variant="ghost" size="icon" onClick={() => changeMonth(-1)}>
//           <ChevronLeft className="h-4 w-4" />
//         </Button>
//         <div className="text-center">
//           <p className="text-xs text-muted-foreground">สรุปรายจ่าย</p>
//           <p className="text-base font-bold">{monthLabel}</p>
//         </div>
//         <Button variant="ghost" size="icon" onClick={() => changeMonth(1)}>
//           <ChevronRight className="h-4 w-4" />
//         </Button>
//       </div>

//       {/* KPI Cards */}
//       <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
//         <Card className="border-l-4 border-l-destructive">
//           <CardContent className="py-4 px-4">
//             <p className="text-xs text-muted-foreground mb-1">ยอดรวมทั้งเดือน</p>
//             <p className="text-xl font-bold text-destructive">
//               {monthTotal.toLocaleString('th-TH', { minimumFractionDigits: 0 })}
//             </p>
//             <p className="text-xs text-muted-foreground">บาท</p>
//           </CardContent>
//         </Card>
//         <Card className="border-l-4 border-l-orange-500">
//           <CardContent className="py-4 px-4">
//             <p className="text-xs text-muted-foreground mb-1">จำนวนรายการ</p>
//             <p className="text-xl font-bold text-orange-500">{monthExpenses.length}</p>
//             <p className="text-xs text-muted-foreground">รายการ</p>
//           </CardContent>
//         </Card>
//         <Card className="border-l-4 border-l-blue-500">
//           <CardContent className="py-4 px-4">
//             <p className="text-xs text-muted-foreground mb-1">เฉลี่ยต่อวัน</p>
//             <p className="text-xl font-bold text-blue-500">
//               {avgDaily.toLocaleString('th-TH', { maximumFractionDigits: 0 })}
//             </p>
//             <p className="text-xs text-muted-foreground">บาท/วัน</p>
//           </CardContent>
//         </Card>
//         <Card className="border-l-4 border-l-purple-500">
//           <CardContent className="py-4 px-4">
//             <p className="text-xs text-muted-foreground mb-1">หมวดหมู่ทั้งหมด</p>
//             <p className="text-xl font-bold text-purple-500">{categoryTotals.length}</p>
//             <p className="text-xs text-muted-foreground">ประเภท</p>
//           </CardContent>
//         </Card>
//       </div>

//       {monthExpenses.length === 0 ? (
//         <Card>
//           <CardContent className="py-16 text-center text-muted-foreground">
//             <PieChart className="h-10 w-10 mx-auto mb-3 opacity-30" />
//             <p>ยังไม่มีข้อมูลรายจ่ายในเดือนนี้</p>
//           </CardContent>
//         </Card>
//       ) : (
//         <>
//           {/* Daily Bar Chart */}
//           <Card>
//             <CardHeader className="pb-2">
//               <CardTitle className="text-sm font-semibold flex items-center gap-2">
//                 <TrendingDown className="h-4 w-4 text-destructive" />
//                 กราฟรายจ่ายรายวัน
//                 {topDay.total > 0 && (
//                   <span className="ml-auto text-xs font-normal text-muted-foreground">
//                     สูงสุดวันที่ {topDay.day} ({topDay.total.toLocaleString('th-TH')} บาท)
//                   </span>
//                 )}
//               </CardTitle>
//             </CardHeader>
//             <CardContent>
//               <div className="flex items-end gap-[2px] h-36 overflow-x-auto pb-1">
//                 {dailyTotals.map(({ day, total }) => {
//                   const heightPct = total > 0 ? Math.max((total / maxDaily) * 100, 4) : 0;
//                   const isTop = day === topDay.day && total > 0;
//                   return (
//                     <div key={day} className="flex flex-col items-center flex-1 min-w-[18px] group relative">
//                       {/* Tooltip */}
//                       {total > 0 && (
//                         <div className="absolute bottom-full mb-1 bg-popover border text-popover-foreground text-[10px] px-1.5 py-0.5 rounded shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
//                           วันที่ {day}: {total.toLocaleString('th-TH')} บาท
//                         </div>
//                       )}
//                       <div
//                         className={`w-full rounded-t-sm transition-all ${
//                           isTop ? 'bg-destructive' : total > 0 ? 'bg-destructive/40 group-hover:bg-destructive/70' : 'bg-muted'
//                         }`}
//                         style={{ height: total > 0 ? `${heightPct}%` : '2px' }}
//                       />
//                       {day % 5 === 0 || day === 1 ? (
//                         <span className="text-[9px] text-muted-foreground mt-1">{day}</span>
//                       ) : (
//                         <span className="text-[9px] text-transparent mt-1">{day}</span>
//                       )}
//                     </div>
//                   );
//                 })}
//               </div>
//             </CardContent>
//           </Card>

//           {/* Bottom Grid: Category Breakdown + Daily Table */}
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             {/* Category Breakdown */}
//             <Card>
//               <CardHeader className="pb-2">
//                 <CardTitle className="text-sm font-semibold flex items-center gap-2">
//                   <Tag className="h-4 w-4 text-purple-500" />
//                   สรุปตามหมวดหมู่
//                 </CardTitle>
//               </CardHeader>
//               <CardContent className="space-y-2">
//                 {categoryTotals.map((cat) => {
//                   const pct = monthTotal > 0 ? (cat.total / monthTotal) * 100 : 0;
//                   return (
//                     <div key={cat.id} className="space-y-1">
//                       <div className="flex items-center justify-between text-sm">
//                         <span className="flex items-center gap-1.5">
//                           <span>{cat.icon}</span>
//                           <span className="font-medium">{cat.name}</span>
//                         </span>
//                         <span className="text-right">
//                           <span className="font-semibold text-destructive">
//                             {cat.total.toLocaleString('th-TH', { minimumFractionDigits: 0 })}
//                           </span>
//                           <span className="text-xs text-muted-foreground ml-1">บาท</span>
//                         </span>
//                       </div>
//                       <div className="flex items-center gap-2">
//                         <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
//                           <div
//                             className="h-full bg-destructive/60 rounded-full"
//                             style={{ width: `${pct}%` }}
//                           />
//                         </div>
//                         <span className="text-[11px] text-muted-foreground w-9 text-right">
//                           {pct.toFixed(1)}%
//                         </span>
//                       </div>
//                     </div>
//                   );
//                 })}
//               </CardContent>
//             </Card>

//             {/* Daily Summary Table */}
//             <Card>
//               <CardHeader className="pb-2">
//                 <CardTitle className="text-sm font-semibold flex items-center gap-2">
//                   <CalendarDays className="h-4 w-4 text-blue-500" />
//                   สรุปรายวัน
//                 </CardTitle>
//               </CardHeader>
//               <CardContent>
//                 <div className="border rounded-lg overflow-hidden">
//                   <div className="max-h-64 overflow-y-auto">
//                     <table className="w-full text-sm">
//                       <thead className="sticky top-0 bg-muted text-xs text-muted-foreground">
//                         <tr>
//                           <th className="p-2 text-left font-semibold">วัน</th>
//                           <th className="p-2 text-center font-semibold">รายการ</th>
//                           <th className="p-2 text-right font-semibold">ยอด (บาท)</th>
//                         </tr>
//                       </thead>
//                       <tbody className="divide-y">
//                         {dailyRows.map((row) => (
//                           <tr key={row.day} className="hover:bg-muted/50">
//                             <td className="p-2 text-xs">{row.label}</td>
//                             <td className="p-2 text-center text-xs text-muted-foreground">{row.count}</td>
//                             <td className="p-2 text-right text-xs font-medium text-destructive">
//                               {row.total.toLocaleString('th-TH', { minimumFractionDigits: 0 })}
//                             </td>
//                           </tr>
//                         ))}
//                       </tbody>
//                       <tfoot className="sticky bottom-0 bg-card border-t">
//                         <tr>
//                           <td className="p-2 text-xs font-bold">รวม</td>
//                           <td className="p-2 text-center text-xs font-bold">{monthExpenses.length}</td>
//                           <td className="p-2 text-right text-xs font-bold text-destructive">
//                             {monthTotal.toLocaleString('th-TH', { minimumFractionDigits: 0 })}
//                           </td>
//                         </tr>
//                       </tfoot>
//                     </table>
//                   </div>
//                 </div>
//               </CardContent>
//             </Card>
//           </div>
//         </>
//       )}
//     </div>
//   );
// }

// // ============================================================
// // Main Page
// // ============================================================
// export default function ExpensesPage() {
//   const store = useStore();

//   // โหมด: 'daily' | 'monthly'
//   const [viewMode, setViewMode] = useState<'daily' | 'monthly'>('daily');
  
//   // สำหรับการคุมวันที่ย้อนหลัง/ไปข้างหน้า
//   const [selectedDate, setSelectedDate] = useState<string>('');
  
//   // สถานะฟอร์มเพิ่มรายจ่าย
//   const [amount, setAmount] = useState<string>('');
//   const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
//   const [note, setNote] = useState<string>('');
  
//   // สถานะฟอร์มการจัดการหมวดหมู่
//   const [newCatName, setNewCatName] = useState<string>('');
//   const [newCatIcon, setNewCatIcon] = useState<string>('📝');
//   const [isManageCatOpen, setIsManageCatOpen] = useState<boolean>(false);
//   const [editingCatId, setEditingCatId] = useState<string | null>(null);
//   const [editCatName, setEditCatName] = useState('');
//   const [editCatIcon, setEditCatIcon] = useState('📝');

//   const sensors = useSensors(
//     useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
//     useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
//   );

//   // ควบคุม Dialog ยืนยันลบ
//   const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
//   const [deleteType, setDeleteType] = useState<'expense' | 'category' | null>(null);

//   // ตั้งค่าวันที่ปัจจุบันเมื่อเข้าหน้าจอครั้งแรก
//   useEffect(() => {
//     setSelectedDate(getToday());
//     store.loadData();
//   }, []);

//   // เลื่อนวันไปข้างหน้า/หลัง
//   const changeDate = (days: number) => {
//     const current = new Date(selectedDate);
//     current.setDate(current.getDate() + days);
//     const year = current.getFullYear();
//     const month = String(current.getMonth() + 1).padStart(2, '0');
//     const day = String(current.getDate()).padStart(2, '0');
//     setSelectedDate(`${year}-${month}-${day}`);
//   };

//   // คัดกรองรายจ่ายเฉพาะวันนั้นๆ
//   const todayExpenses = store.expenses?.filter((e) => e.date === selectedDate) || [];
  
//   // ยอดรวมรวมของวันปัจจุบัน
//   const todayTotal = todayExpenses.reduce((sum, item) => sum + item.amount, 0);

//   // บันทึกยอดรายจ่ายลงในตารางหลัก
//   const handleSaveExpense = (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!amount || parseFloat(amount) <= 0 || !selectedCategoryId) {
//       alert('กรุณากรอกจำนวนเงินและเลือกหมวดหมู่ให้ครบถ้วน');
//       return;
//     }

//     store.addExpense({
//       date: selectedDate,
//       categoryId: selectedCategoryId,
//       amount: parseFloat(amount),
//       note: note.trim() || undefined,
//     });

//     // รีเซ็ตค่าในฟอร์มเมื่อบันทึกเสร็จ
//     setAmount('');
//     setNote('');
//   };

//   // จัดการเพิ่มหมวดหมู่ใหม่
//   const handleCreateCategory = (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!newCatName.trim()) return;

//     store.addExpenseCategory(newCatName.trim(), newCatIcon);
//     setNewCatName('');
//     setNewCatIcon('📝');
//   };

//   const handleStartEditCategory = (cat: ExpenseCategory) => {
//     setEditingCatId(cat.id);
//     setEditCatName(cat.name);
//     setEditCatIcon(cat.icon || '📝');
//   };

//   const handleSaveEditCategory = () => {
//     if (!editingCatId || !editCatName.trim()) return;
//     store.updateExpenseCategory(editingCatId, {
//       name: editCatName.trim(),
//       icon: editCatIcon,
//     });
//     setEditingCatId(null);
//   };

//   const handleCancelEditCategory = () => {
//     setEditingCatId(null);
//   };

//   const handleDragEndCategories = (event: DragEndEvent) => {
//     const { active, over } = event;
//     if (!over || active.id === over.id) return;

//     const categories = store.expenseCategories || [];
//     const oldIndex = categories.findIndex((c) => c.id === active.id);
//     const newIndex = categories.findIndex((c) => c.id === over.id);
//     if (oldIndex === -1 || newIndex === -1) return;

//     store.reorderExpenseCategories(arrayMove(categories, oldIndex, newIndex));
//   };

//   // ประมวลผลเมื่อกดยืนยันการลบตัวเลือก (ทั้งรายการจ่าย และ หมวดหมู่)
//   const handleConfirmDelete = () => {
//     if (!deleteTargetId) return;

//     if (deleteType === 'expense') {
//       store.deleteExpense(deleteTargetId);
//     } else if (deleteType === 'category') {
//       store.deleteExpenseCategory(deleteTargetId);
//       if (selectedCategoryId === deleteTargetId) {
//         setSelectedCategoryId('');
//       }
//     }

//     setDeleteTargetId(null);
//     setDeleteType(null);
//   };

//   // รูปแบบแสดงวันที่ภาษาไทย
//   const formatDateThai = (dateStr: string) => {
//     if (!dateStr) return '';
//     const date = new Date(dateStr + 'T00:00:00');
//     return date.toLocaleDateString('th-TH', {
//       year: 'numeric',
//       month: 'long',
//       day: 'numeric',
//       weekday: 'long',
//     });
//   };

//   return (
//     <main className="container mx-auto p-4 max-w-6xl space-y-6">
      
//       {/* ส่วนหัวหน้าจอ */}
//       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-4 rounded-xl border shadow-sm">
//         <div className="flex items-center gap-3">
//           <Link href="/">
//             <Button variant="outline" size="icon" className="h-9 w-9">
//               <Home className="h-4 w-4" />
//             </Button>
//           </Link>
//           <div>
//             <h1 className="text-xl font-bold tracking-tight">บันทึกรายจ่ายประจำวัน</h1>
//             <p className="text-sm text-muted-foreground">ลงบันทึกควบคุมต้นทุนและค่าใช้จ่ายในร้าน</p>
//           </div>
//         </div>

//         <div className="grid grid-rows-2 items-center gap-2 w-full sm:w-auto">
//           {/* Toggle Mode */}
//           <div className="flex bg-muted rounded-lg p-1 gap-1">
//             <Button
//               variant={viewMode === 'daily' ? 'default' : 'ghost'}
//               size="sm"
//               className="h-8 gap-1.5 text-xs"
//               onClick={() => setViewMode('daily')}
//             >
//               <CalendarDays className="h-3.5 w-3.5" />
//               รายวัน
//             </Button>
//             <Button
//               variant={viewMode === 'monthly' ? 'default' : 'ghost'}
//               size="sm"
//               className="h-8 gap-1.5 text-xs"
//               onClick={() => setViewMode('monthly')}
//             >
//               <LayoutDashboard className="h-3.5 w-3.5" />
//               Dashboard รายเดือน
//             </Button>
//           </div>

//           {/* Date Navigator (เฉพาะ mode รายวัน) */}
//           {viewMode === 'daily' && (
//             <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
//               <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => changeDate(-1)}>
//                 <ChevronLeft className="h-4 w-4" />
//               </Button>
//               <span className="text-xs font-medium px-2 min-w-[130px] text-center">
//                 {formatDateThai(selectedDate)}
//               </span>
//               <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => changeDate(1)}>
//                 <ChevronRight className="h-4 w-4" />
//               </Button>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* ======= MONTHLY DASHBOARD MODE ======= */}
//       {viewMode === 'monthly' && (
//         <MonthlyDashboard store={store} />
//       )}

//       {/* ======= DAILY MODE ======= */}
//       {viewMode === 'daily' && (
//         <>
//           {/* บล็อกแสดงยอดรวมสรุปแบบเร่งด่วน */}
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <Card className="border-l-4 border-l-destructive">
//               <CardContent className="flex items-center gap-4 py-4">
//                 <div className="p-3 bg-destructive/10 text-destructive rounded-lg">
//                   <Banknote className="h-6 w-6" />
//                 </div>
//                 <div>
//                   <p className="text-sm text-muted-foreground font-medium">ยอดรวมรายจ่ายของวันนี้</p>
//                   <h3 className="text-2xl font-bold text-destructive">
//                     {todayTotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท
//                   </h3>
//                 </div>
//               </CardContent>
//             </Card>

//             <Card className="border-l-4 border-l-orange-500">
//               <CardContent className="flex items-center gap-4 py-4">
//                 <div className="p-3 bg-orange-500/10 text-orange-500 rounded-lg">
//                   <ClipboardList className="h-6 w-6" />
//                 </div>
//                 <div>
//                   <p className="text-sm text-muted-foreground font-medium">รายการที่ลงบันทึก</p>
//                   <h3 className="text-2xl font-bold text-orange-500">{todayExpenses.length} รายการ</h3>
//                 </div>
//               </CardContent>
//             </Card>
//           </div>

//           {/* ส่วนแสดงส่วนการทำงานหลักแบ่งเป็น ฟอร์ม และ ตาราง */}
//           <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
//             {/* บล็อกที่ 1: ฟอร์มเพิ่มข้อมูล (ฝั่งซ้าย) */}
//             <div className="lg:col-span-5 space-y-4">
//               <Card>
//                 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
//                   <CardTitle className="text-base font-semibold">➕ เพิ่มรายการจ่ายใหม่</CardTitle>
                  
//                   {/* ปุ่มเปิดหน้าต่าง จัดการหมวดหมู่ (เพิ่ม/ลบ) */}
//                   <Dialog open={isManageCatOpen} onOpenChange={setIsManageCatOpen}>
//                     <DialogTrigger asChild>
//                       <Button variant="outline" size="sm" className="gap-1 text-xs">
//                         <Settings className="h-3 w-3" /> ตั้งค่าหมวดหมู่
//                       </Button>
//                     </DialogTrigger>
//                     <DialogContent className="max-w-md">
//                       <DialogHeader>
//                         <DialogTitle>⚙️ จัดการหมวดหมู่รายจ่าย</DialogTitle>
//                       </DialogHeader>
                      
//                       {/* ฟอร์มเพิ่มหมวดหมู่ย่อยใน Dialog */}
//                       <form onSubmit={handleCreateCategory} className="flex items-end gap-2 pt-2 border-b pb-4">
//                         <div className="grid gap-1.5 flex-1">
//                           <Label htmlFor="catName" className="text-xs">ชื่อหมวดหมู่ใหม่</Label>
//                           <div className="flex gap-1">
//                             <Input 
//                               id="catIcon"
//                               value={newCatIcon}
//                               onChange={(e) => setNewCatIcon(e.target.value)}
//                               className="w-12 text-center px-1"
//                               placeholder="ไอคอน"
//                             />
//                             <Input 
//                               id="catName"
//                               value={newCatName}
//                               onChange={(e) => setNewCatName(e.target.value)}
//                               placeholder="เช่น ค่าน้ำไฟ, ค่าแพ็คเกจ"
//                             />
//                           </div>
//                         </div>
//                         <Button type="submit" size="sm" className="gap-1">
//                           <Plus className="h-3 w-3" /> เพิ่ม
//                         </Button>
//                       </form>

//                       {/* ลิสต์รายการหมวดหมู่ — ลากจัดลำดับ / แก้ไข / ลบ */}
//                       <div className="space-y-2 max-h-72 overflow-y-auto pt-2">
//                         <Label className="text-xs text-muted-foreground">
//                           หมวดหมู่ทั้งหมด (ลากเพื่อจัดลำดับ)
//                         </Label>
//                         {store.expenseCategories?.length === 0 ? (
//                           <p className="text-center text-xs text-muted-foreground py-4">ไม่มีหมวดหมู่รายจ่ายในระบบ</p>
//                         ) : (
//                           <DndContext
//                             sensors={sensors}
//                             collisionDetection={closestCenter}
//                             onDragEnd={handleDragEndCategories}
//                           >
//                             <SortableContext
//                               items={store.expenseCategories.map((c) => c.id)}
//                               strategy={verticalListSortingStrategy}
//                             >
//                               <div className="space-y-1.5">
//                                 {store.expenseCategories.map((cat) => (
//                                   <SortableCategoryRow
//                                     key={cat.id}
//                                     cat={cat}
//                                     isEditing={editingCatId === cat.id}
//                                     editName={editCatName}
//                                     editIcon={editCatIcon}
//                                     onEditName={setEditCatName}
//                                     onEditIcon={setEditCatIcon}
//                                     onStartEdit={() => handleStartEditCategory(cat)}
//                                     onSaveEdit={handleSaveEditCategory}
//                                     onCancelEdit={handleCancelEditCategory}
//                                     onDelete={() => {
//                                       setDeleteTargetId(cat.id);
//                                       setDeleteType('category');
//                                     }}
//                                   />
//                                 ))}
//                               </div>
//                             </SortableContext>
//                           </DndContext>
//                         )}
//                       </div>
//                     </DialogContent>
//                   </Dialog>

//                 </CardHeader>
//                 <CardContent>
//                   <form onSubmit={handleSaveExpense} className="space-y-4">
                    
//                     {/* จำนวนเงิน */}
//                     <div className="space-y-1.5">
//                       <Label htmlFor="amount">จำนวนเงิน (บาท)</Label>
//                       <Input
//                         id="amount"
//                         type="number"
//                         step="0.01"
//                         placeholder="0.00"
//                         className="text-lg font-semibold"
//                         value={amount}
//                         onChange={(e) => setAmount(e.target.value)}
//                         required
//                       />
//                     </div>

//                     {/* เลือกหมวดหมู่แบบปุ่มคลิกใช้งานง่าย */}
//                     <div className="space-y-1.5">
//                       <Label>เลือกประเภทรายจ่าย</Label>
//                       {store.expenseCategories?.length === 0 ? (
//                         <div className="text-xs text-amber-600 bg-amber-50 p-3 rounded-lg flex items-center gap-2 border border-amber-200">
//                           <AlertCircle className="h-4 w-4" />
//                           <span>กรุณากดปุ่ม <b>"ตั้งค่าหมวดหมู่"</b> เพื่อเพิ่มหมวดหมู่ก่อน</span>
//                         </div>
//                       ) : (
//                         <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1 border rounded-lg">
//                           {store.expenseCategories?.map((cat) => (
//                             <button
//                               key={cat.id}
//                               type="button"
//                               onClick={() => setSelectedCategoryId(cat.id)}
//                               className={`flex items-center gap-2 p-2.5 rounded-lg border text-left text-xs transition-all ${
//                                 selectedCategoryId === cat.id
//                                   ? 'bg-primary text-primary-foreground border-primary shadow-sm font-medium'
//                                   : 'bg-card hover:bg-muted text-card-foreground border-input'
//                               }`}
//                             >
//                               <span className="text-sm">{cat.icon || '📝'}</span>
//                               <span className="truncate">{cat.name}</span>
//                             </button>
//                           ))}
//                         </div>
//                       )}
//                     </div>

//                     {/* บันทึกช่วยจำ */}
//                     <div className="space-y-1.5">
//                       <Label htmlFor="note">หมายเหตุ / บันทึกช่วยจำ</Label>
//                       <Input
//                         id="note"
//                         placeholder="ระบุคำอธิบายเพิ่มเติม (ถ้ามี)"
//                         value={note}
//                         onChange={(e) => setNote(e.target.value)}
//                       />
//                     </div>

//                     <Button type="submit" className="w-full mt-2" disabled={store.expenseCategories?.length === 0}>
//                       💾 บันทึกรายจ่าย
//                     </Button>
//                   </form>
//                 </CardContent>
//               </Card>
//             </div>

//             {/* บล็อกที่ 2: ตารางแสดงรายการจ่ายของวันปัจจุบัน (ฝั่งขวา) */}
//             <div className="lg:col-span-7">
//               <Card className="h-full">
//                 <CardHeader className="pb-3">
//                   <CardTitle className="text-base font-semibold">📋 รายการที่จ่ายวันนี้</CardTitle>
//                 </CardHeader>
//                 <CardContent>
//                   <div className="border rounded-lg overflow-x-auto">
//                     <table className="w-full text-sm text-left">
//                       <thead className="text-xs bg-muted text-muted-foreground uppercase">
//                         <tr>
//                           <th className="p-3 font-semibold">เวลา</th>
//                           <th className="p-3 font-semibold">ประเภท</th>
//                           <th className="p-3 font-semibold">รายละเอียด</th>
//                           <th className="p-3 font-semibold text-right">จำนวนเงิน</th>
//                           <th className="p-3 text-center font-semibold">ลบ</th>
//                         </tr>
//                       </thead>
//                       <tbody className="divide-y">
//                         {todayExpenses.length === 0 ? (
//                           <tr>
//                             <td colSpan={5} className="p-8 text-center text-muted-foreground text-xs">
//                               ยังไม่มีการลงบันทึกรายจ่ายสำหรับวันนี้
//                             </td>
//                           </tr>
//                         ) : (
//                           todayExpenses.map((item) => {
//                             const category = store.expenseCategories?.find((c) => c.id === item.categoryId);
//                             const timeStr = new Date(item.createdAt).toLocaleTimeString('th-TH', {
//                               hour: '2-digit',
//                               minute: '2-digit',
//                             });
//                             return (
//                               <tr key={item.id} className="hover:bg-muted/50 transition-colors">
//                                 <td className="p-3 text-xs text-muted-foreground">{timeStr} น.</td>
//                                 <td className="p-3">
//                                   <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs bg-secondary font-medium">
//                                     <span>{category?.icon || '📝'}</span>
//                                     <span>{category?.name || 'ไม่ทราบประเภท'}</span>
//                                   </span>
//                                 </td>
//                                 <td className="p-3 max-w-[180px] truncate text-xs" title={item.note}>
//                                   {item.note || '-'}
//                                 </td>
//                                 <td className="p-3 text-right font-medium text-destructive">
//                                   -{item.amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
//                                 </td>
//                                 <td className="p-3 text-center">
//                                   <Button
//                                     variant="ghost"
//                                     size="icon"
//                                     className="h-8 w-8 text-destructive hover:bg-destructive/10"
//                                     onClick={() => {
//                                       setDeleteTargetId(item.id);
//                                       setDeleteType('expense');
//                                     }}
//                                   >
//                                     <Trash2 className="h-4 w-4" />
//                                   </Button>
//                                 </td>
//                               </tr>
//                             );
//                           })
//                         )}
//                       </tbody>
//                     </table>
//                   </div>
//                 </CardContent>
//               </Card>
//             </div>

//           </div>
//         </>
//       )}

//       {/* ส่วนปิดท้าย: หน้าต่างเตือนยืนยันลบข้อมูลแบบครอบคลุม (Global Delete Alert Dialog) */}
//       <AlertDialog 
//         open={deleteTargetId !== null} 
//         onOpenChange={(isOpen) => !isOpen && { setDeleteTargetId: null, setDeleteType: null }}
//       >
//         <AlertDialogContent>
//           <AlertDialogHeader>
//             <AlertDialogTitle>คุณแน่ใจหรือไม่ที่จะลบข้อมูลนี้?</AlertDialogTitle>
//             <AlertDialogDescription>
//               {deleteType === 'category' 
//                 ? 'การลบหมวดหมู่นี้ จะส่งผลให้รายการบันทึกรายจ่ายทั้งหมดที่เชื่อมโยงกับหมวดหมู่นี้ถูกลบออกจากระบบด้วยโดยอัตโนมัติ และไม่สามารถกู้กลับคืนมาได้'
//                 : 'ข้อมูลบันทึกรายจ่ายรายการนี้จะถูกลบออกถาวรจากยอดสรุปประจำวัน'}
//             </AlertDialogDescription>
//           </AlertDialogHeader>
//           <AlertDialogFooter>
//             <AlertDialogCancel onClick={() => { setDeleteTargetId(null); setDeleteType(null); }}>
//               ยกเลิก
//             </AlertDialogCancel>
//             <AlertDialogAction 
//               onClick={handleConfirmDelete}
//               className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
//             >
//               ยืนยันการลบ
//             </AlertDialogAction>
//           </AlertDialogFooter>
//         </AlertDialogContent>
//       </AlertDialog>

//     </main>
//   );
// }


'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useStore } from '@/lib/store';
import { getToday, type ExpenseCategory } from '@/lib/types';
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
  AlertCircle,
  CalendarDays,
  LayoutDashboard,
  TrendingDown,
  PieChart,
  GripVertical,
  Pencil,
  Check,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip,
  Cell
} from 'recharts';

// ============================================================
// Sortable Category Row
// ============================================================
function SortableCategoryRow({
  cat,
  isEditing,
  editName,
  editIcon,
  onEditName,
  onEditIcon,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
}: {
  cat: ExpenseCategory;
  isEditing: boolean;
  editName: string;
  editIcon: string;
  onEditName: (v: string) => void;
  onEditIcon: (v: string) => void;
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: cat.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-1 bg-muted p-2 rounded-lg text-sm"
    >
      <button
        type="button"
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {isEditing ? (
        <>
          <Input
            value={editIcon}
            onChange={(e) => onEditIcon(e.target.value)}
            className="w-12 text-center px-1 h-8"
          />
          <Input
            value={editName}
            onChange={(e) => onEditName(e.target.value)}
            className="flex-1 h-8"
            autoFocus
          />
          <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={onSaveEdit}>
            <Check className="h-3.5 w-3.5 text-green-600" />
          </Button>
          <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={onCancelEdit}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </>
      ) : (
        <>
          <span className="flex items-center gap-2 flex-1 min-w-0">
            <span>{cat.icon || '📝'}</span>
            <span className="truncate">{cat.name}</span>
          </span>
          <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={onStartEdit}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:bg-destructive/10"
            onClick={onDelete}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </>
      )}
    </div>
  );
}

// ============================================================
// Monthly Dashboard Component
// ============================================================
function MonthlyDashboard({ store }: { store: ReturnType<typeof useStore> }) {
  const today = new Date();
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth()); // 0-indexed

  const changeMonth = (delta: number) => {
    let m = selectedMonth + delta;
    let y = selectedYear;
    if (m > 11) { m = 0; y++; }
    if (m < 0) { m = 11; y--; }
    setSelectedMonth(m);
    setSelectedYear(y);
  };

  const monthLabel = new Date(selectedYear, selectedMonth, 1).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
  });

  // กรองรายจ่ายของเดือนที่เลือก
  const monthExpenses = useMemo(() => {
    const prefix = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;
    return (store.expenses || []).filter((e) => e.date.startsWith(prefix));
  }, [store.expenses, selectedYear, selectedMonth]);

  const monthTotal = monthExpenses.reduce((s, e) => s + e.amount, 0);

  // สรุปตามหมวดหมู่
  const categoryTotals = useMemo(() => {
    const map: Record<string, { name: string; icon: string; total: number }> = {};
    monthExpenses.forEach((e) => {
      const cat = store.expenseCategories?.find((c) => c.id === e.categoryId);
      if (!map[e.categoryId]) {
        map[e.categoryId] = { name: cat?.name || 'ไม่ทราบ', icon: cat?.icon || '📝', total: 0 };
      }
      map[e.categoryId].total += e.amount;
    });
    return Object.entries(map)
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => b.total - a.total);
  }, [monthExpenses, store.expenseCategories]);

  // สรุปรายวัน (เพื่อแสดงกราฟแท่ง)
  const dailyTotals = useMemo(() => {
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const result: { day: number; total: number }[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const total = monthExpenses
        .filter((e) => e.date === dateStr)
        .reduce((s, e) => s + e.amount, 0);
      result.push({ day: d, total });
    }
    return result;
  }, [monthExpenses, selectedYear, selectedMonth]);

  const maxDaily = Math.max(...dailyTotals.map((d) => d.total), 1);
  const avgDaily = monthTotal / (dailyTotals.filter((d) => d.total > 0).length || 1);

  // สรุปรายวันแบบตาราง (เฉพาะวันที่มีรายการ)
  const dailyRows = useMemo(() => {
    return dailyTotals
      .filter((d) => d.total > 0)
      .map((d) => {
        const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`;
        const label = new Date(dateStr + 'T00:00:00').toLocaleDateString('th-TH', {
          weekday: 'short', day: 'numeric',
        });
        const count = monthExpenses.filter((e) => e.date === dateStr).length;
        return { day: d.day, label, total: d.total, count };
      });
  }, [dailyTotals, monthExpenses, selectedYear, selectedMonth]);

  // วันที่จ่ายสูงสุด
  const topDay = dailyTotals.reduce((a, b) => (b.total > a.total ? b : a), { day: 0, total: 0 });

  return (
    <div className="space-y-6">
      {/* Month Navigator */}
      <div className="flex items-center justify-between bg-card p-3 rounded-xl border shadow-sm">
        <Button variant="ghost" size="icon" onClick={() => changeMonth(-1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-center">
          <p className="text-xs text-muted-foreground">สรุปรายจ่าย</p>
          <p className="text-base font-bold">{monthLabel}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={() => changeMonth(1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-l-4 border-l-destructive">
          <CardContent className="py-4 px-4">
            <p className="text-xs text-muted-foreground mb-1">ยอดรวมทั้งเดือน</p>
            <p className="text-xl font-bold text-destructive">
              {monthTotal.toLocaleString('th-TH', { minimumFractionDigits: 0 })}
            </p>
            <p className="text-xs text-muted-foreground">บาท</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="py-4 px-4">
            <p className="text-xs text-muted-foreground mb-1">จำนวนรายการ</p>
            <p className="text-xl font-bold text-orange-500">{monthExpenses.length}</p>
            <p className="text-xs text-muted-foreground">รายการ</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="py-4 px-4">
            <p className="text-xs text-muted-foreground mb-1">เฉลี่ยต่อวัน</p>
            <p className="text-xl font-bold text-blue-500">
              {avgDaily.toLocaleString('th-TH', { maximumFractionDigits: 0 })}
            </p>
            <p className="text-xs text-muted-foreground">บาท/วัน</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="py-4 px-4">
            <p className="text-xs text-muted-foreground mb-1">หมวดหมู่ทั้งหมด</p>
            <p className="text-xl font-bold text-purple-500">{categoryTotals.length}</p>
            <p className="text-xs text-muted-foreground">ประเภท</p>
          </CardContent>
        </Card>
      </div>

      {/* Daily Bar Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-destructive" />
            กราฟสรุปรายจ่ายรายวัน
            {topDay.total > 0 && (
              <span className="ml-auto text-xs font-normal text-muted-foreground">
                สูงสุดวันที่ {topDay.day} ({topDay.total.toLocaleString('th-TH')} บาท)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* ส่วนควบคุมความสูงของตัวกราฟและทำความสะอาดสไตล์ */}
          <div className="w-full h-64 pt-4 text-[11px] select-none">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dailyTotals}
                margin={{ top: 10, right: 5, left: -25, bottom: 0 }}
                barGap={2}
              >
                {/* เส้น Grid แนวนอนแบบจางๆ (เหมือนสไตล์ใน Python Matplotlib/Seaborn) */}
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                
                {/* แกน X แสดงวันที่ (Tick ละ 5 วันเพื่อไม่ให้ตัวอักษรเบียดกันในมือถือ) */}
                <XAxis 
                  dataKey="day" 
                  tickLine={false}
                  axisLine={false}
                  stroke="#94a3b8"
                  dy={8}
                  interval={window && window.innerWidth < 640 ? 4 : 0} // ถ้าจอมือถือจะโชว์ห่างกันทุก 5 วัน
                  tickFormatter={(value) => `${value}`}
                />
                
                {/* แกน Y แสดงยอดเงิน */}
                <YAxis 
                  tickLine={false}
                  axisLine={false}
                  stroke="#94a3b8"
                  tickFormatter={(value) => value > 0 ? value.toLocaleString('th-TH') : ''}
                />
                
                {/* กล่อง Tooltip สไตล์โมเดิร์น (Interactive ขยับตามเมาส์/นิ้วสัมผัส) */}
                <RechartsTooltip
                  cursor={{ fill: 'rgba(0, 0, 0, 0.04)', radius: 4 }}
                  formatter={(value: any) => [`${Number(value).toLocaleString('th-TH')} บาท`, 'รายจ่าย']}
                  labelFormatter={(label) => `วันที่ ${label}`}
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '0.6rem',
                    border: 'none',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    padding: '8px 12px'
                  }}
                  // ตัวหนังสือหัวข้อ (เช่น วันที่ 5) -> สีขาวหนา
                  labelStyle={{ color: '#ffffff', fontWeight: 'bold', marginBottom: '4px' }} 
                  // ตัวหนังสือรายชื่อข้อมูล (เช่น รายจ่าย: 500 บาท) -> สีขาวนวล อ่านง่าย
                  itemStyle={{ color: '#f8fafc' }} 
                />
                
                {/* แท่งกราฟหลัก (บาร์แต่ละวัน) พร้อม Interactive Logic */}
                <Bar 
                  dataKey="total" 
                  radius={[4, 4, 0, 0]} // มนขอบเฉพาะด้านบนของแท่งกราฟ
                  maxBarSize={30}       // กำหนดไม่ให้แท่งอ้วนเกินไปเมื่อเปิดในหน้าจอคอมพิวเตอร์กว้างๆ
                >
                  {/* วนลูปเพื่อย้อมสีเฉพาะแท่งที่เป็น "วันที่จ่ายเงินสูงสุด (Top Day)" ให้เด่นกว่าวันอื่น */}
                  {dailyTotals.map((entry, index) => {
                    const isTop = entry.day === topDay.day && entry.total > 0;
                    return (
                      <Cell 
                        key={`cell-${index}`} 
                        // วันที่จ่ายสูงสุดจะเป็นสีแดงเข้ม (rose-600) วันทั่วไปที่มีนาจ่ายจะเป็นสีแดงจาง และวันว่างเป็นสีเทาอ่อน
                        fill={isTop ? '#e11d48' : entry.total > 0 ? '#fb7185' : '#f1f5f9'}
                        className="transition-all duration-200 cursor-pointer hover:opacity-80"
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {monthExpenses.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <PieChart className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>ยังไม่มีข้อมูลรายจ่ายในเดือนนี้</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Bottom Grid: Category Breakdown + Daily Table */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Category Breakdown */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Tag className="h-4 w-4 text-purple-500" />
                  สรุปตามหมวดหมู่
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {categoryTotals.map((cat) => {
                  const pct = monthTotal > 0 ? (cat.total / monthTotal) * 100 : 0;
                  return (
                    <div key={cat.id} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1.5">
                          <span>{cat.icon}</span>
                          <span className="font-medium">{cat.name}</span>
                        </span>
                        <span className="text-right">
                          <span className="font-semibold text-destructive">
                            {cat.total.toLocaleString('th-TH', { minimumFractionDigits: 0 })}
                          </span>
                          <span className="text-xs text-muted-foreground ml-1">บาท</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-destructive/60 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-[11px] text-muted-foreground w-9 text-right">
                          {pct.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Daily Summary Table */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-blue-500" />
                  สรุปรายวัน
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-hidden">
                  <div className="max-h-64 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-muted text-xs text-muted-foreground">
                        <tr>
                          <th className="p-2 text-left font-semibold">วัน</th>
                          <th className="p-2 text-center font-semibold">รายการ</th>
                          <th className="p-2 text-right font-semibold">ยอด (บาท)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {dailyRows.map((row) => (
                          <tr key={row.day} className="hover:bg-muted/50">
                            <td className="p-2 text-xs">{row.label}</td>
                            <td className="p-2 text-center text-xs text-muted-foreground">{row.count}</td>
                            <td className="p-2 text-right text-xs font-medium text-destructive">
                              {row.total.toLocaleString('th-TH', { minimumFractionDigits: 0 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="sticky bottom-0 bg-card border-t">
                        <tr>
                          <td className="p-2 text-xs font-bold">รวม</td>
                          <td className="p-2 text-center text-xs font-bold">{monthExpenses.length}</td>
                          <td className="p-2 text-right text-xs font-bold text-destructive">
                            {monthTotal.toLocaleString('th-TH', { minimumFractionDigits: 0 })}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================
// Main Page
// ============================================================
export default function ExpensesPage() {
  const store = useStore();

  // โหมด: 'daily' | 'monthly'
  const [viewMode, setViewMode] = useState<'daily' | 'monthly'>('daily');
  
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
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState('');
  const [editCatIcon, setEditCatIcon] = useState('📝');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // ควบคุม Dialog ยืนยันลบ
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleteType, setDeleteType] = useState<'expense' | 'category' | null>(null);

  // ตั้งค่าวันที่ปัจจุบันเมื่อเข้าหน้าจอครั้งแรก
  useEffect(() => {
    setSelectedDate(getToday());
    store.loadData();
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

  const handleStartEditCategory = (cat: ExpenseCategory) => {
    setEditingCatId(cat.id);
    setEditCatName(cat.name);
    setEditCatIcon(cat.icon || '📝');
  };

  const handleSaveEditCategory = () => {
    if (!editingCatId || !editCatName.trim()) return;
    store.updateExpenseCategory(editingCatId, {
      name: editCatName.trim(),
      icon: editCatIcon,
    });
    setEditingCatId(null);
  };

  const handleCancelEditCategory = () => {
    setEditingCatId(null);
  };

  const handleDragEndCategories = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const categories = store.expenseCategories || [];
    const oldIndex = categories.findIndex((c) => c.id === active.id);
    const newIndex = categories.findIndex((c) => c.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    store.reorderExpenseCategories(arrayMove(categories, oldIndex, newIndex));
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

        <div className="grid grid-rows-2 items-center gap-2 w-full sm:w-auto">
          {/* Toggle Mode */}
          <div className="flex bg-muted rounded-lg p-1 gap-1">
            <Button
              variant={viewMode === 'daily' ? 'default' : 'ghost'}
              size="sm"
              className="h-8 gap-1.5 text-xs"
              onClick={() => setViewMode('daily')}
            >
              <CalendarDays className="h-3.5 w-3.5" />
              รายวัน
            </Button>
            <Button
              variant={viewMode === 'monthly' ? 'default' : 'ghost'}
              size="sm"
              className="h-8 gap-1.5 text-xs"
              onClick={() => setViewMode('monthly')}
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              Dashboard รายเดือน
            </Button>
          </div>

          {/* Date Navigator (เฉพาะ mode รายวัน) */}
          {viewMode === 'daily' && (
            <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => changeDate(-1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs font-medium px-2 min-w-[130px] text-center">
                {formatDateThai(selectedDate)}
              </span>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => changeDate(1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* ======= MONTHLY DASHBOARD MODE ======= */}
      {viewMode === 'monthly' && (
        <MonthlyDashboard store={store} />
      )}

      {/* ======= DAILY MODE ======= */}
      {viewMode === 'daily' && (
        <>
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

                      {/* ลิสต์รายการหมวดหมู่ — ลากจัดลำดับ / แก้ไข / ลบ */}
                      <div className="space-y-2 max-h-72 overflow-y-auto pt-2">
                        <Label className="text-xs text-muted-foreground">
                          หมวดหมู่ทั้งหมด (ลากเพื่อจัดลำดับ)
                        </Label>
                        {store.expenseCategories?.length === 0 ? (
                          <p className="text-center text-xs text-muted-foreground py-4">ไม่มีหมวดหมู่รายจ่ายในระบบ</p>
                        ) : (
                          <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEndCategories}
                          >
                            <SortableContext
                              items={store.expenseCategories.map((c) => c.id)}
                              strategy={verticalListSortingStrategy}
                            >
                              <div className="space-y-1.5">
                                {store.expenseCategories.map((cat) => (
                                  <SortableCategoryRow
                                    key={cat.id}
                                    cat={cat}
                                    isEditing={editingCatId === cat.id}
                                    editName={editCatName}
                                    editIcon={editCatIcon}
                                    onEditName={setEditCatName}
                                    onEditIcon={setEditCatIcon}
                                    onStartEdit={() => handleStartEditCategory(cat)}
                                    onSaveEdit={handleSaveEditCategory}
                                    onCancelEdit={handleCancelEditCategory}
                                    onDelete={() => {
                                      setDeleteTargetId(cat.id);
                                      setDeleteType('category');
                                    }}
                                  />
                                ))}
                              </div>
                            </SortableContext>
                          </DndContext>
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
        </>
      )}

      {/* ส่วนปิดท้าย: หน้าต่างเตือนยืนยันลบข้อมูลแบบครอบคลุม (Global Delete Alert Dialog) */}
      <AlertDialog 
        open={deleteTargetId !== null} 
        onOpenChange={(isOpen) => { if(!isOpen) { setDeleteTargetId(null); setDeleteType(null); } }}
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