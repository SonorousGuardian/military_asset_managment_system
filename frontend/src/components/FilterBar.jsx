import React from 'react';
import { cn } from '../utils/cn';
import { Filter, Calendar } from 'lucide-react';

function FilterBar({ filters, setFilters, bases, equipmentTypes, showDate = true }) {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const inputClasses = "w-full bg-secondary/50 border border-border text-foreground rounded-lg p-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none placeholder:text-muted-foreground/50 text-sm";
  const labelClasses = "block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider";

  return (
    <div className="bg-card/50 backdrop-blur-sm border border-border/50 p-5 rounded-xl mb-8 shadow-sm">
      <div className="flex items-center gap-2 mb-4 text-foreground font-semibold uppercase tracking-wider text-sm">
        <Filter size={16} />
        <span>Filters</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {bases && (
          <div>
            <label className={labelClasses}>Base</label>
            <select 
              name="base_id" 
              value={filters.base_id || ''} 
              onChange={handleChange}
              className={inputClasses}
            >
              <option value="">All Bases</option>
              {bases.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        )}

        {equipmentTypes && (
          <div>
            <label className={labelClasses}>Equipment Type</label>
            <select 
              name="equipment_type_id" 
              value={filters.equipment_type_id || ''} 
              onChange={handleChange}
              className={inputClasses}
            >
              <option value="">All Equipment</option>
              {equipmentTypes.map(e => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
          </div>
        )}

        {showDate && (
          <>
              <div>
                  <label className={labelClasses}>Start Date</label>
                  <div className="relative">
                    <Calendar size={16} className="absolute left-3 top-3 text-muted-foreground" />
                    <input 
                        type="date" 
                        name="start_date" 
                        value={filters.start_date || ''} 
                        onChange={handleChange}
                        className={cn(inputClasses, "pl-10")} 
                    />
                  </div>
              </div>
              <div>
                  <label className={labelClasses}>End Date</label>
                  <div className="relative">
                    <Calendar size={16} className="absolute left-3 top-3 text-muted-foreground" />
                    <input 
                        type="date" 
                        name="end_date" 
                        value={filters.end_date || ''} 
                        onChange={handleChange}
                        className={cn(inputClasses, "pl-10")} 
                    />
                  </div>
              </div>
          </>
        )}
      </div>
    </div>
  );
}

export default FilterBar;
