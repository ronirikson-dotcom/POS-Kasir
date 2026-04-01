import { useState } from "react";
import { Save, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "./ui/Card";
import { Input } from "./ui/Input";
import { Button } from "./ui/Button";
import { SystemSettings } from "../types";

interface SettingsProps {
  settings: SystemSettings;
  onSave: (newSettings: SystemSettings) => void;
  entities: string[];
  setEntities: React.Dispatch<React.SetStateAction<string[]>>;
}

export default function Settings({ settings: initialSettings, onSave, entities, setEntities }: SettingsProps) {
  const [settings, setSettings] = useState<SystemSettings>(initialSettings);
  const [isSaved, setIsSaved] = useState(false);
  const [newEntity, setNewEntity] = useState("");
  const [newTable, setNewTable] = useState("");

  const handleSave = () => {
    onSave(settings);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleAddEntity = () => {
    if (newEntity.trim() && !entities.includes(newEntity.trim())) {
      setEntities([...entities, newEntity.trim()]);
      setNewEntity("");
    }
  };

  const handleRemoveEntity = (entityToRemove: string) => {
    setEntities(entities.filter(e => e !== entityToRemove));
  };

  const handleAddTable = () => {
    if (newTable.trim() && !settings.tables.includes(newTable.trim())) {
      setSettings({ ...settings, tables: [...settings.tables, newTable.trim()] });
      setNewTable("");
    }
  };

  const handleRemoveTable = (tableToRemove: string) => {
    setSettings({ ...settings, tables: settings.tables.filter(t => t !== tableToRemove) });
  };

  return (
    <div className="flex-1 p-8 bg-gray-50 overflow-y-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
        <p className="text-gray-500">Configure system preferences</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Business Type & Point System</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Business Type</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="businessType" 
                    value="RETAIL" 
                    checked={settings.businessType === "RETAIL"}
                    onChange={() => setSettings({ ...settings, businessType: "RETAIL" })}
                    className="text-primary focus:ring-primary h-4 w-4"
                  />
                  <span>Retail</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="businessType" 
                    value="FNB" 
                    checked={settings.businessType === "FNB"}
                    onChange={() => setSettings({ ...settings, businessType: "FNB" })}
                    className="text-primary focus:ring-primary h-4 w-4"
                  />
                  <span>Food & Beverage (FnB)</span>
                </label>
              </div>
            </div>

            <div className="border-t pt-4 space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Earn Rate (IDR per 1 Point)
              </label>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Rp</span>
                <Input 
                  type="number" 
                  value={settings.earnRate}
                  onChange={(e) => setSettings({ ...settings, earnRate: Number(e.target.value) })}
                />
              </div>
              <p className="text-xs text-gray-500">
                Customer earns 1 point for every Rp {settings.earnRate.toLocaleString("id-ID")} spent.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Redeem Value (IDR per 1 Point)
              </label>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Rp</span>
                <Input 
                  type="number" 
                  value={settings.redeemValue}
                  onChange={(e) => setSettings({ ...settings, redeemValue: Number(e.target.value) })}
                />
              </div>
              <p className="text-xs text-gray-500">
                1 point is worth Rp {settings.redeemValue.toLocaleString("id-ID")} when redeemed.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Entities Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Add New Entity</label>
              <div className="flex gap-2">
                <Input 
                  placeholder="Entity Name (e.g., D)" 
                  value={newEntity}
                  onChange={(e) => setNewEntity(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddEntity()}
                />
                <Button onClick={handleAddEntity}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Active Entities</label>
              <div className="space-y-2">
                {entities.map(entity => (
                  <div key={entity} className="flex items-center justify-between p-3 border rounded-lg bg-white">
                    <span className="font-medium">Entity {entity}</span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-gray-500 hover:text-danger h-8 w-8"
                      onClick={() => handleRemoveEntity(entity)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {entities.length === 0 && (
                  <p className="text-sm text-gray-500 italic">No entities configured.</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {settings.businessType === "FNB" && (
          <Card>
            <CardHeader>
              <CardTitle>Table Management (FnB)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Add New Table</label>
                <div className="flex gap-2">
                  <Input 
                    placeholder="Table Name (e.g., Table 1)" 
                    value={newTable}
                    onChange={(e) => setNewTable(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTable()}
                  />
                  <Button onClick={handleAddTable}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Active Tables</label>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {settings.tables.map(table => (
                    <div key={table} className="flex items-center justify-between p-3 border rounded-lg bg-white">
                      <span className="font-medium">{table}</span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-gray-500 hover:text-danger h-8 w-8"
                        onClick={() => handleRemoveTable(table)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {settings.tables.length === 0 && (
                    <p className="text-sm text-gray-500 italic">No tables configured.</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="mt-8 flex justify-end">
        <Button onClick={handleSave} className="w-32" size="lg">
          {isSaved ? "Saved!" : <><Save className="mr-2 h-4 w-4" /> Save All</>}
        </Button>
      </div>
    </div>
  );
}
