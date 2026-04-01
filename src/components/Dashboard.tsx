import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";
import { formatCurrency, Transaction } from "../types";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface DashboardProps {
  entities: string[];
  transactions: Transaction[];
}

export default function Dashboard({ entities, transactions }: DashboardProps) {
  const [selectedEntityFilter, setSelectedEntityFilter] = useState<string>("ALL");
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Filter transactions by date
  const filteredTransactions = useMemo(() => {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    return transactions.filter(t => {
      const tDate = new Date(t.date);
      return tDate >= start && tDate <= end && t.status === "PAID";
    });
  }, [transactions, startDate, endDate]);

  // Generate sales data based on actual transactions
  const salesData = useMemo(() => {
    const hourlySales: Record<string, number> = {
      '08:00': 0, '10:00': 0, '12:00': 0, '14:00': 0, '16:00': 0, '18:00': 0, '20:00': 0
    };

    filteredTransactions.forEach(t => {
      const hour = new Date(t.date).getHours();
      // Find the closest bucket
      let bucket = '08:00';
      if (hour >= 20) bucket = '20:00';
      else if (hour >= 18) bucket = '18:00';
      else if (hour >= 16) bucket = '16:00';
      else if (hour >= 14) bucket = '14:00';
      else if (hour >= 12) bucket = '12:00';
      else if (hour >= 10) bucket = '10:00';

      // If entity filter is applied, only sum items for that entity
      let saleAmount = 0;
      if (selectedEntityFilter === "ALL") {
        saleAmount = t.grandTotal;
      } else {
        const entityItems = t.items.filter(item => item.entity === selectedEntityFilter);
        saleAmount = entityItems.reduce((sum, item) => sum + item.price * item.qty, 0);
      }
      
      hourlySales[bucket] += saleAmount;
    });

    return Object.entries(hourlySales).map(([name, sales]) => ({ name, sales }));
  }, [filteredTransactions, selectedEntityFilter]);

  const entityData = useMemo(() => {
    if (selectedEntityFilter !== "ALL") {
      const entitySales = filteredTransactions.reduce((sum, t) => {
        const entityItems = t.items.filter(item => item.entity === selectedEntityFilter);
        return sum + entityItems.reduce((itemSum, item) => itemSum + item.price * item.qty, 0);
      }, 0);
      return [{ name: `Entity ${selectedEntityFilter}`, value: entitySales }];
    }

    return entities.map(entity => {
      const entitySales = filteredTransactions.reduce((sum, t) => {
        const entityItems = t.items.filter(item => item.entity === entity);
        return sum + entityItems.reduce((itemSum, item) => itemSum + item.price * item.qty, 0);
      }, 0);
      return { name: `Entity ${entity}`, value: entitySales };
    }).filter(e => e.value > 0);
  }, [filteredTransactions, selectedEntityFilter, entities]);

  const totalSales = useMemo(() => {
    if (selectedEntityFilter === "ALL") {
      return filteredTransactions.reduce((sum, t) => sum + t.grandTotal, 0);
    }
    return entityData.reduce((sum, item) => sum + item.value, 0);
  }, [filteredTransactions, selectedEntityFilter, entityData]);

  const cashSales = useMemo(() => {
    return filteredTransactions.filter(t => t.paymentMethod === "CASH").reduce((sum, t) => sum + t.grandTotal, 0);
  }, [filteredTransactions]);

  const qrisSales = useMemo(() => {
    return filteredTransactions.filter(t => t.paymentMethod === "QRIS").reduce((sum, t) => sum + t.grandTotal, 0);
  }, [filteredTransactions]);

  const cardSales = useMemo(() => {
    return filteredTransactions.filter(t => t.paymentMethod === "CARD").reduce((sum, t) => sum + t.grandTotal, 0);
  }, [filteredTransactions]);

  const COLORS = ['#2F80ED', '#9b59b6', '#e67e22'];

  return (
    <div className="flex-1 p-8 bg-gray-50 overflow-y-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-gray-500">Overview of performance</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center gap-2 bg-white p-1 rounded-lg border">
            <Badge 
              variant={selectedEntityFilter === "ALL" ? "default" : "ghost"} 
              className="cursor-pointer"
              onClick={() => setSelectedEntityFilter("ALL")}
            >
              All Entities
            </Badge>
            {entities.map(entity => (
              <Badge 
                key={entity}
                variant={selectedEntityFilter === entity ? `entity${entity}` as any : "ghost"} 
                className="cursor-pointer"
                onClick={() => setSelectedEntityFilter(entity)}
              >
                {entity}
              </Badge>
            ))}
          </div>
          
          <div className="flex items-center gap-2">
            <input 
              type="date" 
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <span className="text-gray-500">to</span>
            <input 
              type="date" 
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="text-sm font-medium text-gray-500 mb-2">Sales</div>
            <div className="text-3xl font-bold text-gray-900">{formatCurrency(totalSales)}</div>
            <div className="text-sm text-success mt-2 flex items-center">
              ↑ 12% from yesterday
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-sm font-medium text-gray-500 mb-2">Cash</div>
            <div className="text-3xl font-bold text-gray-900">{formatCurrency(cashSales)}</div>
            <div className="text-sm text-gray-500 mt-2">{totalSales > 0 ? Math.round((cashSales / totalSales) * 100) : 0}% of total</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-sm font-medium text-gray-500 mb-2">QRIS</div>
            <div className="text-3xl font-bold text-gray-900">{formatCurrency(qrisSales)}</div>
            <div className="text-sm text-gray-500 mt-2">{totalSales > 0 ? Math.round((qrisSales / totalSales) * 100) : 0}% of total</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-sm font-medium text-gray-500 mb-2">Card</div>
            <div className="text-3xl font-bold text-gray-900">{formatCurrency(cardSales)}</div>
            <div className="text-sm text-gray-500 mt-2">{totalSales > 0 ? Math.round((cardSales / totalSales) * 100) : 0}% of total</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Hourly Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tickFormatter={(value) => `Rp ${value / 1000}k`}
                  />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    cursor={{ fill: '#f3f4f6' }}
                  />
                  <Bar dataKey="sales" fill="#2F80ED" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sales by Entity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full flex flex-col items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={entityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {entityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-2 w-full mt-4">
                {entityData.map((entry, index) => (
                  <div key={entry.name} className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }}></div>
                      <span>{entry.name}</span>
                    </div>
                    <span className="font-medium">{formatCurrency(entry.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: "Latte", qty: 45, revenue: 1575000 },
                { name: "Americano", qty: 38, revenue: 1140000 },
                { name: "Cheese Cake", qty: 24, revenue: 1080000 },
                { name: "Espresso", qty: 20, revenue: 500000 },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-8 text-center font-bold text-gray-400">#{i + 1}</div>
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-gray-500">{item.qty} sold</div>
                    </div>
                  </div>
                  <div className="font-semibold">{formatCurrency(item.revenue)}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Outstanding Vendor Payable</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { vendor: "Coffee Beans Co.", amount: 2500000, due: "Today" },
                { vendor: "Dairy Supplier", amount: 850000, due: "Tomorrow" },
                { vendor: "Bakery Partner", amount: 1200000, due: "In 3 days" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                  <div>
                    <div className="font-medium">{item.vendor}</div>
                    <div className="text-sm text-danger">Due: {item.due}</div>
                  </div>
                  <div className="font-semibold">{formatCurrency(item.amount)}</div>
                </div>
              ))}
              <Button variant="outline" className="w-full mt-2">View All Payables</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
