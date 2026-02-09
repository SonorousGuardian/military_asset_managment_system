/* eslint-disable react-hooks/set-state-in-effect */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  ArrowRightLeft,
  Box,
  Package,
  Target,
  TrendingUp
} from 'lucide-react';
import api from '../services/api';
import FilterBar from '../components/FilterBar';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';

function Dashboard() {
  const MotionDiv = motion.div;

  const [bases, setBases] = useState([]);
  const [equipmentTypes, setEquipmentTypes] = useState([]);
  const [filters, setFilters] = useState({});
  const [showNetMovementDetails, setShowNetMovementDetails] = useState(false);
  const [metrics, setMetrics] = useState({
    summary: {
      opening_balance: 0,
      closing_balance: 0,
      net_movement: 0,
      assigned: 0,
      expended: 0
    },
    inventory: [],
    net_movement_breakdown: {
      purchases: 0,
      transfer_in: 0,
      transfer_out: 0
    }
  });

  const fetchMetadata = useCallback(async () => {
    try {
      const [basesRes, equipRes] = await Promise.all([
        api.get('/bases'),
        api.get('/equipment-types')
      ]);
      setBases(basesRes.data);
      setEquipmentTypes(equipRes.data);
    } catch (err) {
      console.error('Error fetching metadata', err);
    }
  }, []);

  const fetchMetrics = useCallback(async () => {
    try {
      const params = new URLSearchParams(filters).toString();
      const endpoint = params ? `/dashboard/metrics?${params}` : '/dashboard/metrics';
      const res = await api.get(endpoint);
      setMetrics(res.data);
    } catch (err) {
      console.error('Error fetching metrics', err);
    }
  }, [filters]);

  useEffect(() => {
    fetchMetadata();
  }, [fetchMetadata]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  const summaryCards = useMemo(
    () => [
      {
        key: 'opening',
        label: 'Opening Balance',
        value: metrics.summary.opening_balance,
        icon: Box
      },
      {
        key: 'closing',
        label: 'Closing Balance',
        value: metrics.summary.closing_balance,
        icon: Package
      },
      {
        key: 'net',
        label: 'Net Movement',
        value: metrics.summary.net_movement,
        icon: ArrowRightLeft
      },
      {
        key: 'assigned',
        label: 'Assigned',
        value: metrics.summary.assigned,
        icon: Target
      },
      {
        key: 'expended',
        label: 'Expended',
        value: metrics.summary.expended,
        icon: TrendingUp
      }
    ],
    [metrics.summary]
  );

  const formatNumber = (value) => Number(value || 0).toLocaleString();

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-foreground tracking-tight mb-2">Mission Control</h1>
          <p className="text-muted-foreground font-medium text-sm">
            Opening, closing, movement, assignment and expenditure visibility.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-primary text-sm font-medium">
          <Activity size={14} />
          <span>System Operational</span>
        </div>
      </div>

      <FilterBar
        filters={filters}
        setFilters={setFilters}
        bases={bases}
        equipmentTypes={equipmentTypes}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          const content = (
            <Card key={card.key} className="h-full">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                    {card.label}
                  </span>
                  <Icon size={18} className="text-primary" />
                </div>
                <p className="text-3xl font-bold">{formatNumber(card.value)}</p>
              </CardContent>
            </Card>
          );

          if (card.key !== 'net') {
            return content;
          }

          return (
            <button
              key={card.key}
              type="button"
              onClick={() => setShowNetMovementDetails(true)}
              className="text-left"
            >
              {content}
            </button>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Equipment Snapshot</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border/60 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="py-3 pr-4">Equipment</th>
                  <th className="py-3 pr-4">Opening</th>
                  <th className="py-3 pr-4">Closing</th>
                  <th className="py-3 pr-4">Net</th>
                  <th className="py-3 pr-4">Assigned</th>
                  <th className="py-3">Expended</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {metrics.inventory.map((item) => (
                  <tr key={item.equipment_type_id}>
                    <td className="py-3 pr-4 font-medium">{item.name}</td>
                    <td className="py-3 pr-4">{formatNumber(item.opening_balance)}</td>
                    <td className="py-3 pr-4">{formatNumber(item.closing_balance)}</td>
                    <td className="py-3 pr-4">{formatNumber(item.net_movement)}</td>
                    <td className="py-3 pr-4">{formatNumber(item.assigned)}</td>
                    <td className="py-3">{formatNumber(item.expended)}</td>
                  </tr>
                ))}
                {metrics.inventory.length === 0 && (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-muted-foreground">
                      No inventory records found for the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {showNetMovementDetails && (
        <MotionDiv
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <Card className="w-full max-w-xl">
            <CardHeader>
              <CardTitle>Net Movement Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span>Purchases</span>
                <span className="font-semibold">{formatNumber(metrics.net_movement_breakdown.purchases)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Transfer In</span>
                <span className="font-semibold">{formatNumber(metrics.net_movement_breakdown.transfer_in)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Transfer Out</span>
                <span className="font-semibold">{formatNumber(metrics.net_movement_breakdown.transfer_out)}</span>
              </div>
              <div className="pt-2 border-t border-border/60 flex items-center justify-between">
                <span className="font-medium">Net Movement</span>
                <span className="font-bold text-primary">
                  {formatNumber(metrics.summary.net_movement)}
                </span>
              </div>
              <div className="pt-4 flex justify-end">
                <Button variant="secondary" onClick={() => setShowNetMovementDetails(false)}>
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </MotionDiv>
      )}
    </div>
  );
}

export default Dashboard;
