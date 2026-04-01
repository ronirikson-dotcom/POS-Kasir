import { useState } from "react";
import { formatCurrency, Transaction } from "../types";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Search, Filter, CheckCircle2, AlertCircle } from "lucide-react";

interface SettlementProps {
  transactions: Transaction[];
}

export default function Settlement({ transactions }: SettlementProps) {
  const [search, setSearch] = useState("");

  const filteredTransactions = transactions.filter(t => 
    t.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 p-8 bg-gray-50 overflow-y-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Settlement</h2>
          <p className="text-gray-500">Reconcile daily transactions</p>
        </div>
        <div className="flex gap-4">
          <Button variant="outline"><Filter className="mr-2 h-4 w-4" /> Filter</Button>
          <Button>Reconcile All</Button>
        </div>
      </div>

      <Card>
        <CardHeader className="border-b bg-white">
          <div className="flex items-center justify-between">
            <CardTitle>Transactions</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input 
                placeholder="Search TRX ID..." 
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-6 py-4 font-medium">TRX ID</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Method</th>
                <th className="px-6 py-4 font-medium">Amount</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-center">Match</th>
                <th className="px-6 py-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredTransactions.map((trx) => (
                <tr key={trx.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{trx.id}</td>
                  <td className="px-6 py-4 text-gray-500">{new Date(trx.date).toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <Badge variant={trx.paymentMethod === "QRIS" ? "warning" : trx.paymentMethod === "CARD" ? "entityA" : "success"}>
                      {trx.paymentMethod || "UNKNOWN"}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 font-medium">{formatCurrency(trx.grandTotal)}</td>
                  <td className="px-6 py-4">
                    <Badge variant={trx.status === "PAID" ? "success" : "warning"}>
                      {trx.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {trx.status === "PAID" ? (
                      <CheckCircle2 className="mx-auto h-5 w-5 text-success" />
                    ) : (
                      <AlertCircle className="mx-auto h-5 w-5 text-danger" />
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button variant="ghost" size="sm">Details</Button>
                  </td>
                </tr>
              ))}
              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No transactions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
