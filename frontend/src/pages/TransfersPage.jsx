import React, { useCallback, useEffect, useState } from 'react';
import api from '../services/api';
import FilterBar from '../components/FilterBar';
import { useAuth } from '../context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Plus, X, ArrowLeftRight, Check, XCircle, Loader2 } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { cn } from '../utils/cn';

function TransfersPage() {
  const { user } = useAuth();
  const [transfers, setTransfers] = useState([]);
  const [bases, setBases] = useState([]);
  const [equipmentTypes, setEquipmentTypes] = useState([]);
  const [filters, setFilters] = useState({});
  const [showForm, setShowForm] = useState(false);
  
  const [formData, setFormData] = useState({
    from_base_id: user.base_id || '',
    to_base_id: '',
    equipment_type_id: '',
    quantity: '',
    notes: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    if (!formData.from_base_id) newErrors.from_base_id = "Origin base is required";
    if (!formData.to_base_id) newErrors.to_base_id = "Destination base is required";
    if (formData.from_base_id === formData.to_base_id) newErrors.to_base_id = "Cannot transfer to the same base";
    if (!formData.equipment_type_id) newErrors.equipment_type_id = "Equipment type is required";
    if (!formData.quantity || formData.quantity <= 0) newErrors.quantity = "Quantity must be greater than 0";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const fetchMetadata = useCallback(async () => {
    try {
        const [basesRes, equipRes] = await Promise.all([
            api.get('/bases'),
            api.get('/equipment-types')
        ]);
        setBases(basesRes.data);
        setEquipmentTypes(equipRes.data);
    } catch (err) {
        console.error(err);
    }
  }, []);

  const fetchTransfers = useCallback(async () => {
    try {
      const params = new URLSearchParams(filters).toString();
      const res = await api.get(`/transfers?${params}`);
      setTransfers(res.data);
    } catch (err) {
      console.error(err);
    }
  }, [filters]);

  useEffect(() => {
    fetchMetadata();
  }, [fetchMetadata]);

  useEffect(() => {
    fetchTransfers();
  }, [fetchTransfers]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await api.post('/transfers', formData);
      setShowForm(false);
      fetchTransfers();
      setFormData(prev => ({ 
        ...prev, 
        to_base_id: '',
        equipment_type_id: '', 
        quantity: '', 
        notes: '' 
      }));
      setErrors({});
    } catch (err) {
      alert(err.response?.data?.error || 'Error initiating transfer');
    } finally {
        setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    if(!window.confirm(`Are you sure you want to mark this transfer as ${status}?`)) return;
    try {
        await api.patch(`/transfers/${id}/status`, { status });
        fetchTransfers();
    } catch (err) {
        alert(err.response?.data?.error || 'Error updating status');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Transfers</h1>
            <p className="text-muted-foreground mt-1 text-sm">Manage asset movements between bases.</p>
        </div>
        <Button 
          onClick={() => setShowForm(!showForm)}
          variant={showForm ? "secondary" : "primary"}
          className="gap-2"
        >
          {showForm ? <X size={18} /> : <Plus size={18} />}
          {showForm ? 'Cancel' : 'New Transfer'}
        </Button>
      </div>

      {showForm && (
        <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
                <CardTitle className="text-primary flex items-center gap-2">
                    <ArrowLeftRight size={20} />
                    Initiate Transfer
                </CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <Select
                            label="From Base"
                            name="from_base_id" 
                            value={formData.from_base_id} 
                            onChange={(e) => {
                                handleInputChange(e);
                                if(errors.from_base_id) setErrors({...errors, from_base_id: null});
                            }}
                            disabled={user.role !== 'admin' && user.base_id}
                            error={errors.from_base_id}
                        >
                            <option value="">Select Base</option>
                            {bases.map(b => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                        </Select>
                    </div>

                    <div>
                        <Select
                            label="To Base"
                            name="to_base_id" 
                            value={formData.to_base_id} 
                            onChange={(e) => {
                                handleInputChange(e);
                                if(errors.to_base_id) setErrors({...errors, to_base_id: null});
                            }}
                            error={errors.to_base_id}
                        >
                            <option value="">Select Base</option>
                            {bases.map(b => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                        </Select>
                    </div>
                    
                    <div>
                         <Select
                            label="Equipment Type"
                            name="equipment_type_id" 
                            value={formData.equipment_type_id} 
                            onChange={(e) => {
                                handleInputChange(e);
                                if(errors.equipment_type_id) setErrors({...errors, equipment_type_id: null});
                            }}
                            error={errors.equipment_type_id}
                        >
                            <option value="">Select Equipment</option>
                            {equipmentTypes.map(e => (
                                <option key={e.id} value={e.id}>{e.name} ({e.unit})</option>
                            ))}
                        </Select>
                    </div>

                    <div>
                        <Input 
                            label="Quantity"
                            type="number" 
                            name="quantity" 
                            value={formData.quantity} 
                            onChange={(e) => {
                                handleInputChange(e);
                                if(errors.quantity) setErrors({...errors, quantity: null});
                            }}
                            min="1"
                            placeholder="0"
                            error={errors.quantity}
                        />
                    </div>

                    <div className="md:col-span-2">
                        <Input 
                            label="Notes"
                            name="notes" 
                            value={formData.notes} 
                            onChange={handleInputChange} 
                            placeholder="Reason for transfer..."
                        />
                    </div>

                    <div className="md:col-span-2 flex justify-end">
                        <Button type="submit" variant="primary" className="bg-teal-600 hover:bg-teal-700 w-full md:w-auto" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 size={16} className="animate-spin mr-2" />
                                    Initiating...
                                </>
                            ) : 'Initiate Transfer'}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
      )}
      
      <div className="space-y-4">
        <FilterBar 
            filters={filters} 
            setFilters={setFilters} 
            bases={bases} 
            equipmentTypes={equipmentTypes} 
        />

        <Card>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-foreground">
                    <thead className="bg-muted/50 text-muted-foreground uppercase tracking-wider font-semibold text-xs border-b border-border">
                        <tr>
                            <th className="p-4">Date</th>
                            <th className="p-4">From</th>
                            <th className="p-4">To</th>
                            <th className="p-4">Item</th>
                            <th className="p-4 text-center">Qty</th>
                            <th className="p-4">Status</th>
                            <th className="p-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                        {transfers.map(t => (
                            <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                                <td className="p-4 whitespace-nowrap text-muted-foreground">{new Date(t.created_at).toLocaleDateString()}</td>
                                <td className="p-4 whitespace-nowrap">{t.from_base_name}</td>
                                <td className="p-4 whitespace-nowrap">{t.to_base_name}</td>
                                <td className="p-4 whitespace-nowrap font-medium">{t.equipment_name}</td>
                                <td className="p-4 whitespace-nowrap text-center font-bold text-blue-400">{t.quantity}</td>
                                <td className="p-4 whitespace-nowrap">
                                    <span className={cn(
                                        "px-2.5 py-1 rounded-full text-xs font-semibold border",
                                        t.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                                        t.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 
                                        'bg-destructive/10 text-destructive-foreground border-destructive/20'
                                    )}>
                                        {t.status.toUpperCase()}
                                    </span>
                                </td>
                                <td className="p-4 whitespace-nowrap">
                                    {t.status === 'pending' && (
                                        <div className="flex gap-2">
                                            {(user.role === 'admin' || user.base_id == t.to_base_id) && (
                                                <Button 
                                                    size="sm"
                                                    onClick={() => handleStatusUpdate(t.id, 'completed')}
                                                    className="h-8 px-2 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-transparent shadow-none"
                                                >
                                                    <Check size={14} className="mr-1" /> Accept
                                                </Button>
                                            )}
                                            {(user.role === 'admin' || user.base_id == t.from_base_id) && (
                                                <Button 
                                                    size="sm"
                                                    onClick={() => handleStatusUpdate(t.id, 'cancelled')}
                                                    className="h-8 px-2 bg-destructive/10 text-destructive-foreground hover:bg-destructive/20 border-transparent shadow-none"
                                                >
                                                    <XCircle size={14} className="mr-1" /> Cancel
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {transfers.length === 0 && (
                            <tr>
                                <td colSpan="7" className="p-8 text-center text-muted-foreground italic">No transfers found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </Card>
      </div>
    </div>
  );
}

export default TransfersPage;
