import { useState } from "react";
import { Search, Plus, Edit, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";
import { Input } from "./ui/Input";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";
import { Dialog, DialogHeader, DialogTitle } from "./ui/Dialog";
import { Customer, MOCK_CUSTOMERS, formatCurrency } from "../types";

export default function Members() {
  const [search, setSearch] = useState("");
  const [members, setMembers] = useState<Customer[]>(MOCK_CUSTOMERS);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newMember, setNewMember] = useState({ name: "", phone: "", points: 0 });

  const [editingMember, setEditingMember] = useState<Customer | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  const handleAddMember = () => {
    if (!newMember.name || !newMember.phone) return;
    
    const newCustomer: Customer = {
      id: `c${Date.now()}`,
      name: newMember.name,
      phone: newMember.phone,
      points: newMember.points,
      isMember: true,
      registrationDate: new Date().toISOString().split('T')[0],
      lastTransactionDate: "-",
    };
    
    setMembers([newCustomer, ...members]);
    setIsAddModalOpen(false);
    setNewMember({ name: "", phone: "", points: 0 });
  };

  const handleUpdateMember = () => {
    if (!editingMember || !editingMember.name || !editingMember.phone) return;
    
    setMembers(members.map(m => m.id === editingMember.id ? editingMember : m));
    setEditingMember(null);
  };

  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(search.toLowerCase()) || 
    m.phone.includes(search)
  );

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedMembers(filteredMembers.map(m => m.id));
    } else {
      setSelectedMembers([]);
    }
  };

  const handleSelectMember = (id: string) => {
    if (selectedMembers.includes(id)) {
      setSelectedMembers(selectedMembers.filter(mId => mId !== id));
    } else {
      setSelectedMembers([...selectedMembers, id]);
    }
  };

  const handleBulkDelete = () => {
    setMembers(members.filter(m => !selectedMembers.includes(m.id)));
    setSelectedMembers([]);
  };

  return (
    <div className="flex-1 p-8 bg-gray-50 overflow-y-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Member Database</h2>
          <p className="text-gray-500">Manage your loyal customers and their points</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add Member</Button>
      </div>

      <Card>
        <CardHeader className="border-b bg-white">
          <div className="flex items-center justify-between">
            <CardTitle>Members List</CardTitle>
            <div className="flex items-center gap-4">
              {selectedMembers.length > 0 && (
                <div className="flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-md">
                  <span className="text-sm font-medium text-primary">{selectedMembers.length} selected</span>
                  <Button variant="danger" size="sm" onClick={handleBulkDelete}>
                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                  </Button>
                </div>
              )}
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input 
                  placeholder="Search name or phone..." 
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-6 py-4 font-medium w-12">
                  <input 
                    type="checkbox" 
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                    checked={selectedMembers.length === filteredMembers.length && filteredMembers.length > 0}
                    onChange={handleSelectAll}
                  />
                </th>
                <th className="px-6 py-4 font-medium">Name</th>
                <th className="px-6 py-4 font-medium">Phone</th>
                <th className="px-6 py-4 font-medium">Registration Date</th>
                <th className="px-6 py-4 font-medium">Last Transaction</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Points Balance</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredMembers.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                      checked={selectedMembers.includes(member.id)}
                      onChange={() => handleSelectMember(member.id)}
                    />
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">{member.name}</td>
                  <td className="px-6 py-4 text-gray-500">{member.phone}</td>
                  <td className="px-6 py-4 text-gray-500">{member.registrationDate || "-"}</td>
                  <td className="px-6 py-4 text-gray-500">{member.lastTransactionDate || "-"}</td>
                  <td className="px-6 py-4">
                    <Badge variant="success">Active</Badge>
                  </td>
                  <td className="px-6 py-4 font-medium text-primary">
                    {member.points.toLocaleString("id-ID")} pts
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-gray-500 hover:text-primary"
                      onClick={() => setEditingMember(member)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-gray-500 hover:text-danger"
                      onClick={() => {
                        setSelectedMembers([member.id]);
                        setTimeout(() => handleBulkDelete(), 0);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
              {filteredMembers.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    No members found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogHeader>
          <DialogTitle>Register New Member</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Name</label>
            <Input 
              placeholder="Enter full name" 
              value={newMember.name}
              onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Phone Number</label>
            <Input 
              placeholder="Enter phone number" 
              value={newMember.phone}
              onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Initial Points</label>
            <Input 
              type="number"
              placeholder="0" 
              value={newMember.points}
              onChange={(e) => setNewMember({ ...newMember, points: Number(e.target.value) })}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
          <Button onClick={handleAddMember} disabled={!newMember.name || !newMember.phone}>Save Member</Button>
        </div>
      </Dialog>

      <Dialog open={!!editingMember} onOpenChange={(open) => !open && setEditingMember(null)}>
        <DialogHeader>
          <DialogTitle>Edit Member Profile</DialogTitle>
        </DialogHeader>
        {editingMember && (
          <>
            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Name</label>
                <Input 
                  placeholder="Enter full name" 
                  value={editingMember.name}
                  onChange={(e) => setEditingMember({ ...editingMember, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Phone Number</label>
                <Input 
                  placeholder="Enter phone number" 
                  value={editingMember.phone}
                  onChange={(e) => setEditingMember({ ...editingMember, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Points Balance</label>
                <Input 
                  type="number"
                  placeholder="0" 
                  value={editingMember.points}
                  onChange={(e) => setEditingMember({ ...editingMember, points: Number(e.target.value) })}
                />
                <p className="text-xs text-gray-500">Manually adjust the member's points balance.</p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setEditingMember(null)}>Cancel</Button>
              <Button onClick={handleUpdateMember} disabled={!editingMember.name || !editingMember.phone}>Save Changes</Button>
            </div>
          </>
        )}
      </Dialog>
    </div>
  );
}
