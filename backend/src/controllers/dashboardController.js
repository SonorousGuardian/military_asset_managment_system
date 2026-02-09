const db = require('../config/db');

exports.getMetrics = async (req, res) => {
  try {
    const { base_id, start_date, end_date, equipment_type_id } = req.query;
    const isAdmin = req.user.role === 'admin';

    const withDateRange = (alias, dateColumn, params, conditions) => {
      if (start_date) {
        params.push(start_date);
        conditions.push(`DATE(${alias}.${dateColumn}) >= DATE($${params.length})`);
      }
      if (end_date) {
        params.push(end_date);
        conditions.push(`DATE(${alias}.${dateColumn}) <= DATE($${params.length})`);
      }
    };

    const rowsToMap = (rows) => {
      const map = new Map();
      rows.forEach((row) => {
        map.set(Number(row.equipment_type_id), Number(row.qty || row.closing_balance || 0));
      });
      return map;
    };

    const getAggregatedRows = async (query, params) => {
      const result = await db.query(query, params);
      return result.rows;
    };

    // Closing balance (current snapshot).
    const inventoryParams = [];
    const inventoryWhere = [];

    if (!isAdmin) {
      inventoryParams.push(req.user.base_id);
      inventoryWhere.push(`i.base_id = $${inventoryParams.length}`);
    } else if (base_id) {
      inventoryParams.push(base_id);
      inventoryWhere.push(`i.base_id = $${inventoryParams.length}`);
    }

    if (equipment_type_id) {
      inventoryParams.push(equipment_type_id);
      inventoryWhere.push(`i.equipment_type_id = $${inventoryParams.length}`);
    }

    const inventoryQuery = `
      SELECT i.equipment_type_id, e.name, SUM(i.current_balance) AS closing_balance
      FROM inventory i
      JOIN equipment_types e ON i.equipment_type_id = e.id
      ${inventoryWhere.length ? `WHERE ${inventoryWhere.join(' AND ')}` : ''}
      GROUP BY i.equipment_type_id, e.name
    `;
    const inventoryRows = await getAggregatedRows(inventoryQuery, inventoryParams);

    // Purchases in period.
    const purchaseParams = [];
    const purchaseWhere = [];
    if (!isAdmin) {
      purchaseParams.push(req.user.base_id);
      purchaseWhere.push(`p.base_id = $${purchaseParams.length}`);
    } else if (base_id) {
      purchaseParams.push(base_id);
      purchaseWhere.push(`p.base_id = $${purchaseParams.length}`);
    }
    if (equipment_type_id) {
      purchaseParams.push(equipment_type_id);
      purchaseWhere.push(`p.equipment_type_id = $${purchaseParams.length}`);
    }
    withDateRange('p', 'purchase_date', purchaseParams, purchaseWhere);

    const purchaseRows = await getAggregatedRows(
      `SELECT p.equipment_type_id, SUM(p.quantity) AS qty
       FROM purchases p
       ${purchaseWhere.length ? `WHERE ${purchaseWhere.join(' AND ')}` : ''}
       GROUP BY p.equipment_type_id`,
      purchaseParams
    );

    // Transfers out in period (exclude cancelled since inventory is refunded).
    const transferOutParams = [];
    const transferOutWhere = [`t.status != 'cancelled'`];
    if (!isAdmin) {
      transferOutParams.push(req.user.base_id);
      transferOutWhere.push(`t.from_base_id = $${transferOutParams.length}`);
    } else if (base_id) {
      transferOutParams.push(base_id);
      transferOutWhere.push(`t.from_base_id = $${transferOutParams.length}`);
    }
    if (equipment_type_id) {
      transferOutParams.push(equipment_type_id);
      transferOutWhere.push(`t.equipment_type_id = $${transferOutParams.length}`);
    }
    withDateRange('t', 'created_at', transferOutParams, transferOutWhere);

    const transferOutRows = await getAggregatedRows(
      `SELECT t.equipment_type_id, SUM(t.quantity) AS qty
       FROM transfers t
       WHERE ${transferOutWhere.join(' AND ')}
       GROUP BY t.equipment_type_id`,
      transferOutParams
    );

    // Transfers in in period (only completed actually increase destination inventory).
    const transferInParams = [];
    const transferInWhere = [`t.status = 'completed'`];
    if (!isAdmin) {
      transferInParams.push(req.user.base_id);
      transferInWhere.push(`t.to_base_id = $${transferInParams.length}`);
    } else if (base_id) {
      transferInParams.push(base_id);
      transferInWhere.push(`t.to_base_id = $${transferInParams.length}`);
    }
    if (equipment_type_id) {
      transferInParams.push(equipment_type_id);
      transferInWhere.push(`t.equipment_type_id = $${transferInParams.length}`);
    }
    withDateRange('t', 'created_at', transferInParams, transferInWhere);

    const transferInRows = await getAggregatedRows(
      `SELECT t.equipment_type_id, SUM(t.quantity) AS qty
       FROM transfers t
       WHERE ${transferInWhere.join(' AND ')}
       GROUP BY t.equipment_type_id`,
      transferInParams
    );

    // Assignments in period.
    const assignmentParams = [];
    const assignmentWhere = [];
    if (!isAdmin) {
      assignmentParams.push(req.user.base_id);
      assignmentWhere.push(`a.base_id = $${assignmentParams.length}`);
    } else if (base_id) {
      assignmentParams.push(base_id);
      assignmentWhere.push(`a.base_id = $${assignmentParams.length}`);
    }
    if (equipment_type_id) {
      assignmentParams.push(equipment_type_id);
      assignmentWhere.push(`a.equipment_type_id = $${assignmentParams.length}`);
    }
    withDateRange('a', 'created_at', assignmentParams, assignmentWhere);

    const assignmentWhereClause = assignmentWhere.length ? ` AND ${assignmentWhere.join(' AND ')}` : '';

    const assignedRows = await getAggregatedRows(
      `SELECT a.equipment_type_id, SUM(a.quantity) AS qty
       FROM assignments a
       WHERE a.type = 'assigned' ${assignmentWhereClause}
       GROUP BY a.equipment_type_id`,
      assignmentParams
    );

    const expendedRows = await getAggregatedRows(
      `SELECT a.equipment_type_id, SUM(a.quantity) AS qty
       FROM assignments a
       WHERE a.type = 'expended' ${assignmentWhereClause}
       GROUP BY a.equipment_type_id`,
      assignmentParams
    );

    const inventoryMap = rowsToMap(inventoryRows);
    const purchaseMap = rowsToMap(purchaseRows);
    const transferInMap = rowsToMap(transferInRows);
    const transferOutMap = rowsToMap(transferOutRows);
    const assignedMap = rowsToMap(assignedRows);
    const expendedMap = rowsToMap(expendedRows);

    const equipmentNameMap = new Map();
    inventoryRows.forEach((row) => {
      equipmentNameMap.set(Number(row.equipment_type_id), row.name);
    });

    const allEquipmentIds = new Set([
      ...inventoryMap.keys(),
      ...purchaseMap.keys(),
      ...transferInMap.keys(),
      ...transferOutMap.keys(),
      ...assignedMap.keys(),
      ...expendedMap.keys()
    ]);

    if (allEquipmentIds.size > 0) {
      const ids = [...allEquipmentIds];
      const placeholders = ids.map((_, i) => `$${i + 1}`).join(',');
      const namesRes = await db.query(
        `SELECT id, name FROM equipment_types WHERE id IN (${placeholders})`,
        ids
      );
      namesRes.rows.forEach((row) => {
        equipmentNameMap.set(Number(row.id), row.name);
      });
    }

    const inventory = [...allEquipmentIds].sort((a, b) => a - b).map((id) => {
      const closingBalance = inventoryMap.get(id) || 0;
      const purchases = purchaseMap.get(id) || 0;
      const transferIn = transferInMap.get(id) || 0;
      const transferOut = transferOutMap.get(id) || 0;
      const assigned = assignedMap.get(id) || 0;
      const expended = expendedMap.get(id) || 0;
      const netMovement = purchases + transferIn - transferOut;
      const openingBalance = closingBalance - netMovement + assigned + expended;

      return {
        equipment_type_id: id,
        name: equipmentNameMap.get(id) || `Equipment ${id}`,
        opening_balance: openingBalance,
        closing_balance: closingBalance,
        net_movement: netMovement,
        purchases,
        transfer_in: transferIn,
        transfer_out: transferOut,
        assigned,
        expended
      };
    });

    const summary = inventory.reduce(
      (acc, item) => {
        acc.opening_balance += item.opening_balance;
        acc.closing_balance += item.closing_balance;
        acc.net_movement += item.net_movement;
        acc.assigned += item.assigned;
        acc.expended += item.expended;
        return acc;
      },
      {
        opening_balance: 0,
        closing_balance: 0,
        net_movement: 0,
        assigned: 0,
        expended: 0
      }
    );

    res.json({
      summary,
      inventory,
      net_movement_breakdown: {
        purchases: inventory.reduce((sum, item) => sum + item.purchases, 0),
        transfer_in: inventory.reduce((sum, item) => sum + item.transfer_in, 0),
        transfer_out: inventory.reduce((sum, item) => sum + item.transfer_out, 0)
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching metrics' });
  }
};
