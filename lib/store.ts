'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  AppState,
  Member,
  MemberClass,
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
};

// ===== STORE INTERFACE =====
interface StoreActions {
  // Members
  addMember: (name: string) => Member;
  updateMember: (id: string, updates: Partial<Member>) => void;
  deleteMember: (id: string) => void;
  
  // Products
  addProduct: (data: Partial<Product>) => Product;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  reorderProducts: (products: Product[]) => void;
  
  // Bills
  createBill: (memberId: string, date?: string) => Bill;
  updateBill: (billId: string, updates: Partial<Bill>) => void;
  updateBillItem: (billId: string, productId: string, updates: Partial<Bill['items'][0]>) => void;
  deleteBill: (billId: string) => void;
  confirmCheckout: (billId: string) => void;
  confirmDayClose: (billId: string) => void;
  
  // Bills - Get helpers
  getTodayBills: () => Bill[];
  getMemberBillsToday: (memberId: string) => Bill[];
  getLastBillForMember: (memberId: string) => Bill | undefined;
  
  // Daily Summary
  closeDaySummary: () => void;
  
  // Export & Cleanup
  exportToCSV: (month?: string) => string;
  runAutoCleanup: () => void;
  
  // Settings
  updateSettings: (updates: Partial<AppSettings>) => void;
  
  // Reset
  resetAll: () => void;
}

type Store = AppState & StoreActions;

// ===== ZUSTAND STORE =====
export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      // ===== MEMBERS =====
      addMember: (name: string) => {
        const member = createDefaultMember(name);
        set((state) => ({
          members: [...state.members, member],
        }));
        return member;
      },
      
      updateMember: (id: string, updates: Partial<Member>) => {
        set((state) => ({
          members: state.members.map((m) =>
            m.id === id ? { ...m, ...updates, updatedAt: new Date().toISOString() } : m
          ),
        }));
      },
      
      deleteMember: (id: string) => {
        set((state) => ({
          members: state.members.filter((m) => m.id !== id),
        }));
      },
      
      // ===== PRODUCTS =====
      addProduct: (data: Partial<Product>) => {
        const product = createDefaultProduct({
          ...data,
          sortOrder: get().products.length + 1,
        });
        set((state) => ({
          products: [...state.products, product],
        }));
        return product;
      },
      
      updateProduct: (id: string, updates: Partial<Product>) => {
        set((state) => ({
          products: state.products.map((p) =>
            p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
          ),
        }));
      },
      
      deleteProduct: (id: string) => {
        set((state) => ({
          products: state.products.filter((p) => p.id !== id),
        }));
      },
      
      reorderProducts: (products: Product[]) => {
        set({ products });
      },
      
      // ===== BILLS =====
      createBill: (memberId: string, date?: string) => {
        const state = get();
        const member = state.members.find((m) => m.id === memberId);
        if (!member) throw new Error('Member not found');
        
        const billDate = date || getToday();
        
        // Get last completed bill for this member BEFORE the selected date
        const prevBill = state.bills
          .filter((b) => b.memberId === memberId && b.status === 'completed' && b.date < billDate)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
        
        const bill = createNewBill(memberId, member.name, state.products, prevBill, billDate);
        
        set((state) => ({
          bills: [...state.bills, bill],
        }));
        
        return bill;
      },
      
      updateBill: (billId: string, updates: Partial<Bill>) => {
        set((state) => {
          const bills = state.bills.map((b) => {
            if (b.id !== billId) return b;
            const updated = { ...b, ...updates, updatedAt: new Date().toISOString() };
            // Recalculate totals — pass member so price uses correct class
            const member = state.members.find((m) => m.id === updated.memberId);
            const { totalSales, amountOwed } = calculateBillTotals(updated, state.products, member);
            return { ...updated, totalSales, amountOwed };
          });
          return { bills };
        });
      },
      
      
      updateBillItem: (billId: string, productId: string, updates: Partial<Bill['items'][0]>) => {
        set((state) => {
          const bills = state.bills.map((b) => {
            if (b.id !== billId) return b;
            
            const items = b.items.map((item) => {
              if (item.productId !== productId) return item;
              
              const updated = { ...item, ...updates };
              // Recalculate totalStock and sold
              updated.totalStock = updated.oldStock + updated.newStock;
              updated.sold = updated.totalStock - updated.returned;
              
              return updated;
            });
            
            const updated = { ...b, items, updatedAt: new Date().toISOString() };
            const member = state.members.find((m) => m.id === updated.memberId);
            const { totalSales, amountOwed } = calculateBillTotals(updated, state.products, member);
            return { ...updated, totalSales, amountOwed };
          });
          return { bills };
        });
      },
      
      deleteBill: (billId: string) => {
        set((state) => ({
          bills: state.bills.filter((b) => b.id !== billId),
        }));
      },
      
      confirmCheckout: (billId: string) => {
        set((state) => ({
          bills: state.bills.map((b) =>
            b.id === billId ? { ...b, status: 'checkout' as const, updatedAt: new Date().toISOString() } : b
          ),
        }));
      },
      
      confirmDayClose: (billId: string) => {
        set((state) => ({
          bills: state.bills.map((b) =>
            b.id === billId ? { ...b, status: 'completed' as const, dayClosed: true, updatedAt: new Date().toISOString() } : b
          ),
        }));
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
        
        set((state) => ({
          dailySummaries: [...state.dailySummaries.filter((s) => s.date !== today), summary],
          bills: state.bills.map((b) =>
            b.date === today ? { ...b, dayClosed: true } : b
          ),
        }));
      },
      
      // ===== EXPORT =====
      exportToCSV: (month?: string) => {
        const state = get();
        const targetMonth = month || getCurrentMonth();
        const bills = state.bills.filter((b) => b.date.startsWith(targetMonth));
        
        if (bills.length === 0) return '';
        
        // CSV Header
        const headers = ['Date', 'Member', 'Product', 'Old', 'New', 'Total', 'Returned', 'Sold', 'Price', 'Subtotal', 'Ice', 'Ice Price', 'Total Sales', 'Paid', 'Owed', 'Notes'];
        
        const rows: string[][] = [];
        
        bills.forEach((bill) => {
          bill.items.forEach((item, index) => {
            if (item.totalStock === 0 && item.sold === 0) return; // Skip empty items
            
            rows.push([
              index === 0 ? bill.date : '',
              index === 0 ? bill.memberName : '',
              item.productName,
              item.oldStock.toString(),
              item.newStock.toString(),
              item.totalStock.toString(),
              item.returned.toString(),
              item.sold.toString(),
              item.priceUsed.toString(),
              (item.sold * item.priceUsed).toString(),
              index === 0 ? bill.ice : '',
              index === 0 ? bill.icePrice.toString() : '',
              index === 0 ? bill.totalSales.toString() : '',
              index === 0 ? bill.amountPaid.toString() : '',
              index === 0 ? bill.amountOwed.toString() : '',
              index === 0 ? bill.notes : '',
            ]);
          });
        });
        
        const csv = [headers.join(','), ...rows.map((r) => r.map((cell) => `"${cell}"`).join(','))].join('\n');
        
        // Update last export date
        set((state) => ({
          settings: { ...state.settings, lastExportDate: new Date().toISOString() },
        }));
        
        return csv;
      },
      
      // ===== AUTO CLEANUP =====
      runAutoCleanup: () => {
        const state = get();
        const retentionMonths = state.settings.retentionMonths;
        
        // Calculate cutoff date (keep last N months)
        const cutoffDate = new Date();
        cutoffDate.setMonth(cutoffDate.getMonth() - retentionMonths);
        const cutoffMonth = cutoffDate.toISOString().slice(0, 7);
        
        // Find bills to delete
        const billsToDelete = state.bills.filter((b) => b.date.slice(0, 7) < cutoffMonth);
        
        if (billsToDelete.length === 0) return;
        
        // Group by month for history log
        const monthGroups: Record<string, Bill[]> = {};
        billsToDelete.forEach((b) => {
          const month = b.date.slice(0, 7);
          if (!monthGroups[month]) monthGroups[month] = [];
          monthGroups[month].push(b);
        });
        
        // Create history logs
        const newLogs: HistoryLog[] = Object.entries(monthGroups).map(([month, bills]) => ({
          id: generateId(),
          month,
          totalBills: bills.length,
          totalSales: bills.reduce((sum, b) => sum + b.totalSales, 0),
          totalOwed: bills.reduce((sum, b) => sum + b.amountOwed, 0),
          deletedAt: new Date().toISOString(),
        }));
        
        set((state) => ({
          bills: state.bills.filter((b) => b.date.slice(0, 7) >= cutoffMonth),
          dailySummaries: state.dailySummaries.filter((s) => s.date.slice(0, 7) >= cutoffMonth),
          historyLogs: [...state.historyLogs, ...newLogs],
          lastCleanup: getToday(),
        }));
      },
      
      // ===== SETTINGS =====
      updateSettings: (updates: Partial<AppSettings>) => {
        set((state) => ({
          settings: { ...state.settings, ...updates },
        }));
      },
      
      // ===== RESET =====
      resetAll: () => {
        set(initialState);
      },
    }),
    {
      name: 'dream-icecream-storage',
      version: 1,
    }
  )
);

// ===== SELECTORS =====
export const selectMembers = (state: Store) => state.members;
export const selectProducts = (state: Store) => state.products;
export const selectBills = (state: Store) => state.bills;
export const selectSettings = (state: Store) => state.settings;
export const selectHistoryLogs = (state: Store) => state.historyLogs;