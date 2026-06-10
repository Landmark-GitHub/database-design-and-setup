// 'use client';

// import { create } from 'zustand';
// import {
//   AppState,
//   Member,
//   Product,
//   Bill,
//   DailySummary,
//   HistoryLog,
//   AppSettings,
//   DEFAULT_PRODUCTS,
//   generateId,
//   getToday,
//   getCurrentMonth,
//   createDefaultMember,
//   createDefaultProduct,
//   createNewBill,
//   calculateBillTotals,
//   PRODUCT_TYPE_LABELS,
//   ExpenseCategory,
//   ExpenseItem,
// } from './types';

// // ===== INITIAL STATE =====
// const getInitialProducts = (): Product[] => {
//   const now = new Date().toISOString();
//   return DEFAULT_PRODUCTS.map((p, index) => ({
//     ...p,
//     id: `product-${index + 1}`,
//     createdAt: now,
//     updatedAt: now,
//   }));
// };

// const getInitialCategories = (): ExpenseCategory[] => {
//   const now = new Date().toISOString();
//   return [
//     { id: 'cat-1', name: 'น้ำแข็ง', icon: '🧊', createdAt: now },
//     { id: 'cat-2', name: 'น้ำมันรถ', icon: '⛽', createdAt: now },
//     { id: 'cat-3', name: 'อาหาร/สวัสดิการ', icon: '🍲', createdAt: now },
//     { id: 'cat-4', name: 'ซื้อของเข้าร้าน', icon: '📦', createdAt: now },
//     { id: 'cat-5', name: 'อื่น ๆ', icon: '⚙️', createdAt: now },
//   ];
// };

// const initialState: AppState = {
//   members: [],
//   products: getInitialProducts(),
//   bills: [],
//   dailySummaries: [],
//   historyLogs: [],
//   settings: {
//     retentionMonths: 3,
//     reminderExport: true,
//     lastExportDate: '',
//   },
//   lastCleanup: getToday(),
//   expenseCategories: getInitialCategories(),
//   expenses: [],
// };

// export interface ExpenseActions {
//   addExpenseCategory: (name: string, icon?: string) => void;
//   deleteExpenseCategory: (id: string) => void;
//   addExpense: (expense: Omit<ExpenseItem, 'id' | 'createdAt'>) => void;
//   deleteExpense: (id: string) => void;
// }

// // ===== JSON FILE STORAGE HELPERS =====
// async function loadFromJSON(): Promise<AppState | null> {
//   try {
//     const res = await fetch('/api/ledger-store');
//     if (!res.ok) return null;
//     const data = await res.json();
//     if (!data.products || data.products.length === 0) {
//       data.products = getInitialProducts();
//     }
//     data.expenseCategories = data.expenseCategories || getInitialCategories();
//     data.expenses = data.expenses || [];
//     return data;
//   } catch (error) {
//     console.error('Error loading from JSON:', error);
//     return null;
//   }
// }

// async function saveToJSON(state: AppState): Promise<void> {
//   try {
//     await fetch('/api/ledger-store', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({
//         members: state.members,
//         products: state.products,
//         bills: state.bills,
//         dailySummaries: state.dailySummaries,
//         historyLogs: state.historyLogs,
//         settings: state.settings,
//         lastCleanup: state.lastCleanup,
//       }),
//     });
//   } catch (error) {
//     console.error('Error saving to JSON:', error);
//   }
// }



// // // ===== เปลี่ยนฟังก์ชันบันทึกข้อมูลใน store.ts =====
// // async function saveToJSON(state: AppState) {
// //   try {
// //     // ยิง POST ตรงไปที่ Google Sheets เลย
// //     await fetch(GOOGLE_SHEETS_API_URL, {
// //       method: 'POST',
// //       mode: 'no-cors', // ⚠️ สำคัญมาก: Google Apps Script มักจะติดเรื่อง CORS สำหรับขอยิง POST 
// //       headers: {
// //         'Content-Type': 'application/json',
// //       },
// //       body: JSON.stringify(state),
// //     });
// //   } catch (error) {
// //     console.error('Error saving to Google Sheets:', error);
// //   }
// // }

// // ===== STORE INTERFACE =====
// interface StoreActions {
//   addMember: (name: string) => Member;
//   updateMember: (id: string, updates: Partial<Member>) => void;
//   deleteMember: (id: string) => void;
  
//   addProduct: (data: Partial<Product>) => Product;
//   updateProduct: (id: string, updates: Partial<Product>) => void;
//   deleteProduct: (id: string) => void;
//   reorderProducts: (products: Product[]) => void;
  
//   createBill: (memberId: string, date?: string) => { id: string };
//   updateBill: (billId: string, updates: Partial<Bill>) => void;
//   updateBillItem: (billId: string, productId: string, updates: Partial<Bill['items'][0]>) => void;
//   deleteBill: (billId: string) => void;
//   confirmCheckout: (billId: string) => void;
//   confirmDayClose: (billId: string) => void;
  
//   getTodayBills: () => Bill[];
//   getMemberBillsToday: (memberId: string) => Bill[];
//   getLastBillForMember: (memberId: string) => Bill | undefined;
  
//   closeDaySummary: () => void;
//   exportToCSV: (month?: string) => string;
//   runAutoCleanup: () => void;
//   updateSettings: (updates: Partial<AppSettings>) => void;
//   resetAll: () => void;
//   loadData: () => Promise<void>;
//   _isLoaded: boolean;
// }

// type Store = AppState & StoreActions;

// // ===== ZUSTAND STORE =====
// export const useStore = create<Store>()((set, get) => ({
//   ...initialState,
//   _isLoaded: false,

//   loadData: async () => {
//     const data = await loadFromJSON();
//     if (data) {
//       set({ ...data, _isLoaded: true });
//     } else {
//       set({ _isLoaded: true });
//     }
//   },
  
//   // ===== MEMBERS =====
//   addMember: (name: string) => {
//     const member = createDefaultMember(name);
//     set((state) => {
//       const newState = { members: [...state.members, member] };
//       saveToJSON({ ...state, ...newState });
//       return newState;
//     });
//     return member;
//   },
  
//   updateMember: (id: string, updates: Partial<Member>) => {
//     set((state) => {
//       const newState = {
//         members: state.members.map((m) =>
//           m.id === id ? { ...m, ...updates, updatedAt: new Date().toISOString() } : m
//         ),
//       };
//       saveToJSON({ ...state, ...newState });
//       return newState;
//     });
//   },
  
//   deleteMember: (id: string) => {
//     set((state) => {
//       const newState = { members: state.members.filter((m) => m.id !== id) };
//       saveToJSON({ ...state, ...newState });
//       return newState;
//     });
//   },
  
//   // ===== PRODUCTS =====
//   addProduct: (data: Partial<Product>) => {
//     const product = createDefaultProduct({
//       ...data,
//       sortOrder: get().products.length + 1,
//     });
//     set((state) => {
//       const newState = { products: [...state.products, product] };
//       saveToJSON({ ...state, ...newState });
//       return newState;
//     });
//     return product;
//   },
  
//   updateProduct: (id: string, updates: Partial<Product>) => {
//     set((state) => {
//       const newState = {
//         products: state.products.map((p) =>
//           p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
//         ),
//       };
//       saveToJSON({ ...state, ...newState });
//       return newState;
//     });
//   },
  
//   deleteProduct: (id: string) => {
//     set((state) => {
//       const newState = { products: state.products.filter((p) => p.id !== id) };
//       saveToJSON({ ...state, ...newState });
//       return newState;
//     });
//   },
  
//   reorderProducts: (products: Product[]) => {
//     set((state) => {
//       const newState = { products };
//       saveToJSON({ ...state, ...newState });
//       return newState;
//     });
//   },
  
//   // ===== BILLS =====
//   createBill: (memberId: string, date?: string) => {
//     let newlyCreatedBillId = ''; 

//     set((state) => {
//       const member = state.members.find((m) => m.id === memberId);
//       if (!member) return state;

//       const billDate = date || getToday();
      
//       // ค้นหาบิลเก่าล่าสุดโดยเปรียบเทียบจากตัวอักษรวันที่
//       const prevBill = state.bills
//       .filter((b) => b.memberId === memberId && b.status === 'completed' && b.date < billDate)
//       .sort((a, b) => {
//         const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
//         if (dateDiff !== 0) return dateDiff;
//         // ถ้าวันเดียวกัน เอาบิลที่สร้างหลังสุด (amountOwed ล่าสุด)
//         return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
//       })[0];

//       const bill = createNewBill(memberId, member.name, state.products, prevBill, billDate);
      
//       // บันทึกสะสมยอดค้างจากหนี้สุทธิเก่าลงฟิลด์ previousOwed ของบิลปัจจุบันอย่างชัดเจน
//       bill.previousOwed = prevBill ? prevBill.amountOwed : 0;
//       newlyCreatedBillId = bill.id; 

//       const newState = { bills: [...state.bills, bill] };
//       saveToJSON({ ...state, ...newState });
//       return newState;
//     });

//     return { id: newlyCreatedBillId }; 
//   },
  
//   updateBill: (billId: string, updates: Partial<Bill>) => {
//     set((state) => {
//       const bills = state.bills.map((b) => {
//         if (b.id !== billId) return b;
//         const updated = { ...b, ...updates, updatedAt: new Date().toISOString() };
//         const member = state.members.find((m) => m.id === updated.memberId);
//         const { totalSales, amountOwed } = calculateBillTotals(updated, state.products, member);
//         return { ...updated, totalSales, amountOwed };
//       });
//       const newState = { bills };
//       saveToJSON({ ...state, ...newState });
//       return newState;
//     });
//   },
  
//   updateBillItem: (billId: string, productId: string, updates: Partial<Bill['items'][0]>) => {
//     set((state) => {
//       const bills = state.bills.map((b) => {
//         if (b.id !== billId) return b;
        
//         const items = b.items.map((item) => {
//           if (item.productId !== productId) return item;
          
//           const updated = { ...item, ...updates };
//           updated.totalStock = updated.oldStock + updated.newStock;
//           updated.sold = updated.totalStock - updated.returned;
          
//           return updated;
//         });
        
//         const updated = { ...b, items, updatedAt: new Date().toISOString() };
//         const member = state.members.find((m) => m.id === updated.memberId);
//         const { totalSales, amountOwed } = calculateBillTotals(updated, state.products, member);
//         return { ...updated, totalSales, amountOwed };
//       });
//       const newState = { bills };
//       saveToJSON({ ...state, ...newState });
//       return newState;
//     });
//   },
  
//   deleteBill: (billId: string) => {
//     set((state) => {
//       const newState = { bills: state.bills.filter((b) => b.id !== billId) };
//       saveToJSON({ ...state, ...newState });
//       return newState;
//     });
//   },
  
//   confirmCheckout: (billId: string) => {
//     set((state) => {
//       const newState = {
//         bills: state.bills.map((b) =>
//           b.id === billId ? { ...b, status: 'checkout' as const, updatedAt: new Date().toISOString() } : b
//         ),
//       };
//       saveToJSON({ ...state, ...newState });
//       return newState;
//     });
//   },
  
//   confirmDayClose: (billId: string) => {
//     set((state) => {
//       const newState = {
//         bills: state.bills.map((b) =>
//           b.id === billId ? { ...b, status: 'completed' as const, dayClosed: true, updatedAt: new Date().toISOString() } : b
//         ),
//       };
//       saveToJSON({ ...state, ...newState });
//       return newState;
//     });
//   },
  
//   // ===== BILL HELPERS =====
//   getTodayBills: () => {
//     const today = getToday();
//     return get().bills.filter((b) => b.date === today);
//   },
  
//   getMemberBillsToday: (memberId: string) => {
//     const today = getToday();
//     return get().bills.filter((b) => b.memberId === memberId && b.date === today);
//   },
  
//   getLastBillForMember: (memberId: string) => {
//     return get().bills
//       .filter((b) => b.memberId === memberId)
//       .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
//   },
  
//   // ===== DAILY SUMMARY =====
//   closeDaySummary: () => {
//     const state = get();
//     const today = getToday();
//     const todayBills = state.bills.filter((b) => b.date === today);
    
//     if (todayBills.length === 0) return;
    
//     const summary: DailySummary = {
//       date: today,
//       totalBills: todayBills.length,
//       totalSales: todayBills.reduce((sum, b) => sum + b.totalSales, 0),
//       totalOwed: todayBills.reduce((sum, b) => sum + b.amountOwed, 0),
//       memberSummaries: todayBills.map((b) => ({
//         memberId: b.memberId,
//         memberName: b.memberName,
//         totalSales: b.totalSales,
//         totalOwed: b.amountOwed,
//       })),
//       closed: true,
//       createdAt: new Date().toISOString(),
//     };
    
//     set((state) => {
//       const newState = {
//         dailySummaries: [...state.dailySummaries.filter((s) => s.date !== today), summary],
//         bills: state.bills.map((b) =>
//           b.date === today ? { ...b, dayClosed: true } : b
//         ),
//       };
//       saveToJSON({ ...state, ...newState });
//       return newState;
//     });
//   },
  
//   // ===== EXPORT =====
//   exportToCSV: (month?: string) => {
//     const state = get();
//     const targetMonth = month || getCurrentMonth();
//     const bills = state.bills.filter((b) => b.date.startsWith(targetMonth));
    
//     if (bills.length === 0) return '';
    
//     const headers = [
//       'วันที่', 'ชื่อสมาชิก', 'ประเภทสินค้า', 'ชื่อสินค้า', 'ยอดเก่า', 
//       'ยอดใหม่ (เบิก)', 'ยอดรวม', 'ยอดเหลือคืน', 'ยอดขาย', 'ราคา/ชิ้น', 
//       'มูลค่าขาย (บาท)', 'ค่าน้ำแข็ง (บาท)', 'ยอดขายรวม (บาท)', 'จ่ายแล้ว (บาท)', 
//       'ค้างชำระ (บาท)', 'หมายเหตุ', 'สถานะ'
//     ];
    
//     const rows: string[][] = [];
//     const sortedBills = [...bills].sort((a, b) => a.date.localeCompare(b.date));
    
//     sortedBills.forEach((bill) => {
//       let isFirstItem = true;
//       const productTypes = Array.from(new Set(state.products.map(p => p.type)));
      
//       productTypes.forEach((type) => {
//         const typeProducts = state.products.filter(p => p.type === type);
//         const typeItems = bill.items.filter(item => 
//           typeProducts.some(p => p.id === item.productId) && 
//           (item.totalStock > 0 || item.newStock > 0 || item.sold > 0)
//         );
        
//         if (typeItems.length === 0) return;
        
//         const typeTotalStock = typeItems.reduce((sum, i) => sum + i.totalStock, 0);
//         const typeReturned = bill.returnInputs?.[type] || 0;
//         const typeSold = Math.max(0, typeTotalStock - typeReturned);
//         const basePrice = typeItems[0]?.priceUsed || 0;
//         const typeSubtotal = typeSold * basePrice;
//         const typeName = PRODUCT_TYPE_LABELS[type as keyof typeof PRODUCT_TYPE_LABELS] || type;
        
//         rows.push([
//           isFirstItem ? formatDateThai(bill.date) : '',
//           isFirstItem ? bill.memberName : '',
//           typeName,
//           `รวม ${typeName}`,
//           typeItems.reduce((sum, i) => sum + i.oldStock, 0).toString(),
//           typeItems.reduce((sum, i) => sum + i.newStock, 0).toString(),
//           typeTotalStock.toString(),
//           typeReturned.toString(),
//           typeSold.toString(),
//           basePrice.toString(),
//           typeSubtotal.toLocaleString(),
//           isFirstItem ? (bill.icePrice || 0).toLocaleString() : '',
//           isFirstItem ? Math.round(bill.totalSales).toLocaleString() : '',
//           isFirstItem ? Math.round(bill.amountPaid).toLocaleString() : '',
//           isFirstItem ? Math.round(bill.amountOwed).toLocaleString() : '',
//           isFirstItem ? (bill.notes || '-') : '',
//           isFirstItem ? getStatusLabel(bill.status) : '',
//         ]);
        
//         isFirstItem = false;
//       });
//       rows.push(Array(headers.length).fill(''));
//     });
    
//     const csv = [headers.join(','), ...rows.map((r) => r.map((cell) => `"${cell}"`).join(','))].join('\n');
    
//     set((state) => {
//       const newState = { settings: { ...state.settings, lastExportDate: new Date().toISOString() } };
//       saveToJSON({ ...state, ...newState });
//       return newState;
//     });
    
//     return csv;
//   },
  
//   // ===== AUTO CLEANUP =====
//   runAutoCleanup: () => {
//     const state = get();
//     const retentionMonths = state.settings.retentionMonths;
//     const cutoffDate = new Date();
//     cutoffDate.setMonth(cutoffDate.getMonth() - retentionMonths);
//     const cutoffMonth = cutoffDate.toISOString().slice(0, 7);
//     const billsToDelete = state.bills.filter((b) => b.date.slice(0, 7) < cutoffMonth);
    
//     if (billsToDelete.length === 0) return;
    
//     const monthGroups: Record<string, Bill[]> = {};
//     billsToDelete.forEach((b) => {
//       const month = b.date.slice(0, 7);
//       if (!monthGroups[month]) monthGroups[month] = [];
//       monthGroups[month].push(b);
//     });
    
//     const newLogs: HistoryLog[] = Object.entries(monthGroups).map(([month, bills]) => ({
//       id: generateId(),
//       month,
//       totalBills: bills.length,
//       totalSales: bills.reduce((sum, b) => sum + b.totalSales, 0),
//       totalOwed: bills.reduce((sum, b) => sum + b.amountOwed, 0),
//       deletedAt: new Date().toISOString(),
//     }));
    
//     set((state) => {
//       const newState = {
//         bills: state.bills.filter((b) => b.date.slice(0, 7) >= cutoffMonth),
//         dailySummaries: state.dailySummaries.filter((s) => s.date.slice(0, 7) >= cutoffMonth),
//         historyLogs: [...state.historyLogs, ...newLogs],
//         lastCleanup: getToday(),
//       };
//       saveToJSON({ ...state, ...newState });
//       return newState;
//     });
//   },
  
//   // ===== SETTINGS =====
//   updateSettings: (updates: Partial<AppSettings>) => {
//     set((state) => {
//       const newState = { settings: { ...state.settings, ...updates } };
//       saveToJSON({ ...state, ...newState });
//       return newState;
//     });
//   },
  
//   // ===== RESET =====
//   resetAll: () => {
//     set(initialState);
//     saveToJSON(initialState);
//   },


//   // เพิ่มหมวดหมู่รายจ่ายใหม่
//   addExpenseCategory: (name: string, icon = '📝') => {
//     set((state) => {
//       const newCategory: ExpenseCategory = {
//         id: `cat-${Date.now()}`,
//         name,
//         icon,
//         createdAt: new Date().toISOString(),
//       };
//       const newState = {
//         expenseCategories: [...state.expenseCategories, newCategory],
//         historyLogs: [
//           ...state.historyLogs,
//           {
//             id: `log-${Date.now()}`,
//             timestamp: new Date().toISOString(),
//             action: 'เพิ่มหมวดหมู่รายจ่าย',
//             details: `เพิ่มหมวดหมู่ "${name}"`,
//           },
//         ],
//       };
//       saveToJSON({ ...state, ...newState });
//       return newState;
//     });
//   },

//   // ลบหมวดหมู่รายจ่าย
//   deleteExpenseCategory: (id: string) => {
//     set((state) => {
//       const targetCategory = state.expenseCategories.find((c) => c.id === id);
//       const newState = {
//         expenseCategories: state.expenseCategories.filter((c) => c.id !== id),
//         // ล้างรายการรายจ่ายที่ผูกกับหมวดหมู่นี้ทิ้งไปด้วยเพื่อป้องกันบั๊กข้อมูลกำพร้า
//         expenses: state.expenses.filter((e) => e.categoryId !== id),
//         historyLogs: [
//           ...state.historyLogs,
//           {
//             id: `log-${Date.now()}`,
//             timestamp: new Date().toISOString(),
//             action: 'ลบหมวดหมู่รายจ่าย',
//             details: `ลบหมวดหมู่ "${targetCategory?.name || id}" และข้อมูลรายจ่ายที่เกี่ยวข้อง`,
//           },
//         ],
//       };
//       saveToJSON({ ...state, ...newState });
//       return newState;
//     });
//   },

//   // บันทึกรายจ่ายประจำวัน
//   addExpense: (expenseData) => {
//     set((state) => {
//       const newExpense: ExpenseItem = {
//         ...expenseData,
//         id: `exp-${Date.now()}`,
//         createdAt: new Date().toISOString(),
//       };
//       const category = state.expenseCategories.find((c) => c.id === expenseData.categoryId);
//       const newState = {
//         expenses: [...state.expenses, newExpense],
//         historyLogs: [
//           ...state.historyLogs,
//           {
//             id: `log-${Date.now()}`,
//             timestamp: new Date().toISOString(),
//             action: 'บันทึกรายจ่าย',
//             details: `ลงยอด ${expenseData.amount} บาท ในหมวดหมู่ ${category?.name || 'ทั่วไป'}`,
//           },
//         ],
//       };
//       saveToJSON({ ...state, ...newState });
//       return newState;
//     });
//   },

//   // ลบรายการรายจ่าย
//   deleteExpense: (id: string) => {
//     set((state) => {
//       const targetExpense = state.expenses.find((e) => e.id === id);
//       const newState = {
//         expenses: state.expenses.filter((e) => e.id !== id),
//         historyLogs: [
//           ...state.historyLogs,
//           {
//             id: `log-${Date.now()}`,
//             timestamp: new Date().toISOString(),
//             action: 'ลบรายการรายจ่าย',
//             details: `ลบยอดจำนวน ${targetExpense?.amount || 0} บาท ออกจากระบบ`,
//           },
//         ],
//       };
//       saveToJSON({ ...state, ...newState });
//       return newState;
//     });
//   },
// }));

// function formatDateThai(dateStr: string): string {
//   const date = new Date(dateStr + 'T00:00:00');
//   return date.toLocaleDateString('th-TH', {
//     year: 'numeric',
//     month: 'short',
//     day: 'numeric',
//     weekday: 'short',
//   });
// }

// function getStatusLabel(status: string): string {
//   switch (status) {
//     case 'draft': return 'กำลังเบิก';
//     case 'checkout': return 'เบิกแล้ว';
//     case 'completed': return 'ปิดวันแล้ว';
//     default: return status;
//   }
// }

// export const selectMembers = (state: Store) => state.members;
// export const selectProducts = (state: Store) => state.products;
// export const selectBills = (state: Store) => state.bills;
// export const selectSettings = (state: Store) => state.settings;
// export const selectHistoryLogs = (state: Store) => state.historyLogs;


'use client';

import { create } from 'zustand';
import {
  AppState,
  Member,
  Product,
  Bill,
  DailySummary,
  HistoryLog,
  AppSettings,
  DEFAULT_PRODUCTS,
  generateId,
  getToday,
  getCurrentMonth,
  createDefaultMember,
  createDefaultProduct,
  createNewBill,
  calculateBillTotals,
  PRODUCT_TYPE_LABELS,
  ExpenseCategory,
  ExpenseItem,
} from './types';

// ===== INITIAL STATE =====
const getInitialProducts = (): Product[] => {
  const now = new Date().toISOString();
  return DEFAULT_PRODUCTS.map((p, index) => ({
    ...p,
    id: `product-${index + 1}`,
    createdAt: now,
    updatedAt: now,
  }));
};

const getInitialCategories = (): ExpenseCategory[] => {
  const now = new Date().toISOString();
  return [
    { id: 'cat-1', name: 'น้ำแข็ง', icon: '🧊', createdAt: now },
    { id: 'cat-2', name: 'น้ำมันรถ', icon: '⛽', createdAt: now },
    { id: 'cat-3', name: 'อาหาร/สวัสดิการ', icon: '🍲', createdAt: now },
    { id: 'cat-4', name: 'ซื้อของเข้าร้าน', icon: '📦', createdAt: now },
    { id: 'cat-5', name: 'อื่น ๆ', icon: '⚙️', createdAt: now },
    { id: 'cat-6', name: 'ค่ารถ', icon: '🚗', createdAt: now },
    { id: 'cat-7', name: 'ค่าไฟ', icon: '⚡', createdAt: now },
    { id: 'cat-8', name: 'ค่าน้ำ', icon: '💧', createdAt: now },
    { id: 'cat-9', name: 'ค่ากิน', icon: '🍽️', createdAt: now },
    { id: 'cat-10', name: 'ค่าข้าว', icon: '🍚', createdAt: now },
    { id: 'cat-11', name: 'ค่าจิปาถะ', icon: '🛍️', createdAt: now },
    { id: 'cat-12', name: 'Mark', icon: '👤', createdAt: now },
    { id: 'cat-13', name: 'Jan', icon: '👤', createdAt: now },
    { id: 'cat-14', name: 'Yen', icon: '👤', createdAt: now },
    { id: 'cat-15', name: 'Father', icon: '👨', createdAt: now },
    { id: 'cat-16', name: 'อะไหล่รถ', icon: '🔧', createdAt: now },
    { id: 'cat-17', name: 'Faith', icon: '👤', createdAt: now },
    { id: 'cat-18', name: 'Wifi', icon: '🌐', createdAt: now },
    { id: 'cat-19', name: 'Net Mobile', icon: '📱', createdAt: now },
  ];
};

const initialState: AppState = {
  members: [],
  products: getInitialProducts(),
  bills: [],
  dailySummaries: [],
  historyLogs: [],
  settings: {
    retentionMonths: 3,
    reminderExport: true,
    lastExportDate: '',
  },
  lastCleanup: getToday(),
  expenseCategories: getInitialCategories(),
  expenses: [],
};

export interface ExpenseActions {
  addExpenseCategory: (name: string, icon?: string) => void;
  deleteExpenseCategory: (id: string) => void;
  addExpense: (expense: Omit<ExpenseItem, 'id' | 'createdAt'>) => void;
  deleteExpense: (id: string) => void;
}

// ===== JSON FILE STORAGE HELPERS =====
async function loadFromJSON(): Promise<AppState | null> {
  try {
    const res = await fetch('/api/ledger-store');
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.products || data.products.length === 0) {
      data.products = getInitialProducts();
    }
    data.expenseCategories = data.expenseCategories || getInitialCategories();
    data.expenses = data.expenses || [];
    return data;
  } catch (error) {
    console.error('Error loading from JSON:', error);
    return null;
  }
}

async function saveToJSON(state: AppState): Promise<void> {
  try {
    await fetch('/api/ledger-store', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        members: state.members,
        products: state.products,
        bills: state.bills,
        dailySummaries: state.dailySummaries,
        historyLogs: state.historyLogs,
        settings: state.settings,
        lastCleanup: state.lastCleanup,
        expenseCategories: state.expenseCategories,
        expenses: state.expenses,
      }),
    });
  } catch (error) {
    console.error('Error saving to JSON:', error);
  }
}



// // ===== เปลี่ยนฟังก์ชันบันทึกข้อมูลใน store.ts =====
// async function saveToJSON(state: AppState) {
//   try {
//     // ยิง POST ตรงไปที่ Google Sheets เลย
//     await fetch(GOOGLE_SHEETS_API_URL, {
//       method: 'POST',
//       mode: 'no-cors', // ⚠️ สำคัญมาก: Google Apps Script มักจะติดเรื่อง CORS สำหรับขอยิง POST 
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify(state),
//     });
//   } catch (error) {
//     console.error('Error saving to Google Sheets:', error);
//   }
// }

// ===== STORE INTERFACE =====
interface StoreActions {
  addMember: (name: string) => Member;
  updateMember: (id: string, updates: Partial<Member>) => void;
  deleteMember: (id: string) => void;
  
  addProduct: (data: Partial<Product>) => Product;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  reorderProducts: (products: Product[]) => void;
  
  createBill: (memberId: string, date?: string) => { id: string };
  updateBill: (billId: string, updates: Partial<Bill>) => void;
  updateBillItem: (billId: string, productId: string, updates: Partial<Bill['items'][0]>) => void;
  deleteBill: (billId: string) => void;
  confirmCheckout: (billId: string) => void;
  confirmDayClose: (billId: string) => void;
  
  getTodayBills: () => Bill[];
  getMemberBillsToday: (memberId: string) => Bill[];
  getLastBillForMember: (memberId: string) => Bill | undefined;
  
  closeDaySummary: () => void;
  exportToCSV: (month?: string) => string;
  runAutoCleanup: () => void;
  updateSettings: (updates: Partial<AppSettings>) => void;
  resetAll: () => void;
  loadData: () => Promise<void>;
  _isLoaded: boolean;
}

type Store = AppState & StoreActions;

// ===== ZUSTAND STORE =====
export const useStore = create<Store>()((set, get) => ({
  ...initialState,
  _isLoaded: false,

  loadData: async () => {
    const data = await loadFromJSON();
    if (data) {
      set({ ...data, _isLoaded: true });
    } else {
      set({ _isLoaded: true });
    }
  },
  
  // ===== MEMBERS =====
  addMember: (name: string) => {
    const member = createDefaultMember(name);
    set((state) => {
      const newState = { members: [...state.members, member] };
      saveToJSON({ ...state, ...newState });
      return newState;
    });
    return member;
  },
  
  updateMember: (id: string, updates: Partial<Member>) => {
    set((state) => {
      const newState = {
        members: state.members.map((m) =>
          m.id === id ? { ...m, ...updates, updatedAt: new Date().toISOString() } : m
        ),
      };
      saveToJSON({ ...state, ...newState });
      return newState;
    });
  },
  
  deleteMember: (id: string) => {
    set((state) => {
      const newState = { members: state.members.filter((m) => m.id !== id) };
      saveToJSON({ ...state, ...newState });
      return newState;
    });
  },
  
  // ===== PRODUCTS =====
  addProduct: (data: Partial<Product>) => {
    const product = createDefaultProduct({
      ...data,
      sortOrder: get().products.length + 1,
    });
    set((state) => {
      const newState = { products: [...state.products, product] };
      saveToJSON({ ...state, ...newState });
      return newState;
    });
    return product;
  },
  
  updateProduct: (id: string, updates: Partial<Product>) => {
    set((state) => {
      const newState = {
        products: state.products.map((p) =>
          p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
        ),
      };
      saveToJSON({ ...state, ...newState });
      return newState;
    });
  },
  
  deleteProduct: (id: string) => {
    set((state) => {
      const newState = { products: state.products.filter((p) => p.id !== id) };
      saveToJSON({ ...state, ...newState });
      return newState;
    });
  },
  
  reorderProducts: (products: Product[]) => {
    set((state) => {
      const newState = { products };
      saveToJSON({ ...state, ...newState });
      return newState;
    });
  },
  
  // ===== BILLS =====
  createBill: (memberId: string, date?: string) => {
    let newlyCreatedBillId = ''; 

    set((state) => {
      const member = state.members.find((m) => m.id === memberId);
      if (!member) return state;

      const billDate = date || getToday();
      
      // ค้นหาบิลเก่าล่าสุดโดยเปรียบเทียบจากตัวอักษรวันที่
      const prevBill = state.bills
      .filter((b) => b.memberId === memberId && b.status === 'completed' && b.date < billDate)
      .sort((a, b) => {
        const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
        if (dateDiff !== 0) return dateDiff;
        // ถ้าวันเดียวกัน เอาบิลที่สร้างหลังสุด (amountOwed ล่าสุด)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      })[0];

      const bill = createNewBill(memberId, member.name, state.products, prevBill, billDate);
      
      // บันทึกสะสมยอดค้างจากหนี้สุทธิเก่าลงฟิลด์ previousOwed ของบิลปัจจุบันอย่างชัดเจน
      bill.previousOwed = prevBill ? prevBill.amountOwed : 0;
      newlyCreatedBillId = bill.id; 

      const newState = { bills: [...state.bills, bill] };
      saveToJSON({ ...state, ...newState });
      return newState;
    });

    return { id: newlyCreatedBillId }; 
  },
  
  updateBill: (billId: string, updates: Partial<Bill>) => {
    set((state) => {
      const bills = state.bills.map((b) => {
        if (b.id !== billId) return b;
        const updated = { ...b, ...updates, updatedAt: new Date().toISOString() };
        const member = state.members.find((m) => m.id === updated.memberId);
        const { totalSales, amountOwed } = calculateBillTotals(updated, state.products, member);
        return { ...updated, totalSales, amountOwed };
      });
      const newState = { bills };
      saveToJSON({ ...state, ...newState });
      return newState;
    });
  },
  
  updateBillItem: (billId: string, productId: string, updates: Partial<Bill['items'][0]>) => {
    set((state) => {
      const bills = state.bills.map((b) => {
        if (b.id !== billId) return b;
        
        const items = b.items.map((item) => {
          if (item.productId !== productId) return item;
          
          const updated = { ...item, ...updates };
          updated.totalStock = updated.oldStock + updated.newStock;
          updated.sold = updated.totalStock - updated.returned;
          
          return updated;
        });
        
        const updated = { ...b, items, updatedAt: new Date().toISOString() };
        const member = state.members.find((m) => m.id === updated.memberId);
        const { totalSales, amountOwed } = calculateBillTotals(updated, state.products, member);
        return { ...updated, totalSales, amountOwed };
      });
      const newState = { bills };
      saveToJSON({ ...state, ...newState });
      return newState;
    });
  },
  
  deleteBill: (billId: string) => {
    set((state) => {
      const newState = { bills: state.bills.filter((b) => b.id !== billId) };
      saveToJSON({ ...state, ...newState });
      return newState;
    });
  },
  
  confirmCheckout: (billId: string) => {
    set((state) => {
      const newState = {
        bills: state.bills.map((b) =>
          b.id === billId ? { ...b, status: 'checkout' as const, updatedAt: new Date().toISOString() } : b
        ),
      };
      saveToJSON({ ...state, ...newState });
      return newState;
    });
  },
  
  confirmDayClose: (billId: string) => {
    set((state) => {
      const newState = {
        bills: state.bills.map((b) =>
          b.id === billId ? { ...b, status: 'completed' as const, dayClosed: true, updatedAt: new Date().toISOString() } : b
        ),
      };
      saveToJSON({ ...state, ...newState });
      return newState;
    });
  },
  
  // ===== BILL HELPERS =====
  getTodayBills: () => {
    const today = getToday();
    return get().bills.filter((b) => b.date === today);
  },
  
  getMemberBillsToday: (memberId: string) => {
    const today = getToday();
    return get().bills.filter((b) => b.memberId === memberId && b.date === today);
  },
  
  getLastBillForMember: (memberId: string) => {
    return get().bills
      .filter((b) => b.memberId === memberId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  },
  
  // ===== DAILY SUMMARY =====
  closeDaySummary: () => {
    const state = get();
    const today = getToday();
    const todayBills = state.bills.filter((b) => b.date === today);
    
    if (todayBills.length === 0) return;
    
    const summary: DailySummary = {
      date: today,
      totalBills: todayBills.length,
      totalSales: todayBills.reduce((sum, b) => sum + b.totalSales, 0),
      totalOwed: todayBills.reduce((sum, b) => sum + b.amountOwed, 0),
      memberSummaries: todayBills.map((b) => ({
        memberId: b.memberId,
        memberName: b.memberName,
        totalSales: b.totalSales,
        totalOwed: b.amountOwed,
      })),
      closed: true,
      createdAt: new Date().toISOString(),
    };
    
    set((state) => {
      const newState = {
        dailySummaries: [...state.dailySummaries.filter((s) => s.date !== today), summary],
        bills: state.bills.map((b) =>
          b.date === today ? { ...b, dayClosed: true } : b
        ),
      };
      saveToJSON({ ...state, ...newState });
      return newState;
    });
  },
  
  // ===== EXPORT =====
  exportToCSV: (month?: string) => {
    const state = get();
    const targetMonth = month || getCurrentMonth();
    const bills = state.bills.filter((b) => b.date.startsWith(targetMonth));
    
    if (bills.length === 0) return '';
    
    const headers = [
      'วันที่', 'ชื่อสมาชิก', 'ประเภทสินค้า', 'ชื่อสินค้า', 'ยอดเก่า', 
      'ยอดใหม่ (เบิก)', 'ยอดรวม', 'ยอดเหลือคืน', 'ยอดขาย', 'ราคา/ชิ้น', 
      'มูลค่าขาย (บาท)', 'ค่าน้ำแข็ง (บาท)', 'ยอดขายรวม (บาท)', 'จ่ายแล้ว (บาท)', 
      'ค้างชำระ (บาท)', 'หมายเหตุ', 'สถานะ'
    ];
    
    const rows: string[][] = [];
    const sortedBills = [...bills].sort((a, b) => a.date.localeCompare(b.date));
    
    sortedBills.forEach((bill) => {
      let isFirstItem = true;
      const productTypes = Array.from(new Set(state.products.map(p => p.type)));
      
      productTypes.forEach((type) => {
        const typeProducts = state.products.filter(p => p.type === type);
        const typeItems = bill.items.filter(item => 
          typeProducts.some(p => p.id === item.productId) && 
          (item.totalStock > 0 || item.newStock > 0 || item.sold > 0)
        );
        
        if (typeItems.length === 0) return;
        
        const typeTotalStock = typeItems.reduce((sum, i) => sum + i.totalStock, 0);
        const typeReturned = bill.returnInputs?.[type] || 0;
        const typeSold = Math.max(0, typeTotalStock - typeReturned);
        const basePrice = typeItems[0]?.priceUsed || 0;
        const typeSubtotal = typeSold * basePrice;
        const typeName = PRODUCT_TYPE_LABELS[type as keyof typeof PRODUCT_TYPE_LABELS] || type;
        
        rows.push([
          isFirstItem ? formatDateThai(bill.date) : '',
          isFirstItem ? bill.memberName : '',
          typeName,
          `รวม ${typeName}`,
          typeItems.reduce((sum, i) => sum + i.oldStock, 0).toString(),
          typeItems.reduce((sum, i) => sum + i.newStock, 0).toString(),
          typeTotalStock.toString(),
          typeReturned.toString(),
          typeSold.toString(),
          basePrice.toString(),
          typeSubtotal.toLocaleString(),
          isFirstItem ? (bill.icePrice || 0).toLocaleString() : '',
          isFirstItem ? Math.round(bill.totalSales).toLocaleString() : '',
          isFirstItem ? Math.round(bill.amountPaid).toLocaleString() : '',
          isFirstItem ? Math.round(bill.amountOwed).toLocaleString() : '',
          isFirstItem ? (bill.notes || '-') : '',
          isFirstItem ? getStatusLabel(bill.status) : '',
        ]);
        
        isFirstItem = false;
      });
      rows.push(Array(headers.length).fill(''));
    });
    
    const csv = [headers.join(','), ...rows.map((r) => r.map((cell) => `"${cell}"`).join(','))].join('\n');
    
    set((state) => {
      const newState = { settings: { ...state.settings, lastExportDate: new Date().toISOString() } };
      saveToJSON({ ...state, ...newState });
      return newState;
    });
    
    return csv;
  },
  
  // ===== AUTO CLEANUP =====
  runAutoCleanup: () => {
    const state = get();
    const retentionMonths = state.settings.retentionMonths;
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - retentionMonths);
    const cutoffMonth = cutoffDate.toISOString().slice(0, 7);
    const billsToDelete = state.bills.filter((b) => b.date.slice(0, 7) < cutoffMonth);
    
    if (billsToDelete.length === 0) return;
    
    const monthGroups: Record<string, Bill[]> = {};
    billsToDelete.forEach((b) => {
      const month = b.date.slice(0, 7);
      if (!monthGroups[month]) monthGroups[month] = [];
      monthGroups[month].push(b);
    });
    
    const newLogs: HistoryLog[] = Object.entries(monthGroups).map(([month, bills]) => ({
      id: generateId(),
      month,
      totalBills: bills.length,
      totalSales: bills.reduce((sum, b) => sum + b.totalSales, 0),
      totalOwed: bills.reduce((sum, b) => sum + b.amountOwed, 0),
      deletedAt: new Date().toISOString(),
    }));
    
    set((state) => {
      const newState = {
        bills: state.bills.filter((b) => b.date.slice(0, 7) >= cutoffMonth),
        dailySummaries: state.dailySummaries.filter((s) => s.date.slice(0, 7) >= cutoffMonth),
        historyLogs: [...state.historyLogs, ...newLogs],
        lastCleanup: getToday(),
      };
      saveToJSON({ ...state, ...newState });
      return newState;
    });
  },
  
  // ===== SETTINGS =====
  updateSettings: (updates: Partial<AppSettings>) => {
    set((state) => {
      const newState = { settings: { ...state.settings, ...updates } };
      saveToJSON({ ...state, ...newState });
      return newState;
    });
  },
  
  // ===== RESET =====
  resetAll: () => {
    set(initialState);
    saveToJSON(initialState);
  },


  // เพิ่มหมวดหมู่รายจ่ายใหม่
  addExpenseCategory: (name: string, icon = '📝') => {
    set((state) => {
      const newCategory: ExpenseCategory = {
        id: `cat-${Date.now()}`,
        name,
        icon,
        createdAt: new Date().toISOString(),
      };
      const newState = {
        expenseCategories: [...state.expenseCategories, newCategory],
        historyLogs: [
          ...state.historyLogs,
          {
            id: `log-${Date.now()}`,
            timestamp: new Date().toISOString(),
            action: 'เพิ่มหมวดหมู่รายจ่าย',
            details: `เพิ่มหมวดหมู่ "${name}"`,
          },
        ],
      };
      saveToJSON({ ...state, ...newState });
      return newState;
    });
  },

  // ลบหมวดหมู่รายจ่าย
  deleteExpenseCategory: (id: string) => {
    set((state) => {
      const targetCategory = state.expenseCategories.find((c) => c.id === id);
      const newState = {
        expenseCategories: state.expenseCategories.filter((c) => c.id !== id),
        // ล้างรายการรายจ่ายที่ผูกกับหมวดหมู่นี้ทิ้งไปด้วยเพื่อป้องกันบั๊กข้อมูลกำพร้า
        expenses: state.expenses.filter((e) => e.categoryId !== id),
        historyLogs: [
          ...state.historyLogs,
          {
            id: `log-${Date.now()}`,
            timestamp: new Date().toISOString(),
            action: 'ลบหมวดหมู่รายจ่าย',
            details: `ลบหมวดหมู่ "${targetCategory?.name || id}" และข้อมูลรายจ่ายที่เกี่ยวข้อง`,
          },
        ],
      };
      saveToJSON({ ...state, ...newState });
      return newState;
    });
  },

  // บันทึกรายจ่ายประจำวัน
  addExpense: (expenseData) => {
    set((state) => {
      const newExpense: ExpenseItem = {
        ...expenseData,
        id: `exp-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      const category = state.expenseCategories.find((c) => c.id === expenseData.categoryId);
      const newState = {
        expenses: [...state.expenses, newExpense],
        historyLogs: [
          ...state.historyLogs,
          {
            id: `log-${Date.now()}`,
            timestamp: new Date().toISOString(),
            action: 'บันทึกรายจ่าย',
            details: `ลงยอด ${expenseData.amount} บาท ในหมวดหมู่ ${category?.name || 'ทั่วไป'}`,
          },
        ],
      };
      saveToJSON({ ...state, ...newState });
      return newState;
    });
  },

  // ลบรายการรายจ่าย
  deleteExpense: (id: string) => {
    set((state) => {
      const targetExpense = state.expenses.find((e) => e.id === id);
      const newState = {
        expenses: state.expenses.filter((e) => e.id !== id),
        historyLogs: [
          ...state.historyLogs,
          {
            id: `log-${Date.now()}`,
            timestamp: new Date().toISOString(),
            action: 'ลบรายการรายจ่าย',
            details: `ลบยอดจำนวน ${targetExpense?.amount || 0} บาท ออกจากระบบ`,
          },
        ],
      };
      saveToJSON({ ...state, ...newState });
      return newState;
    });
  },
}));

function formatDateThai(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    weekday: 'short',
  });
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'draft': return 'กำลังเบิก';
    case 'checkout': return 'เบิกแล้ว';
    case 'completed': return 'ปิดวันแล้ว';
    default: return status;
  }
}

export const selectMembers = (state: Store) => state.members;
export const selectProducts = (state: Store) => state.products;
export const selectBills = (state: Store) => state.bills;
export const selectSettings = (state: Store) => state.settings;
export const selectHistoryLogs = (state: Store) => state.historyLogs;