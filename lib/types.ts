// ===== MEMBER TYPES =====
export type MemberStatusIn = {
  house: boolean; // บ้าน
  car: boolean;   // รถ
};

export type MemberStatusOut = 'active' | 'inactive';
export type MemberStatusWorkIn = 'working' | 'off' | 'leave';

// ประเภทสมาชิก: In = ส่งเข้า(บ้าน/รถ), Out = ส่งออก, WalkIn = ลูกค้าเดิน
export type MemberClass = 'In' | 'Out' | 'WalkIn';

export interface Member {
  id: string;
  name: string;
  class: MemberClass;  // ประเภทการขาย — กำหนดราคาที่ใช้คำนวณ
  statusIn: MemberStatusIn;
  statusOut: MemberStatusOut;
  statusWorkIn: MemberStatusWorkIn;
  createdAt: string;
  updatedAt: string;
}

// ===== PRODUCT TYPES =====
export type ProductType = 'XL' | 'S' | 'Coffee' | 'Sandwich' | 'Cup' | 'Cone' | 'D' | 'Car' | 'House';
export type ProductCategory = 'XL' | 'S' | 'Coffee' | 'Sandwich' | 'Cup' | 'Cone' | 'null';

export interface Product {
  id: string;
  name: string;
  type: ProductType;
  category: ProductCategory; // for grouping display
  priceIn: number;    // price 1: status in (บ้าน/รถ)
  priceOut: number;   // price 2: out
  priceWorkIn: number; // price 3: workin
  imageUrl?: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

// ===== BILL/TRANSACTION TYPES =====
export interface BillItem {
  productId: string;
  productName: string;
  oldStock: number;      // ยอดเก่า (เหลือเมื่อวาน)
  newStock: number;      // ยอดใหม่ที่เบิก
  totalStock: number;    // รวม = เก่า + ใหม่
  returned: number;      // ยอดคืน
  sold: number;          // ขายได้ = total - returned
  priceUsed: number;     // ราคาที่ใช้
}

export interface Bill {
  id: string;
  memberId: string;
  memberName: string;
  buyerName: string;    // ชื่อผู้ขาย (กรอกเอง)
  date: string;          // YYYY-MM-DD
  items: BillItem[];
  ice: string;
  icePrice: number;
  totalSales: number;
  amountPaid: number;
  amountOwed: number;
  previousOwed: number; // ยอดค้างชำระจากบิลก่อนหน้า (ถ้ามี)
  notes: string;
  status: 'draft' | 'checkout' | 'completed'; // draft=กำลังเบิก, checkout=เบิกแล้ว, completed=บันทึกยอดแล้ว
  dayClosed: boolean;    // ปิดวันแล้วหรือยัง
  createdAt: string;
  updatedAt: string;
  returnInputs?: Record<string, number>;
}

// ===== DAILY SUMMARY =====
export interface DailySummary {
  date: string;
  totalBills: number;
  totalSales: number;
  totalOwed: number;
  memberSummaries: {
    memberId: string;
    memberName: string;
    totalSales: number;
    totalOwed: number;
  }[];
  closed: boolean;
  createdAt: string;
}

// ===== HISTORY LOG (for deleted months) =====
export interface HistoryLog {
  id: string;
  month: string;        // YYYY-MM
  totalBills: number;
  totalSales: number;
  totalOwed: number;
  deletedAt: string;
}

// ===== APP STATE =====
export interface AppState {
  members: Member[];
  products: Product[];
  bills: Bill[];
  dailySummaries: DailySummary[];
  historyLogs: HistoryLog[];
  settings: AppSettings;
  lastCleanup: string;  // last auto cleanup date
}

export interface AppSettings {
  retentionMonths: number; // default 3
  reminderExport: boolean;
  lastExportDate: string;
}

// ===== DEFAULT DATA =====
export const DEFAULT_PRODUCTS: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>[] = [
  // XL Products (แท่งใหญ่)
  { name: 'แผ่น', type: 'XL', category: 'XL', priceIn: 6, priceOut: 6, priceWorkIn: 6, sortOrder: 1 , imageUrl: 'https://example.com/images/แผ่น.jpg' },
  { name: 'ถั่วดำ', type: 'XL', category: 'XL', priceIn: 6, priceOut: 6, priceWorkIn: 6, sortOrder: 2 , imageUrl: 'https://example.com/images/ถั่วดำ.jpg' },
  { name: 'ถั่วแดง', type: 'XL', category: 'XL', priceIn: 6, priceOut: 6, priceWorkIn: 6, sortOrder: 3 , imageUrl: 'https://example.com/images/ถั่วแดง.jpg' },
  { name: 'ข้าวเหนียวดำ', type: 'XL', category: 'XL', priceIn: 6, priceOut: 6, priceWorkIn: 6, sortOrder: 4 , imageUrl: 'https://example.com/images/ข้าวเหนียวดำ.jpg' },
  { name: 'ลอดช่อง', type: 'XL', category: 'XL', priceIn: 6, priceOut: 6, priceWorkIn: 6, sortOrder: 5 , imageUrl: 'https://example.com/images/ลอดช่อง.jpg' },
  { name: 'ข้าวโพด', type: 'XL', category: 'XL', priceIn: 6, priceOut: 6, priceWorkIn: 6, sortOrder: 6 , imageUrl: 'https://example.com/images/ข้าวโพด.jpg' },
  { name: 'เผือก', type: 'XL', category: 'XL', priceIn: 6, priceOut: 6, priceWorkIn: 6, sortOrder: 7, imageUrl: 'https://example.com/images/เผือก.jpg' },
  { name: 'ชาเย็น', type: 'XL', category: 'XL', priceIn: 6, priceOut: 6, priceWorkIn: 6, sortOrder: 8, imageUrl: 'https://example.com/images/ชาเย็น.jpg' },
  { name: 'โอเลี้ยง', type: 'XL', category: 'XL', priceIn: 6, priceOut: 6, priceWorkIn: 6, sortOrder: 9 , imageUrl: 'https://example.com/images/โอเลี้ยง.jpg' },
  { name: 'ป๊อป', type: 'XL', category: 'XL', priceIn: 6, priceOut: 6, priceWorkIn: 6, sortOrder: 10 , imageUrl: 'https://example.com/images/ป๊อป.jpg' },
  { name: 'คาลิโป้', type: 'XL', category: 'XL', priceIn: 6, priceOut: 6, priceWorkIn: 6, sortOrder: 11 , imageUrl: 'https://example.com/images/คาลิโป้.jpg' },
  { name: 'ทุเรียน', type: 'XL', category: 'XL', priceIn: 6, priceOut: 6, priceWorkIn: 6, sortOrder: 12 , imageUrl: 'https://example.com/images/ทุเรียน.jpg' },
  { name: 'กะทิ', type: 'XL', category: 'XL', priceIn: 6, priceOut: 6, priceWorkIn: 6, sortOrder: 13 , imageUrl: 'https://example.com/images/กะทิ.jpg' },
  { name: 'ช็อคโกแลต', type: 'XL', category: 'XL', priceIn: 6, priceOut: 6, priceWorkIn: 6, sortOrder: 14 , imageUrl: 'https://example.com/images/ช็อคโกแลต.jpg' },
  { name: 'สตอเบอรี่', type: 'XL', category: 'XL', priceIn: 6, priceOut: 6, priceWorkIn: 6, sortOrder: 15 , imageUrl: 'https://example.com/images/สตอเบอรี่.jpg' },
  // S Products (แท่งเล็ก)
  { name: 'ส้ม', type: 'S', category: 'S', priceIn: 5, priceOut: 5, priceWorkIn: 5, sortOrder: 16 , imageUrl: 'https://example.com/images/ส้ม.jpg' },
  { name: 'แดง', type: 'S', category: 'S', priceIn: 5, priceOut: 5, priceWorkIn: 5, sortOrder: 17, imageUrl: 'https://example.com/images/แดง.jpg' },
  { name: 'โคล่า', type: 'S', category: 'S', priceIn: 5, priceOut: 5, priceWorkIn: 5, sortOrder: 18, imageUrl: 'https://example.com/images/โคล่า.jpg' },
  { name: 'จรวด', type: 'S', category: 'S', priceIn: 5, priceOut: 5, priceWorkIn: 5, sortOrder: 19, imageUrl: 'https://example.com/images/จรวด.jpg' },
  { name: 'สามสี', type: 'S', category: 'S', priceIn: 5, priceOut: 5, priceWorkIn: 5, sortOrder: 20, imageUrl: 'https://example.com/images/สามสี.jpg' },
  { name: 'ตุ๊กตา', type: 'S', category: 'S', priceIn: 5, priceOut: 5, priceWorkIn: 5, sortOrder: 21, imageUrl: 'https://example.com/images/ตุ๊กตา.jpg' },
  // Other Products (อื่นๆ)
  { name: 'กาแฟ', type: 'Coffee', category: 'Coffee', priceIn: 7.5, priceOut: 8, priceWorkIn: 7.5, sortOrder: 22 , imageUrl: 'https://example.com/images/กาแฟ.jpg' },
  { name: 'แซนวิช', type: 'Sandwich', category: 'Sandwich', priceIn: 7.5, priceOut: 8, priceWorkIn: 7.5, sortOrder: 23 , imageUrl: 'https://example.com/images/แซนวิช.jpg' },
  { name: 'ถ้วย', type: 'Cup', category: 'Cup', priceIn: 6, priceOut: 7, priceWorkIn: 6, sortOrder: 24 , imageUrl: 'https://example.com/images/ถ้วย.jpg' },
  { name: 'โคน', type: 'Cone', category: 'Cone', priceIn: 10, priceOut: 10, priceWorkIn: 10, sortOrder: 25 , imageUrl: 'https://example.com/images/โคน.jpg' },
  { name: 'น้ำแข็งแห้ง', type: 'D', category: 'null', priceIn: 25, priceOut: 25, priceWorkIn: 25, sortOrder: 26 , imageUrl: 'https://example.com/images/น้ำแข็งแห้ง.jpg' },
  // New: รถ and บ้าน
  { name: 'รถ', type: 'Car', category: 'null', priceIn: 5, priceOut: 5, priceWorkIn: 5, sortOrder: 27 , imageUrl: 'https://example.com/images/รถ.jpg' },
  { name: 'บ้าน', type: 'House', category: 'null', priceIn: 20, priceOut: 20, priceWorkIn: 20, sortOrder: 28 , imageUrl: 'https://example.com/images/บ้าน.jpg' },
];

// Helper functions
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

export function getCurrentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

export function createDefaultMember(name: string = ''): Member {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    name,
    class: 'In',          // default = In
    statusIn: { house: false, car: false },
    statusOut: 'active',
    statusWorkIn: 'working',
    createdAt: now,
    updatedAt: now,
  };
}

export function createDefaultProduct(data: Partial<Product>): Product {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    name: data.name || '',
    type: data.type || 'XL',
    category: data.category || 'XL',
    priceIn: data.priceIn || 0,
    priceOut: data.priceOut || 0,
    priceWorkIn: data.priceWorkIn || 0,
    imageUrl: data.imageUrl,
    sortOrder: data.sortOrder || 0,
    createdAt: now,
    updatedAt: now,
  };
}

export function createNewBill(memberId: string, memberName: string, products: Product[], previousBill?: Bill, date?: string): Bill {
  const now = new Date().toISOString();
  const billDate = date || getToday();
  
  // Track which types have had their oldStock assigned (type-level from returnInputs)
  const typeOldStockAssigned = new Set<string>();
  
  const items: BillItem[] = products.map(product => {
    let oldStock = 0;
    
    if (previousBill?.returnInputs) {
      // Use returnInputs[type] from previous bill as old stock for first product of each type
      const typeRemaining = previousBill.returnInputs[product.type] ?? 0;
      if (typeRemaining > 0 && !typeOldStockAssigned.has(product.type)) {
        oldStock = typeRemaining;
        typeOldStockAssigned.add(product.type);
      }
    }
    
    return {
      productId: product.id,
      productName: product.name,
      oldStock,
      newStock: 0,
      totalStock: oldStock,
      returned: 0,
      sold: 0,
      priceUsed: product.priceIn,
    };
  });
  
  return {
    id: generateId(),
    memberId,
    memberName,
    buyerName: '',
    date: billDate,
    items,
    ice: '',
    icePrice: 0,
    totalSales: 0,
    amountPaid: 0,
    amountOwed: 0,
    previousOwed: previousBill?.amountOwed || 0,
    notes: '',
    status: 'draft',
    dayClosed: false,
    returnInputs: {},
    createdAt: now,
    updatedAt: now,
  };
}

// Get price based on member class
export function getProductPrice(product: Product, member: Member): number {
  if (member.class === 'Out') return product.priceOut;
  if (member.class === 'WalkIn') return product.priceWorkIn;
  return product.priceIn; // 'In' (default)
}

export function calculateBillTotals(
  bill: Bill,
  allProducts: Product[],
  member?: Member
): { totalSales: number; amountOwed: number } {
  const memberClass = member?.class ?? 'In';

  // 1. ประเภทสินค้าหลัก (ไม่รวม Car, House, D)
  const distinctTypes = Array.from(
    new Set(
      allProducts
        .filter((p) => p.type !== 'Car' && p.type !== 'House' && p.type !== 'D')
        .map((p) => p.type)
    )
  );

  // 2. คำนวณยอดขายแยกตาม type (เอา Math.max ออก เพื่อให้ยอดขายกลุ่มนี้ติดลบได้ถ้าคืนของมากกว่าเบิก)
  const itemsTotal = distinctTypes.reduce((grandTotal, type) => {
    const typeProducts = allProducts.filter((p) => p.type === type);
    const typeItems = bill.items.filter((item) =>
      typeProducts.some((p) => p.id === item.productId)
    );

    const totalStockGroup = typeItems.reduce((sum, i) => sum + i.totalStock, 0);
    const returnedInputGroup = bill.returnInputs?.[type] || 0;
    const actualSoldGroup = totalStockGroup - returnedInputGroup; // ติดลบได้หากคืนมากกว่าเบิก

    const baseProduct = typeProducts[0];
    let price = 0;
    if (memberClass === 'Out') price = baseProduct?.priceOut || 0;
    else if (memberClass === 'WalkIn') price = baseProduct?.priceWorkIn || 0;
    else price = baseProduct?.priceIn || 0;

    // 🔴 แก้ไขจุดที่ 1: เปลี่ยนจาก Math.max(0, ...) เป็นการบวกค่าตามจริง (ยอมให้ติดลบได้)
    return grandTotal + (actualSoldGroup * price);
  }, 0);

  // 3. บวก house/car plan
  let planTotal = 0;
  if (memberClass === 'In' && member) {
    if (member.statusIn.house) {
      const houseProd = allProducts.find((p) => p.type === 'House');
      planTotal += houseProd?.priceIn || 0;
    }
    if (member.statusIn.car) {
      const carProd = allProducts.find((p) => p.type === 'Car');
      planTotal += carProd?.priceIn || 0;
    }
  }

  // 4. คำนวณค่าน้ำแข็งแห้ง (Type D)
  const dProduct = allProducts.find((p) => p.type === 'D');
  const dItem = bill.items?.find((item) => item.productId === dProduct?.id);
  const dQuantity = dItem?.totalStock || 0;
  const iceDryPrice = dProduct ? dQuantity * dProduct.priceIn : 0;

  // ยอดขายวันนี้รวมทุกอย่าง = ไอศกรีม + แพ็กเกจ + น้ำแข็งถัง + น้ำแข็งแห้ง
  // (จุดนี้ totalSales สามารถติดลบได้ถูกต้องตามจริงแล้ว เช่น วันนี้ได้ของคืนรวมมูลค่า -50 บาท)
  const totalSales = itemsTotal + planTotal + iceDryPrice;
  
  // 🔴 แก้ไขจุดที่ 2: ป้องกันไม่ให้ "ยอดค้างชำระของบิลวันนี้" ติดลบ
  let amountOwed = totalSales - (bill.amountPaid || 0) + bill.previousOwed;
  if (amountOwed < 0) {
    amountOwed = 0; // ถ้าคำนวณแล้วติดลบ ให้บิลวันนี้มียอดค้างเป็น 0 เสมอ (เคลียร์สะอาด)
  }

  return { totalSales, amountOwed };
}

// Group products by category
export function groupProductsByCategory(products: Product[]): Record<ProductCategory, Product[]> {
  return products.reduce((acc, product) => {
    const cat = product.category || 'Other';
    if (!acc[cat]) {
      acc[cat] = [];
    }
    acc[cat].push(product);
    return acc;
  }, {} as Record<ProductCategory, Product[]>);
}

// Group products by type (legacy)
export function groupProductsByType(products: Product[]): Record<ProductType, Product[]> {
  return products.reduce((acc, product) => {
    if (!acc[product.type]) {
      acc[product.type] = [];
    }
    acc[product.type].push(product);
    return acc;
  }, {} as Record<ProductType, Product[]>);
}

export const PRODUCT_CATEGORY_LABELS: Record<ProductCategory, string> = {
  XL: 'แท่งใหญ่',
  S: 'แท่งเล็ก',
  Sandwich: 'แซนวิช',
  Cup: 'ถ้วย',
  Cone: 'โคน',
  Coffee: 'กาแฟ',
  null: 'อื่นๆ',
};

export const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  XL: 'แท่งใหญ่',
  S: 'แท่งเล็ก',
  Coffee: 'กาแฟ',
  Sandwich: 'แซนวิช',
  Cup: 'ถ้วย',
  Cone: 'โคน',
  D: 'น้ำแข็งแห้ง',
  Car: 'รถ',
  House: 'บ้าน',
};