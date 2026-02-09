import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Shield, Plus, Building2, Package, Trash2, Loader2, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../utils/cn';

function AdminPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('bases');
  
  // Data State
  const [bases, setBases] = useState([]);
  const [equipmentTypes, setEquipmentTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Forms State
  const [baseForm, setBaseForm] = useState({ name: '', location: '' });
  const [equipForm, setEquipForm] = useState({ name: '', category: '', unit: '' });
  const [showBaseForm, setShowBaseForm] = useState(false);
  const [showEquipForm, setShowEquipForm] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
        const [basesRes, equipRes] = await Promise.all([
            api.get('/bases'),
            api.get('/equipment-types')
        ]);
        setBases(basesRes.data);
        setEquipmentTypes(equipRes.data);
    } catch (err) {
        console.error(err);
    } finally {
        setIsLoading(false);
    }
  };

  const handleCreateBase = async (e) => {
    e.preventDefault();
    try {
        await api.post('/bases', baseForm);
        fetchData();
        setBaseForm({ name: '', location: '' });
        setShowBaseForm(false);
    } catch (err) {
        alert(err.response?.data?.error || 'Error creating base');
    }
  };

  const handleCreateEquip = async (e) => {
    e.preventDefault();
    try {
        await api.post('/equipment-types', equipForm);
        fetchData();
        setEquipForm({ name: '', category: '', unit: '' });
        setShowEquipForm(false);
    } catch (err) {
       alert(err.response?.data?.error || 'Error creating equipment');
    }
  };

  const handleDeleteBase = async (id) => {
      if(!window.confirm("Are you sure? This might break referential integrity if not handled by DB.")) return;
       try {
        await api.delete(`/bases/${id}`);
        fetchData();
    } catch (err) {
       alert(err.response?.data?.error || 'Error deleting base');
    }
  }

  if (user.role !== 'admin') {
      return (
          <div className="flex items-center justify-center h-full text-destructive">
              Access Denied: Admin privileges required.
          </div>
      )
  }

  if (isLoading && bases.length === 0 && equipmentTypes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Loading admin data...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight flex items-center gap-3">
            <Shield size={32} className="text-primary" />
            Admin Command Center
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">Manage global configurations, bases, and equipment standards.</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-secondary/30 p-1 rounded-xl w-fit border border-white/5">
        <button
            onClick={() => setActiveTab('bases')}
            className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2",
                activeTab === 'bases' 
                    ? "bg-primary/20 text-primary shadow-sm" 
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
            )}
        >
            <Building2 size={16} />
            Bases & Outposts
        </button>
        <button
            onClick={() => setActiveTab('equipment')}
            className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2",
                activeTab === 'equipment' 
                    ? "bg-primary/20 text-primary shadow-sm" 
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
            )}
        >
            <Package size={16} />
            Equipment Registry
        </button>
      </div>

      {/* Bases Content */}
      {activeTab === 'bases' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex justify-end">
                <Button onClick={() => setShowBaseForm(!showBaseForm)} className="gap-2">
                    {showBaseForm ? <Loader2 className="animate-spin" size={16}/> : <Plus size={16} />}
                    {showBaseForm ? 'Cancel' : 'Add New Base'}
                </Button>
            </div>

            {showBaseForm && (
                <Card className="border-primary/20 bg-primary/5">
                    <CardHeader><CardTitle className="text-primary">New Outpost Configuration</CardTitle></CardHeader>
                    <CardContent>
                        <form onSubmit={handleCreateBase} className="flex gap-4 items-end">
                            <div className="flex-1">
                                <Input 
                                    label="Base Name" 
                                    placeholder="e.g. Outpost Omega" 
                                    value={baseForm.name}
                                    onChange={e => setBaseForm({...baseForm, name: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="flex-1">
                                <Input 
                                    label="Location" 
                                    icon={MapPin}
                                    placeholder="Coordinates or Region" 
                                    value={baseForm.location}
                                    onChange={e => setBaseForm({...baseForm, location: e.target.value})}
                                />
                            </div>
                            <Button type="submit">Deploy Base</Button>
                        </form>
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {bases.map(base => (
                    <Card key={base.id} className="hover:border-primary/30 transition-colors group">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex justify-between items-start">
                                <span>{base.name}</span>
                                <button 
                                    onClick={() => handleDeleteBase(base.id)}
                                    className="text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-sm text-muted-foreground flex items-center gap-2">
                                <MapPin size={14} />
                                {base.location || 'Unknown Location'}
                            </div>
                            <div className="mt-4 text-xs font-mono text-emerald-500/80 bg-emerald-500/10 px-2 py-1 rounded inline-block">
                                ID: {base.id}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
      )}

      {/* Equipment Content */}
      {activeTab === 'equipment' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
             <div className="flex justify-end">
                <Button onClick={() => setShowEquipForm(!showEquipForm)} className="gap-2">
                    <Plus size={16} />
                    {showEquipForm ? 'Cancel' : 'Register Equipment'}
                </Button>
            </div>

            {showEquipForm && (
                <Card className="border-primary/20 bg-primary/5">
                    <CardHeader><CardTitle className="text-primary">New Equipment Standard</CardTitle></CardHeader>
                    <CardContent>
                        <form onSubmit={handleCreateEquip} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                            <div className="md:col-span-2">
                                <Input 
                                    label="Name" 
                                    placeholder="e.g. M41A Pulse Rifle" 
                                    value={equipForm.name}
                                    onChange={e => setEquipForm({...equipForm, name: e.target.value})}
                                    required
                                />
                            </div>
                            <div>
                                <Select
                                    label="Category"
                                    value={equipForm.category}
                                    onChange={e => setEquipForm({...equipForm, category: e.target.value})}
                                    required
                                >
                                    <option value="">Select Category</option>
                                    <option value="Weapons">Weapons</option>
                                    <option value="Vehicles">Vehicles</option>
                                    <option value="Supplies">Supplies</option>
                                    <option value="Electronics">Electronics</option>
                                    <option value="Uniforms">Uniforms</option>
                                </Select>
                            </div>
                            <div>
                                <Input 
                                    label="Unit" 
                                    placeholder="e.g. pcs, kg, liters" 
                                    value={equipForm.unit}
                                    onChange={e => setEquipForm({...equipForm, unit: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="md:col-span-4 flex justify-end">
                                <Button type="submit">Register Item</Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-foreground">
                        <thead className="bg-muted/50 text-muted-foreground uppercase tracking-wider font-semibold text-xs border-b border-border">
                            <tr>
                                <th className="p-4">Name</th>
                                <th className="p-4">Category</th>
                                <th className="p-4">Unit</th>
                                <th className="p-4">ID</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                            {equipmentTypes.map(e => (
                                <tr key={e.id} className="hover:bg-muted/30 transition-colors">
                                    <td className="p-4 font-medium">{e.name}</td>
                                    <td className="p-4">
                                        <span className="px-2 py-1 bg-secondary rounded-md text-xs border border-white/5">
                                            {e.category}
                                        </span>
                                    </td>
                                    <td className="p-4 text-muted-foreground">{e.unit}</td>
                                    <td className="p-4 font-mono text-xs text-muted-foreground">{e.id}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
      )}
    </div>
  );
}

export default AdminPage;
