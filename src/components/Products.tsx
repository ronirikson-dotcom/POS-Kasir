import { useState } from "react";
import { Search, Plus, Edit, Trash2 } from "lucide-react";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";
import { Badge } from "./ui/Badge";
import { Dialog, DialogHeader, DialogTitle } from "./ui/Dialog";
import { Product, formatCurrency, BundleItem } from "../types";

interface ProductsProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  entities: string[];
}

export default function Products({ products, setProducts, entities }: ProductsProps) {
  const [search, setSearch] = useState("");
  const [selectedEntity, setSelectedEntity] = useState<string>("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    price: number;
    cost: number;
    stock: number;
    entity: string;
    image: string;
    type: "SINGLE" | "BUNDLE";
    bundleItems: BundleItem[];
  }>({ name: "", price: 0, cost: 0, stock: 0, entity: entities[0] || "", image: "", type: "SINGLE", bundleItems: [] });

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesEntity = selectedEntity === "ALL" || p.entity === selectedEntity;
    return matchesSearch && matchesEntity;
  });

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({ 
        name: product.name, 
        price: product.price, 
        cost: product.cost || 0, 
        stock: product.stock || 0, 
        entity: product.entity, 
        image: product.image || "",
        type: product.type || "SINGLE",
        bundleItems: product.bundleItems || []
      });
    } else {
      setEditingProduct(null);
      setFormData({ name: "", price: 0, cost: 0, stock: 0, entity: entities[0] || "", image: "", type: "SINGLE", bundleItems: [] });
    }
    setIsModalOpen(true);
  };

  const handleAddBundleItem = () => {
    setFormData({ ...formData, bundleItems: [...formData.bundleItems, { productId: "", qty: 1 }] });
  };

  const handleUpdateBundleItem = (index: number, field: keyof BundleItem, value: any) => {
    const newBundleItems = [...formData.bundleItems];
    newBundleItems[index] = { ...newBundleItems[index], [field]: value };
    setFormData({ ...formData, bundleItems: newBundleItems });
  };

  const handleRemoveBundleItem = (index: number) => {
    const newBundleItems = [...formData.bundleItems];
    newBundleItems.splice(index, 1);
    setFormData({ ...formData, bundleItems: newBundleItems });
  };

  const handleSave = () => {
    if (!formData.name || formData.price <= 0 || !formData.entity) return;

    if (editingProduct) {
      setProducts(products.map(p => p.id === editingProduct.id ? { ...p, ...formData } : p));
    } else {
      setProducts([...products, { id: `p${Date.now()}`, ...formData }]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    setProducts(products.filter(p => p.id !== id));
  };

  return (
    <div className="flex-1 p-8 bg-gray-50 overflow-y-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Products</h2>
          <p className="text-gray-500">Manage product database per entity</p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="mr-2 h-4 w-4" /> Add Product
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader className="border-b bg-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
              <Badge 
                variant={selectedEntity === "ALL" ? "default" : "outline"} 
                className="cursor-pointer whitespace-nowrap"
                onClick={() => setSelectedEntity("ALL")}
              >
                All Entities
              </Badge>
              {entities.map(entity => (
                <Badge 
                  key={entity}
                  variant={selectedEntity === entity ? `entity${entity}` as any : "outline"} 
                  className="cursor-pointer whitespace-nowrap"
                  onClick={() => setSelectedEntity(entity)}
                >
                  Entity {entity}
                </Badge>
              ))}
            </div>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input 
                placeholder="Search products..." 
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
                <th className="px-6 py-4 font-medium w-16">Image</th>
                <th className="px-6 py-4 font-medium">Name</th>
                <th className="px-6 py-4 font-medium">Entity</th>
                <th className="px-6 py-4 font-medium">Stock</th>
                <th className="px-6 py-4 font-medium">Cost (Beli)</th>
                <th className="px-6 py-4 font-medium">Price (Jual)</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="h-10 w-10 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center border">
                      {product.image ? (
                        <img src={product.image} alt={product.name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <span className="text-gray-400 text-xs font-bold">{product.name.charAt(0)}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {product.name}
                    {product.type === "BUNDLE" && <Badge variant="secondary" className="ml-2 text-[10px]">BUNDLE</Badge>}
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={`entity${product.entity}` as any}>Entity {product.entity}</Badge>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {product.stock || 0}
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-600">
                    {formatCurrency(product.cost || 0)}
                  </td>
                  <td className="px-6 py-4 font-medium text-primary">
                    {formatCurrency(product.price)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-gray-500 hover:text-primary"
                      onClick={() => handleOpenModal(product)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-gray-500 hover:text-danger"
                      onClick={() => handleDelete(product.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    No products found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogHeader>
          <DialogTitle>{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4 max-h-[70vh] overflow-y-auto px-1">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Product Type</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="productType" 
                  value="SINGLE" 
                  checked={formData.type === "SINGLE"}
                  onChange={() => setFormData({ ...formData, type: "SINGLE" })}
                  className="text-primary focus:ring-primary h-4 w-4"
                />
                <span>Single Item</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="productType" 
                  value="BUNDLE" 
                  checked={formData.type === "BUNDLE"}
                  onChange={() => setFormData({ ...formData, type: "BUNDLE" })}
                  className="text-primary focus:ring-primary h-4 w-4"
                />
                <span>Bundle</span>
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Name</label>
            <Input 
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Product name"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Cost / Harga Beli (IDR)</label>
              <Input 
                type="number"
                value={formData.cost || ""}
                onChange={(e) => setFormData({ ...formData, cost: Number(e.target.value) })}
                placeholder="e.g. 15000"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Price / Harga Jual (IDR)</label>
              <Input 
                type="number"
                value={formData.price || ""}
                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                placeholder="e.g. 25000"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Stock / Kuantitas</label>
            <Input 
              type="number"
              value={formData.stock || ""}
              onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
              placeholder="e.g. 50"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Entity</label>
            <select 
              className="flex h-10 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
              value={formData.entity}
              onChange={(e) => setFormData({ ...formData, entity: e.target.value })}
            >
              {entities.map(entity => (
                <option key={entity} value={entity}>Entity {entity}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Image URL (Optional)</label>
            <Input 
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              placeholder="https://example.com/image.jpg"
            />
          </div>

          {formData.type === "BUNDLE" && (
            <div className="space-y-3 border-t pt-4 mt-4">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-gray-700">Bundle Items</label>
                <Button variant="outline" size="sm" onClick={handleAddBundleItem}>
                  <Plus className="h-4 w-4 mr-1" /> Add Item
                </Button>
              </div>
              
              {formData.bundleItems.map((item, index) => (
                <div key={index} className="flex items-center gap-2 bg-gray-50 p-2 rounded-md border">
                  <select
                    className="flex h-9 flex-1 rounded-md border border-gray-300 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    value={item.productId}
                    onChange={(e) => handleUpdateBundleItem(index, "productId", e.target.value)}
                  >
                    <option value="">Select Product...</option>
                    {products.filter(p => p.type !== "BUNDLE" && p.id !== editingProduct?.id).map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({formatCurrency(p.price)})</option>
                    ))}
                  </select>
                  <Input 
                    type="number"
                    className="w-20 h-9"
                    value={item.qty}
                    onChange={(e) => handleUpdateBundleItem(index, "qty", Number(e.target.value))}
                    min={1}
                  />
                  <Button variant="ghost" size="icon" className="h-9 w-9 text-danger" onClick={() => handleRemoveBundleItem(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {formData.bundleItems.length === 0 && (
                <p className="text-sm text-gray-500 italic text-center py-2">No items in this bundle yet.</p>
              )}
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save</Button>
        </div>
      </Dialog>
    </div>
  );
}
