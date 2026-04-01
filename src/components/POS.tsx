import { useState, useMemo } from "react";
import { Search, ShoppingCart, Trash2, Plus, Minus, Tag, CreditCard, Receipt, LayoutDashboard, Settings as SettingsIcon, UserCircle, X, QrCode, Banknote, CheckCircle2, ChevronDown, ChevronRight, Users, Package, Clock, Printer, FileText, Percent } from "lucide-react";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Badge } from "./ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";
import { Dialog, DialogHeader, DialogTitle } from "./ui/Dialog";
import { Product, CartItem, MOCK_PRODUCTS, formatCurrency, Entity, Customer, MOCK_CUSTOMERS, DEFAULT_SYSTEM_SETTINGS, MOCK_ENTITIES, HeldOrder, Transaction } from "../types";
import Dashboard from "./Dashboard";
import Settlement from "./Settlement";
import Session from "./Session";
import Members from "./Members";
import Settings from "./Settings";
import Products from "./Products";

export default function POS() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"POS" | "DASHBOARD" | "SETTLEMENT" | "SESSION" | "MEMBERS" | "PRODUCTS" | "SETTINGS">("POS");
  
  const [systemSettings, setSystemSettings] = useState(DEFAULT_SYSTEM_SETTINGS);
  const [entities, setEntities] = useState<string[]>(MOCK_ENTITIES);
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [selectedEntityFilter, setSelectedEntityFilter] = useState<string>("ALL");
  
  // Modals
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isEntityBreakdownOpen, setIsEntityBreakdownOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isHeldOrdersModalOpen, setIsHeldOrdersModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CartItem | null>(null);
  
  // Shift State
  const [activeShift, setActiveShift] = useState<{ cashierName: string, startingCash: number, startTime: string } | null>(null);
  const [loginName, setLoginName] = useState("");
  const [loginCash, setLoginCash] = useState("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Customer & Loyalty State
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [redeemInput, setRedeemInput] = useState("");
  const [selectedTable, setSelectedTable] = useState<string>("");
  const [heldOrders, setHeldOrders] = useState<HeldOrder[]>([]);
  
  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CARD" | "QRIS" | null>(null);
  const [qrState, setQrState] = useState<"LOADING" | "GENERATED" | "PAID">("LOADING");
  
  // Totals
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const [discount, setDiscount] = useState(0);
  const [pointRedeem, setPointRedeem] = useState(0);
  const tax = (subtotal - discount - pointRedeem) * 0.11; // 11% PPN
  const grandTotal = subtotal - discount - pointRedeem + tax;
  
  // Calculate earned points
  const earnedPoints = useMemo(() => {
    if (!selectedCustomer) return 0;
    return Math.floor(grandTotal / systemSettings.earnRate);
  }, [grandTotal, selectedCustomer, systemSettings.earnRate]);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesEntity = selectedEntityFilter === "ALL" || p.entity === selectedEntityFilter;
    return matchesSearch && matchesEntity;
  });

  const checkStock = (product: Product, qtyChange: number): boolean => {
    if (qtyChange <= 0) return true;
    
    if (product.type === "BUNDLE" && product.bundleItems) {
      for (const item of product.bundleItems) {
        const constituent = products.find(p => p.id === item.productId);
        if (!constituent || (constituent.stock || 0) < item.qty * qtyChange) {
          return false;
        }
      }
    } else {
      const p = products.find(p => p.id === product.id);
      if (!p || (p.stock || 0) < qtyChange) {
        return false;
      }
    }
    return true;
  };

  const deductStock = (product: Product, qtyChange: number) => {
    setProducts(prevProducts => {
      const newProducts = [...prevProducts];
      
      if (product.type === "BUNDLE" && product.bundleItems) {
        product.bundleItems.forEach(item => {
          const idx = newProducts.findIndex(p => p.id === item.productId);
          if (idx !== -1) {
            newProducts[idx] = {
              ...newProducts[idx],
              stock: (newProducts[idx].stock || 0) - (item.qty * qtyChange)
            };
          }
        });
      } else {
        const idx = newProducts.findIndex(p => p.id === product.id);
        if (idx !== -1) {
          newProducts[idx] = {
            ...newProducts[idx],
            stock: (newProducts[idx].stock || 0) - qtyChange
          };
        }
      }
      
      return newProducts;
    });
  };

  const voidCart = () => {
    cart.forEach(item => {
      deductStock(item, -item.qty);
    });
    setCart([]);
    setDiscount(0);
    setPointRedeem(0);
  };

  const handleHoldOrder = () => {
    if (cart.length === 0) return;
    const newHeldOrder: HeldOrder = {
      id: `HOLD-${Date.now()}`,
      timestamp: new Date().toISOString(),
      items: [...cart],
      customerId: selectedCustomer?.id,
      customerName: selectedCustomer?.name,
      table: selectedTable
    };
    setHeldOrders(prev => [...prev, newHeldOrder]);
    setCart([]);
    setSelectedCustomer(null);
    setSelectedTable("");
    setDiscount(0);
    setPointRedeem(0);
  };

  const restoreHeldOrder = (order: HeldOrder) => {
    if (cart.length > 0) {
      handleHoldOrder();
    }
    setCart(order.items);
    if (order.customerId) {
      const cust = MOCK_CUSTOMERS.find(c => c.id === order.customerId);
      setSelectedCustomer(cust || null);
    } else {
      setSelectedCustomer(null);
    }
    setSelectedTable(order.table || "");
    setHeldOrders(prev => prev.filter(o => o.id !== order.id));
    setIsHeldOrdersModalOpen(false);
  };

  const deleteHeldOrder = (order: HeldOrder) => {
    order.items.forEach(item => {
      deductStock(item, -item.qty);
    });
    setHeldOrders(prev => prev.filter(o => o.id !== order.id));
  };

  const printBill = () => {
    if (cart.length === 0) return;
    const printContent = `
      <div style="font-family: monospace; width: 300px; margin: 0 auto; padding: 20px;">
        <h2 style="text-align: center;">Aksa-POS Bill</h2>
        <p style="text-align: center;">${new Date().toLocaleString()}</p>
        <hr/>
        ${selectedTable ? `<p>Table: ${selectedTable}</p>` : ''}
        ${selectedCustomer ? `<p>Customer: ${selectedCustomer.name}</p>` : ''}
        <hr/>
        ${cart.map(item => `
          <div style="display: flex; justify-content: space-between;">
            <span>${item.name} x${item.qty}</span>
            <span>${formatCurrency(item.price * item.qty)}</span>
          </div>
        `).join('')}
        <hr/>
        <div style="display: flex; justify-content: space-between;">
          <span>Subtotal</span>
          <span>${formatCurrency(subtotal)}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span>Tax (11%)</span>
          <span>${formatCurrency(tax)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 1.2em; margin-top: 10px;">
          <span>Total</span>
          <span>${formatCurrency(grandTotal)}</span>
        </div>
      </div>
    `;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const printChecker = () => {
    if (cart.length === 0) return;
    const printContent = `
      <div style="font-family: monospace; width: 300px; margin: 0 auto; padding: 20px;">
        <h2 style="text-align: center;">KITCHEN CHECKER</h2>
        <p style="text-align: center;">${new Date().toLocaleString()}</p>
        <hr/>
        ${selectedTable ? `<p><strong>Table: ${selectedTable}</strong></p>` : ''}
        <hr/>
        ${cart.map(item => `
          <div style="font-size: 1.2em; margin-bottom: 10px;">
            <strong>[ ] ${item.qty}x ${item.name}</strong>
          </div>
        `).join('')}
        <hr/>
      </div>
    `;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const addToCart = (product: Product) => {
    if (!checkStock(product, 1)) {
      alert("Not enough stock available!");
      return;
    }

    deductStock(product, 1);

    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { ...product, cartItemId: Date.now().toString(), qty: 1 }];
    });
  };

  const updateQty = (cartItemId: string, newQty: number) => {
    const item = cart.find(i => i.cartItemId === cartItemId);
    if (!item) return;

    const diff = newQty - item.qty;
    
    if (diff > 0) {
      if (!checkStock(item, diff)) {
        alert("Not enough stock available!");
        return;
      }
    }

    deductStock(item, diff);

    if (newQty <= 0) {
      setCart(prev => prev.filter(i => i.cartItemId !== cartItemId));
      setEditingItem(null);
    } else {
      setCart(prev => prev.map(i => 
        i.cartItemId === cartItemId ? { ...i, qty: newQty } : i
      ));
      if (editingItem) setEditingItem({ ...editingItem, qty: newQty });
    }
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    setIsPaymentModalOpen(true);
    setPaymentMethod(null);
  };

  const handlePaymentSelect = (method: "CASH" | "CARD" | "QRIS") => {
    setPaymentMethod(method);
    if (method === "QRIS") {
      setQrState("LOADING");
      setTimeout(() => setQrState("GENERATED"), 1500);
      // Simulate payment success after 5 seconds
      setTimeout(() => setQrState("PAID"), 6500);
    }
  };

  const completeTransaction = () => {
    const newTransaction: Transaction = {
      id: `TRX-${Math.floor(Math.random() * 1000000)}`,
      date: new Date().toISOString(),
      items: [...cart],
      subtotal,
      discount,
      tax,
      pointRedeem,
      grandTotal,
      paymentMethod,
      status: "PAID",
      customerId: selectedCustomer?.id,
      customerName: selectedCustomer?.name,
      earnedPoints,
    };
    setTransactions(prev => [...prev, newTransaction]);
    setIsPaymentModalOpen(false);
    setIsReceiptModalOpen(true);
  };

  const closeReceipt = () => {
    setIsReceiptModalOpen(false);
    setCart([]);
    setDiscount(0);
    setPointRedeem(0);
    setSelectedCustomer(null);
    setRedeemInput("");
  };

  const handleApplyPoints = () => {
    if (!selectedCustomer) return;
    const pointsToRedeem = parseInt(redeemInput) || 0;
    const maxRedeemable = Math.min(selectedCustomer.points, Math.floor(subtotal / systemSettings.redeemValue));
    
    if (pointsToRedeem > maxRedeemable) {
      alert(`Maximum points you can redeem is ${maxRedeemable}`);
      return;
    }
    
    setPointRedeem(pointsToRedeem * systemSettings.redeemValue);
    setIsDiscountModalOpen(false);
  };

  const filteredCustomers = MOCK_CUSTOMERS.filter(c => 
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) || 
    c.phone.includes(customerSearch)
  );

  const groupedEntities = useMemo(() => {
    const grouped: Record<string, { items: CartItem[], subtotal: number }> = {};
    cart.forEach(item => {
      if (!grouped[item.entity]) {
        grouped[item.entity] = { items: [], subtotal: 0 };
      }
      grouped[item.entity].items.push(item);
      grouped[item.entity].subtotal += item.price * item.qty;
    });
    return grouped;
  }, [cart]);

  if (!activeShift) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-100 p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center space-y-2 pb-6 border-b">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-xl bg-primary text-white font-bold text-3xl mb-2 shadow-sm">
              A
            </div>
            <CardTitle className="text-2xl font-bold">Aksa-POS</CardTitle>
            <p className="text-sm text-gray-500">Open a new shift to start</p>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Cashier Name</label>
              <Input 
                placeholder="Enter your name" 
                value={loginName}
                onChange={(e) => setLoginName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Starting Cash (Rp)</label>
              <Input 
                type="number" 
                placeholder="Enter starting cash in drawer" 
                value={loginCash}
                onChange={(e) => setLoginCash(e.target.value)}
              />
            </div>
            <Button 
              className="w-full h-12 text-lg" 
              disabled={!loginName || !loginCash}
              onClick={() => {
                setActiveShift({
                  cashierName: loginName,
                  startingCash: Number(loginCash),
                  startTime: new Date().toISOString()
                });
              }}
            >
              Open Shift
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-gray-100">
      {/* Top Navigation */}
      <header className="flex h-16 items-center justify-between border-b bg-white px-6 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-white font-bold">A</div>
          <h1 className="text-xl font-bold text-gray-900">Aksa-POS</h1>
        </div>
        <nav className="flex gap-1">
          <Button variant={activeTab === "POS" ? "primary" : "ghost"} onClick={() => setActiveTab("POS")}>
            <ShoppingCart className="mr-2 h-4 w-4" /> POS
          </Button>
          <Button variant={activeTab === "DASHBOARD" ? "primary" : "ghost"} onClick={() => setActiveTab("DASHBOARD")}>
            <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
          </Button>
          <Button variant={activeTab === "SETTLEMENT" ? "primary" : "ghost"} onClick={() => setActiveTab("SETTLEMENT")}>
            <Receipt className="mr-2 h-4 w-4" /> Settlement
          </Button>
          <Button variant={activeTab === "SESSION" ? "primary" : "ghost"} onClick={() => setActiveTab("SESSION")}>
            <UserCircle className="mr-2 h-4 w-4" /> Shift
          </Button>
          <Button variant={activeTab === "MEMBERS" ? "primary" : "ghost"} onClick={() => setActiveTab("MEMBERS")}>
            <Users className="mr-2 h-4 w-4" /> Members
          </Button>
          <Button variant={activeTab === "PRODUCTS" ? "primary" : "ghost"} onClick={() => setActiveTab("PRODUCTS")}>
            <Package className="mr-2 h-4 w-4" /> Products
          </Button>
        </nav>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => setIsHeldOrdersModalOpen(true)} className="relative">
            <Clock className="mr-2 h-4 w-4" /> Held Orders
            {heldOrders.length > 0 && (
              <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white">
                {heldOrders.length}
              </span>
            )}
          </Button>
          <div className="text-sm font-medium">Cashier: {activeShift.cashierName}</div>
          <Button variant={activeTab === "SETTINGS" ? "primary" : "outline"} size="icon" onClick={() => setActiveTab("SETTINGS")}>
            <SettingsIcon className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 overflow-hidden">
        {activeTab === "POS" && (
          <>
            {/* Left Panel - Products */}
            <div className="flex flex-1 flex-col p-6">
              <div className="mb-6 flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input 
                    placeholder="Search products..." 
                    className="pl-9 h-12 text-lg"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                  <Badge 
                    variant={selectedEntityFilter === "ALL" ? "default" : "outline"} 
                    className="px-3 py-1.5 text-sm cursor-pointer whitespace-nowrap"
                    onClick={() => setSelectedEntityFilter("ALL")}
                  >
                    All Entities
                  </Badge>
                  {entities.map(entity => (
                    <Badge 
                      key={entity}
                      variant={selectedEntityFilter === entity ? `entity${entity}` as any : "outline"} 
                      className="px-3 py-1.5 text-sm cursor-pointer whitespace-nowrap"
                      onClick={() => setSelectedEntityFilter(entity)}
                    >
                      Entity {entity}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 overflow-y-auto pb-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {filteredProducts.map(product => (
                  <Card 
                    key={product.id} 
                    className="cursor-pointer transition-all hover:border-primary hover:shadow-md overflow-hidden"
                    onClick={() => addToCart(product)}
                  >
                    <div className="aspect-square w-full bg-gray-100 flex items-center justify-center relative">
                      {product.image ? (
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="h-16 w-16 rounded-full bg-white shadow-sm flex items-center justify-center text-2xl">
                          {product.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <div className="mb-1 flex items-start justify-between gap-2">
                        <h3 className="font-semibold line-clamp-2 text-sm">{product.name}</h3>
                        <Badge variant={`entity${product.entity}` as any} className="shrink-0">{product.entity}</Badge>
                      </div>
                      <p className="text-primary font-bold">{formatCurrency(product.price)}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Right Panel - Cart & Summary */}
            <div className="flex w-[400px] flex-col border-l bg-white shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)]">
              {/* Customer Selection */}
              <div 
                className="flex items-center justify-between border-b p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setIsCustomerModalOpen(true)}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <UserCircle className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">
                      {selectedCustomer ? selectedCustomer.name : "General Customer"}
                    </div>
                    {selectedCustomer && (
                      <div className="text-xs text-primary font-medium">
                        {selectedCustomer.points.toLocaleString("id-ID")} Points
                      </div>
                    )}
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </div>

              <div className="flex items-center justify-between border-b p-4">
                <h2 className="text-lg font-bold">Current Order</h2>
                <Badge variant="default">{cart.length} items</Badge>
              </div>

              {systemSettings.businessType === "FNB" && (
                <div className="border-b p-4 bg-gray-50 flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Table:</label>
                  <select 
                    className="flex h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    value={selectedTable}
                    onChange={(e) => setSelectedTable(e.target.value)}
                  >
                    <option value="">Select Table...</option>
                    {systemSettings.tables.map(table => (
                      <option key={table} value={table}>{table}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto p-4">
                {cart.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-gray-400">
                    <ShoppingCart className="mb-4 h-12 w-12 opacity-20" />
                    <p>Cart is empty</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cart.map(item => (
                      <div 
                        key={item.cartItemId} 
                        className="flex items-center justify-between rounded-lg border p-3 hover:border-primary/50 cursor-pointer"
                        onClick={() => setEditingItem(item)}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{item.name}</span>
                            <Badge variant={`entity${item.entity}` as any} className="text-[10px] px-1 py-0 h-4">{item.entity}</Badge>
                          </div>
                          <div className="text-sm text-gray-500">{formatCurrency(item.price)}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center rounded-md border bg-gray-50">
                            <button 
                              className="px-2 py-1 text-gray-500 hover:text-gray-900"
                              onClick={(e) => { e.stopPropagation(); updateQty(item.cartItemId, item.qty - 1); }}
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="w-6 text-center text-sm font-medium">{item.qty}</span>
                            <button 
                              className="px-2 py-1 text-gray-500 hover:text-gray-900"
                              onClick={(e) => { e.stopPropagation(); updateQty(item.cartItemId, item.qty + 1); }}
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                          <div className="w-20 text-right font-semibold text-sm">
                            {formatCurrency(item.price * item.qty)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Summary Panel */}
              <div className="border-t bg-gray-50 p-4">
                <div className="mb-4 space-y-2 text-sm">
                  <div 
                    className="flex justify-between cursor-pointer hover:text-primary"
                    onClick={() => setIsEntityBreakdownOpen(true)}
                  >
                    <span className="text-gray-500 flex items-center gap-1">Subtotal <ChevronRight className="h-3 w-3" /></span>
                    <span className="font-medium">{formatCurrency(subtotal)}</span>
                  </div>
                  <div 
                    className="flex justify-between cursor-pointer hover:text-primary"
                    onClick={() => setIsDiscountModalOpen(true)}
                  >
                    <span className="text-gray-500 flex items-center gap-1">Discount <Tag className="h-3 w-3" /></span>
                    <span className="font-medium text-danger">-{formatCurrency(discount)}</span>
                  </div>
                  {pointRedeem > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Points Redeemed</span>
                      <span className="font-medium text-danger">-{formatCurrency(pointRedeem)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tax (11%)</span>
                    <span className="font-medium">{formatCurrency(tax)}</span>
                  </div>
                  <div className="my-2 border-t border-dashed border-gray-300"></div>
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-primary">{formatCurrency(grandTotal)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-2">
                  <Button variant="outline" className="w-full text-danger border-danger/30 hover:bg-danger/5" onClick={voidCart} disabled={cart.length === 0}>
                    Void
                  </Button>
                  <Button variant="outline" className="w-full" onClick={handleHoldOrder} disabled={cart.length === 0}>
                    Hold
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <Button variant="outline" className="w-full" onClick={printBill} disabled={cart.length === 0}>
                    <FileText className="mr-2 h-4 w-4" /> Bill
                  </Button>
                  <Button variant="outline" className="w-full" onClick={printChecker} disabled={cart.length === 0}>
                    <Printer className="mr-2 h-4 w-4" /> Checker
                  </Button>
                </div>
                <Button 
                  size="lg" 
                  className="w-full h-14 text-lg" 
                  disabled={cart.length === 0}
                  onClick={handleCheckout}
                >
                  Checkout
                </Button>
              </div>
            </div>
          </>
        )}
        
        {activeTab === "DASHBOARD" && <Dashboard entities={entities} transactions={transactions} />}
        {activeTab === "SETTLEMENT" && <Settlement transactions={transactions} />}
        {activeTab === "SESSION" && <Session activeShift={activeShift} transactions={transactions} onCloseShift={() => {
          setActiveShift(null);
          setLoginName("");
          setLoginCash("");
          setActiveTab("POS");
        }} />}
        {activeTab === "MEMBERS" && <Members />}
        {activeTab === "PRODUCTS" && <Products products={products} setProducts={setProducts} entities={entities} />}
        {activeTab === "SETTINGS" && <Settings settings={systemSettings} onSave={setSystemSettings} entities={entities} setEntities={setEntities} />}
      </main>

      {/* Modals */}
      
      {/* Held Orders Modal */}
      <Dialog open={isHeldOrdersModalOpen} onOpenChange={setIsHeldOrdersModalOpen}>
        <DialogHeader>
          <DialogTitle>Held Orders</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {heldOrders.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No held orders</p>
          ) : (
            heldOrders.map(order => (
              <div key={order.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center border-b pb-2">
                  <div>
                    <span className="font-bold text-gray-900">{order.id}</span>
                    <span className="text-sm text-gray-500 ml-2">
                      {new Date(order.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => restoreHeldOrder(order)}>
                      Restore
                    </Button>
                    <Button variant="ghost" size="icon" className="text-danger hover:text-danger hover:bg-danger/10" onClick={() => deleteHeldOrder(order)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  {order.table && <span className="mr-4"><strong>Table:</strong> {order.table}</span>}
                  {order.customerName && <span><strong>Customer:</strong> {order.customerName}</span>}
                </div>
                <div className="text-sm text-gray-500">
                  {order.items.length} items • {formatCurrency(order.items.reduce((sum, item) => sum + item.price * item.qty, 0))}
                </div>
              </div>
            ))
          )}
        </div>
      </Dialog>

      {/* Edit Item Qty Modal */}
      <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
        <DialogHeader>
          <DialogTitle>Edit Item</DialogTitle>
        </DialogHeader>
        {editingItem && (
          <div className="py-4">
            <div className="mb-4 flex items-center justify-between">
              <span className="font-medium">{editingItem.name}</span>
              <span className="text-gray-500">{formatCurrency(editingItem.price)}</span>
            </div>
            <div className="flex items-center justify-center gap-4">
              <Button variant="outline" size="icon" className="h-12 w-12 rounded-full" onClick={() => updateQty(editingItem.cartItemId, editingItem.qty - 1)}>
                <Minus className="h-6 w-6" />
              </Button>
              <span className="text-3xl font-bold w-16 text-center">{editingItem.qty}</span>
              <Button variant="outline" size="icon" className="h-12 w-12 rounded-full" onClick={() => updateQty(editingItem.cartItemId, editingItem.qty + 1)}>
                <Plus className="h-6 w-6" />
              </Button>
            </div>
            <div className="mt-8 flex justify-end gap-2">
              <Button variant="danger" onClick={() => updateQty(editingItem.cartItemId, 0)}>Remove</Button>
              <Button onClick={() => setEditingItem(null)}>Done</Button>
            </div>
          </div>
        )}
      </Dialog>

      {/* Entity Breakdown Modal */}
      <Dialog open={isEntityBreakdownOpen} onOpenChange={setIsEntityBreakdownOpen}>
        <DialogHeader>
          <DialogTitle>Subtotal by Entity</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {(Object.entries(groupedEntities) as [string, { items: CartItem[], subtotal: number }][]).map(([entity, data]) => (
            <div key={entity} className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-3">
                <Badge variant={`entity${entity}` as any} className="text-sm px-2 py-1">Entity {entity}</Badge>
                <span className="font-bold">{formatCurrency(data.subtotal)}</span>
              </div>
              <div className="space-y-2">
                {data.items.map(item => (
                  <div key={item.cartItemId} className="flex justify-between text-sm text-gray-600">
                    <span>{item.qty}x {item.name}</span>
                    <span>{formatCurrency(item.price * item.qty)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div className="border-t pt-4 flex justify-between font-bold text-lg">
            <span>Total</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={() => setIsEntityBreakdownOpen(false)}>Close</Button>
        </div>
      </Dialog>

      {/* Discount & Loyalty Modal */}
      <Dialog open={isDiscountModalOpen} onOpenChange={setIsDiscountModalOpen}>
        <DialogHeader>
          <DialogTitle>Discount & Loyalty</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-6">
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-500">Apply Discount</h3>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setDiscount(subtotal * 0.1)}>10%</Button>
              <Button variant="outline" className="flex-1" onClick={() => setDiscount(subtotal * 0.2)}>20%</Button>
              <Button variant="outline" className="flex-1" onClick={() => setDiscount(0)}>Clear</Button>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium text-gray-500">Point Redeem</h3>
              {selectedCustomer ? (
                <span className="text-xs text-primary font-medium">Available: {selectedCustomer.points.toLocaleString("id-ID")} pts</span>
              ) : (
                <span className="text-xs text-gray-400">Select a member first</span>
              )}
            </div>
            <div className="flex gap-2">
              <Input 
                type="number" 
                placeholder="Input points to redeem" 
                value={redeemInput}
                onChange={(e) => setRedeemInput(e.target.value)}
                disabled={!selectedCustomer}
                className="flex-1"
              />
              <Button 
                variant="secondary" 
                disabled={!selectedCustomer || !redeemInput}
                onClick={handleApplyPoints}
              >
                Apply
              </Button>
            </div>
            {selectedCustomer && (
              <p className="text-xs text-gray-500">
                1 point = Rp {systemSettings.redeemValue.toLocaleString("id-ID")}
              </p>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setIsDiscountModalOpen(false)}>Close</Button>
        </div>
      </Dialog>

      {/* Customer Selection Modal */}
      <Dialog open={isCustomerModalOpen} onOpenChange={setIsCustomerModalOpen}>
        <DialogHeader>
          <DialogTitle>Select Customer</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input 
              placeholder="Search member name or phone..." 
              className="pl-9"
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
            />
          </div>
          
          <div className="max-h-[40vh] overflow-y-auto space-y-2">
            <div 
              className={`p-3 border rounded-lg cursor-pointer transition-colors ${!selectedCustomer ? 'border-primary bg-primary/5' : 'hover:bg-gray-50'}`}
              onClick={() => { setSelectedCustomer(null); setIsCustomerModalOpen(false); }}
            >
              <div className="font-medium">General Customer</div>
              <div className="text-sm text-gray-500">No points accumulation</div>
            </div>
            
            {filteredCustomers.map(customer => (
              <div 
                key={customer.id}
                className={`p-3 border rounded-lg cursor-pointer transition-colors flex justify-between items-center ${selectedCustomer?.id === customer.id ? 'border-primary bg-primary/5' : 'hover:bg-gray-50'}`}
                onClick={() => { setSelectedCustomer(customer); setIsCustomerModalOpen(false); }}
              >
                <div>
                  <div className="font-medium flex items-center gap-2">
                    {customer.name}
                    <Badge variant="success" className="text-[10px] px-1 py-0 h-4">Member</Badge>
                  </div>
                  <div className="text-sm text-gray-500">{customer.phone}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-primary">{customer.points.toLocaleString("id-ID")}</div>
                  <div className="text-xs text-gray-500">Points</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Dialog>

      {/* Payment Modal */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogHeader>
          <DialogTitle>Payment</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <div className="mb-6 rounded-xl bg-gray-50 p-6 text-center">
            <div className="text-sm text-gray-500 mb-1">Total Amount</div>
            <div className="text-4xl font-bold text-primary">{formatCurrency(grandTotal)}</div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <Button 
              variant={paymentMethod === "CASH" ? "primary" : "outline"} 
              className="h-24 flex-col gap-2"
              onClick={() => handlePaymentSelect("CASH")}
            >
              <Banknote className="h-8 w-8" />
              <span>CASH</span>
            </Button>
            <Button 
              variant={paymentMethod === "CARD" ? "primary" : "outline"} 
              className="h-24 flex-col gap-2"
              onClick={() => handlePaymentSelect("CARD")}
            >
              <CreditCard className="h-8 w-8" />
              <span>CARD</span>
            </Button>
            <Button 
              variant={paymentMethod === "QRIS" ? "primary" : "outline"} 
              className="h-24 flex-col gap-2 relative overflow-hidden"
              onClick={() => handlePaymentSelect("QRIS")}
            >
              <div className="absolute -right-2 -top-2 bg-danger text-white text-[10px] font-bold px-4 py-1 rotate-45">🔥</div>
              <QrCode className="h-8 w-8" />
              <span>QRIS</span>
            </Button>
          </div>

          {paymentMethod === "CASH" && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
              <Input type="number" placeholder="Enter cash amount" className="h-14 text-xl text-center" />
              <div className="grid grid-cols-4 gap-2">
                {[50000, 100000, 200000, "Exact"].map(amt => (
                  <Button key={amt} variant="secondary" className="h-12">{typeof amt === 'number' ? formatCurrency(amt).replace('Rp', '') : amt}</Button>
                ))}
              </div>
            </div>
          )}

          {paymentMethod === "QRIS" && (
            <div className="flex flex-col items-center justify-center p-4 animate-in fade-in slide-in-from-bottom-4">
              {qrState === "LOADING" && (
                <div className="flex flex-col items-center gap-4 text-gray-500">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                  <p>Generating QR...</p>
                </div>
              )}
              {qrState === "GENERATED" && (
                <div className="flex flex-col items-center gap-4">
                  <div className="rounded-xl border-2 border-dashed border-gray-300 p-4">
                    <QrCode className="h-48 w-48 text-gray-800" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-warning flex items-center gap-2 justify-center">
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-warning opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-warning"></span>
                      </span>
                      Waiting for payment...
                    </p>
                    <p className="text-sm text-gray-500 mt-1">Exp: 01:29</p>
                  </div>
                </div>
              )}
              {qrState === "PAID" && (
                <div className="flex flex-col items-center gap-4">
                  <div className="rounded-full bg-success/10 p-6 text-success">
                    <CheckCircle2 className="h-24 w-24" />
                  </div>
                  <h3 className="text-2xl font-bold text-success">PAID SUCCESSFULLY</h3>
                </div>
              )}
            </div>
          )}

          <div className="mt-8 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setIsPaymentModalOpen(false)}>Cancel</Button>
            <Button 
              size="lg" 
              disabled={!paymentMethod || (paymentMethod === "QRIS" && qrState !== "PAID")}
              onClick={completeTransaction}
            >
              Complete Transaction
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Receipt Modal */}
      <Dialog open={isReceiptModalOpen} onOpenChange={closeReceipt}>
        <div className="py-4 flex flex-col items-center">
          <div className="w-80 bg-white p-6 shadow-sm border border-gray-200 font-mono text-sm">
            <div className="text-center mb-6">
              <h2 className="text-lg font-bold">STORE NAME</h2>
              <p className="text-xs text-gray-500">Jl. Example Street No. 123</p>
              <p className="text-xs text-gray-500">{new Date().toLocaleString()}</p>
            </div>
            
            <div className="space-y-4 mb-6">
              {(Object.entries(groupedEntities) as [string, { items: CartItem[], subtotal: number }][]).map(([entity, data]) => (
                <div key={entity}>
                  <div className="font-bold border-b border-dashed border-gray-400 pb-1 mb-2">Entity {entity}</div>
                  {data.items.map(item => (
                    <div key={item.cartItemId} className="flex justify-between mb-1">
                      <span>{item.qty}x {item.name}</span>
                      <span>{formatCurrency(item.price * item.qty)}</span>
                    </div>
                  ))}
                  <div className="flex justify-end text-xs text-gray-500 mt-1">
                    Subtotal: {formatCurrency(data.subtotal)}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-dashed border-gray-400 pt-2 space-y-1">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Discount</span>
                <span>-{formatCurrency(discount)}</span>
              </div>
              {pointRedeem > 0 && (
                <div className="flex justify-between">
                  <span>Points Redeemed</span>
                  <span>-{formatCurrency(pointRedeem)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Tax</span>
                <span>{formatCurrency(tax)}</span>
              </div>
              <div className="flex justify-between font-bold text-base mt-2 pt-2 border-t border-dashed border-gray-400">
                <span>TOTAL</span>
                <span>{formatCurrency(grandTotal)}</span>
              </div>
            </div>

            {selectedCustomer && (
              <div className="mt-4 border-t border-dashed border-gray-400 pt-4 text-center">
                <p className="font-bold">MEMBER REWARDS</p>
                <p>{selectedCustomer.name}</p>
                <p className="mt-1 text-primary">+{earnedPoints.toLocaleString("id-ID")} Points Earned</p>
              </div>
            )}

            <div className="mt-6 text-center text-xs">
              <p>PAID VIA {paymentMethod}</p>
              <p className="mt-4">Thank you for your purchase!</p>
            </div>
          </div>
          
          <div className="mt-6 flex gap-4">
            <Button variant="outline" onClick={closeReceipt}>Close</Button>
            <Button onClick={closeReceipt}><Receipt className="mr-2 h-4 w-4"/> Print Receipt</Button>
          </div>
        </div>
      </Dialog>

    </div>
  );
}
