import { useState, useMemo } from "react";
import { formatCurrency, Transaction } from "../types";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";

interface SessionProps {
  activeShift: {
    cashierName: string;
    startingCash: number;
    startTime: string;
  };
  transactions: Transaction[];
  onCloseShift: () => void;
}

export default function Session({ activeShift, transactions, onCloseShift }: SessionProps) {
  const [actualCash, setActualCash] = useState<string>("");
  
  const shiftTransactions = useMemo(() => {
    const shiftStart = new Date(activeShift.startTime).getTime();
    return transactions.filter(t => new Date(t.date).getTime() >= shiftStart && t.status === "PAID");
  }, [transactions, activeShift.startTime]);

  const totalSales = shiftTransactions.reduce((sum, t) => sum + t.grandTotal, 0);
  const cashSales = shiftTransactions.filter(t => t.paymentMethod === "CASH").reduce((sum, t) => sum + t.grandTotal, 0);
  const qrisSales = shiftTransactions.filter(t => t.paymentMethod === "QRIS").reduce((sum, t) => sum + t.grandTotal, 0);
  const cardSales = shiftTransactions.filter(t => t.paymentMethod === "CARD").reduce((sum, t) => sum + t.grandTotal, 0);
  
  const expectedCash = activeShift.startingCash + cashSales;
  const variance = Number(actualCash || 0) - expectedCash;

  return (
    <div className="flex-1 p-8 bg-gray-50 overflow-y-auto flex justify-center items-start pt-12">
      <Card className="w-full max-w-2xl">
        <CardHeader className="border-b text-center py-8 bg-white rounded-t-xl">
          <CardTitle className="text-2xl">Cashier Session</CardTitle>
          <p className="text-gray-500 mt-2">
            Cashier: <span className="font-semibold">{activeShift.cashierName}</span>
          </p>
          <p className="text-gray-500 text-sm">
            Started at: {new Date(activeShift.startTime).toLocaleString()}
          </p>
        </CardHeader>
        <CardContent className="p-8 space-y-8">
          <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border">
            <span className="font-medium text-gray-600">Opening Cash</span>
            <span className="text-xl font-bold">{formatCurrency(activeShift.startingCash)}</span>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Sales Summary</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg bg-white">
                <div className="text-sm text-gray-500 mb-1">Total Sales</div>
                <div className="text-2xl font-bold text-primary">{formatCurrency(totalSales)}</div>
              </div>
              <div className="p-4 border rounded-lg bg-white">
                <div className="text-sm text-gray-500 mb-1">Transactions</div>
                <div className="text-2xl font-bold">{shiftTransactions.length}</div>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 border rounded-lg bg-white text-center">
                <div className="text-xs text-gray-500 mb-1">CASH</div>
                <div className="font-bold">{formatCurrency(cashSales)}</div>
              </div>
              <div className="p-3 border rounded-lg bg-white text-center">
                <div className="text-xs text-gray-500 mb-1">QRIS</div>
                <div className="font-bold">{formatCurrency(qrisSales)}</div>
              </div>
              <div className="p-3 border rounded-lg bg-white text-center">
                <div className="text-xs text-gray-500 mb-1">CARD</div>
                <div className="font-bold">{formatCurrency(cardSales)}</div>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-semibold text-lg">Cash Reconciliation</h3>
            <div className="flex justify-between items-center p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <span className="font-medium text-primary">Expected Cash in Drawer</span>
              <span className="text-xl font-bold text-primary">{formatCurrency(expectedCash)}</span>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Actual Cash Input</label>
              <Input 
                type="number" 
                placeholder="Enter actual cash amount" 
                className="h-14 text-xl" 
                value={actualCash}
                onChange={(e) => setActualCash(e.target.value)}
              />
            </div>

            <div className={`flex justify-between items-center p-4 border rounded-lg ${variance === 0 ? 'bg-success/10 border-success/20 text-success' : variance > 0 ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-danger/10 border-danger/20 text-danger'}`}>
              <span className="font-medium">Variance</span>
              <span className="text-xl font-bold">{formatCurrency(variance)}</span>
            </div>
          </div>

          <Button 
            size="lg" 
            className="w-full h-14 text-lg mt-8"
            onClick={onCloseShift}
          >
            Close Shift
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
