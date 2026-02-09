import React, { useCallback, useEffect, useState } from 'react';
import api from '../services/api';
import FilterBar from '../components/FilterBar';
import { useAuth } from '../context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Plus, X, ClipboardList, Loader2 } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { cn } from '../utils/cn';

function AssignmentsPage() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [bases, setBases] = useState([]);
  const [equipmentTypes, setEquipmentTypes] = useState([]);
  const [filters, setFilters] = useState({});
  const [showForm, setShowForm] = useState(false);
  
  const [formData, setFormData] = useState({
    base_id: user.base_id || '',
    equipment_type_id: '',
    assigned_to_user_id: '', 
    quantity: '',
    type: 'assigned',
    notes: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    if (!formData.base_id) newErrors.base_id = "Base is required";
    if (!formData.equipment_type_id) newErrors.equipment_type_id = "Equipment type is required";
    if (!formData.quantity || formData.quantity <= 0) newErrors.quantity = "Quantity must be greater than 0";
    if (!formData.notes) newErrors.notes = "Notes/Personnel name is required";
    
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

  const fetchAssignments = useCallback(async () => {
    try {
      const params = new URLSearchParams(filters).toString();
      const res = await api.get(`/assignments?${params}`);
      setAssignments(res.data);
    } catch (err) {
      console.error(err);
    }
  }, [filters]);

  useEffect(() => {
    fetchMetadata();
  }, [fetchMetadata]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await api.post('/assignments', formData);
      setShowForm(false);
      fetchAssignments();
      setFormData(prev => ({ 
        ...prev, 
        equipment_type_id: '', 
        quantity: '', 
        notes: '' 
      }));
      setErrors({});
    } catch (err) {
      alert(err.response?.data?.error || 'Error processing assignment');
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Assignments & Expenditures</h1>
            <p className="text-muted-foreground mt-1 text-sm">Track asset distribution and consumption.</p>
        </div>
        <Button 
          onClick={() => setShowForm(!showForm)}
          variant={showForm ? "secondary" : "primary"}
          className="gap-2"
        >
          {showForm ? <X size={18} /> : <Plus size={18} />}
          {showForm ? 'Cancel' : 'New Record'}
        </Button>
      </div>

      {showForm && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-primary flex items-center gap-2">
                <ClipboardList size={20} />
                Record Assignment / Expenditure
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                     <Select
                        label="Base"
                        name="base_id" 
                        value={formData.base_id} 
                        onChange={(e) => {
                            handleInputChange(e);
                            if(errors.base_id) setErrors({...errors, base_id: null});
                        }}
                        disabled={user.role !== 'admin' && user.base_id}
                        error={errors.base_id}
                    >
                        <option value="">Select Base</option>
                        {bases.map(b => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                    </Select>
                </div>

                <div>
                     <Select
                        label="Type"
                        name="type" 
                        value={formData.type} 
                        onChange={handleInputChange} 
                    >
                        <option value="assigned">Assign to Personnel</option>
                        <option value="expended">Expend/Consume</option>
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
                        label="Notes / Assigned To"
                        name="notes" 
                        value={formData.notes} 
                        onChange={(e) => {
                             handleInputChange(e);
                             if(errors.notes) setErrors({...errors, notes: null});
                        }}
                        placeholder="Enter personnel name or reason"
                        error={errors.notes}
                    />
                </div>

                <div className="md:col-span-2 flex justify-end">
                    <Button type="submit" className="w-full md:w-auto" disabled={isLoading}>
                         {isLoading ? (
                            <>
                                <Loader2 size={16} className="animate-spin mr-2" />
                                Submitting...
                            </>
                        ) : 'Submit Record'}
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
                            <th className="p-4">Base</th>
                            <th className="p-4">Type</th>
                            <th className="p-4">Item</th>
                            <th className="p-4 text-center">Qty</th>
                            <th className="p-4">Notes</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                        {assignments.map(a => (
                            <tr key={a.id} className="hover:bg-muted/30 transition-colors">
                                <td className="p-4 whitespace-nowrap text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</td>
                                <td className="p-4 whitespace-nowrap">{a.base_name}</td>
                                <td className="p-4 whitespace-nowrap">
                                    <span className={cn(
                                        "px-2.5 py-1 rounded-full text-xs font-semibold border",
                                        a.type === 'assigned' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                                    )}>
                                        {a.type.toUpperCase()}
                                    </span>
                                </td>
                                <td className="p-4 whitespace-nowrap font-medium">{a.equipment_name}</td>
                                <td className="p-4 whitespace-nowrap text-center font-bold text-destructive bg-destructive/10 rounded-full px-2 py-1">-{a.quantity}</td>
                                <td className="p-4 whitespace-nowrap text-muted-foreground">{a.notes}</td>
                            </tr>
                        ))}
                        {assignments.length === 0 && (
                            <tr>
                                <td colSpan="6" className="p-8 text-center text-muted-foreground italic">No assignments found.</td>
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

export default AssignmentsPage;
