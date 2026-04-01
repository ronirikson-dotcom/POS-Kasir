export type Entity = string;

export interface BundleItem {
  productId: string;
  qty: number;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  cost?: number;
  stock?: number;
  entity: Entity;
  image?: string;
  type?: "SINGLE" | "BUNDLE";
  bundleItems?: BundleItem[];
}

export interface CartItem extends Product {
  cartItemId: string;
  qty: number;
}

export interface HeldOrder {
  id: string;
  timestamp: string;
  items: CartItem[];
  customerId?: string;
  customerName?: string;
  table?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  points: number;
  isMember: boolean;
  registrationDate?: string;
  lastTransactionDate?: string;
}

export interface SystemSettings {
  earnRate: number; // e.g., 1 point per 1000 IDR spent
  redeemValue: number; // e.g., 1 point = 1 IDR
  businessType: "RETAIL" | "FNB";
  tables: string[];
}

export interface Transaction {
  id: string;
  date: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  tax: number;
  pointRedeem: number;
  grandTotal: number;
  paymentMethod: "CASH" | "CARD" | "QRIS" | null;
  status: "PENDING" | "PAID" | "FAILED";
  customerId?: string;
  customerName?: string;
  earnedPoints?: number;
}

export const MOCK_CUSTOMERS: Customer[] = [
  { id: "c1", name: "Budi Santoso", phone: "081234567890", points: 15000, isMember: true, registrationDate: "2023-05-12", lastTransactionDate: "2024-03-20" },
  { id: "c2", name: "Siti Aminah", phone: "089876543210", points: 5000, isMember: true, registrationDate: "2023-11-05", lastTransactionDate: "2024-02-15" },
  { id: "c3", name: "Andi Wijaya", phone: "085678901234", points: 25000, isMember: true, registrationDate: "2022-08-21", lastTransactionDate: "2024-03-30" },
];

export const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
  earnRate: 1000, // 1 point per 1000 IDR
  redeemValue: 1, // 1 point = 1 IDR
  businessType: "RETAIL",
  tables: ["Table 1", "Table 2", "Table 3"],
};

export const MOCK_ENTITIES: string[] = ["A", "B", "C"];

export const MOCK_PRODUCTS: Product[] = [
  { id: "p1", name: "Espresso", price: 25000, cost: 10000, stock: 50, entity: "A", image: "https://picsum.photos/seed/espresso/200/200" },
  { id: "p2", name: "Americano", price: 30000, cost: 12000, stock: 45, entity: "A", image: "https://picsum.photos/seed/americano/200/200" },
  { id: "p3", name: "Latte", price: 35000, cost: 15000, stock: 30, entity: "A", image: "https://picsum.photos/seed/latte/200/200" },
  { id: "p4", name: "Cappuccino", price: 35000, cost: 15000, stock: 35, entity: "A", image: "https://picsum.photos/seed/cappuccino/200/200" },
  { id: "p5", name: "Croissant", price: 20000, cost: 8000, stock: 20, entity: "B", image: "https://picsum.photos/seed/croissant/200/200" },
  { id: "p6", name: "Pain au Chocolat", price: 25000, cost: 10000, stock: 15, entity: "B", image: "https://picsum.photos/seed/painauchocolat/200/200" },
  { id: "p7", name: "Cheese Cake", price: 45000, cost: 20000, stock: 10, entity: "B", image: "https://picsum.photos/seed/cheesecake/200/200" },
  { id: "p8", name: "Mineral Water", price: 10000, cost: 3000, stock: 100, entity: "C", image: "https://picsum.photos/seed/water/200/200" },
  { id: "p9", name: "Iced Tea", price: 15000, cost: 5000, stock: 60, entity: "C", image: "https://picsum.photos/seed/icedtea/200/200" },
  { id: "p10", name: "Lemonade", price: 20000, cost: 7000, stock: 40, entity: "C", image: "https://picsum.photos/seed/lemonade/200/200" },
];

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};
