const db = require('../config/db');

// Initiate Transfer: Decrement source base inventory immediately
exports.createTransfer = async (req, res) => {
  const client = await db.pool.connect();
  try {
    const { from_base_id, to_base_id, equipment_type_id, notes } = req.body;
    const quantity = Number(req.body.quantity);

    if (!from_base_id || !to_base_id || !equipment_type_id || Number.isNaN(quantity) || quantity <= 0) {
      return res.status(400).json({ error: 'Invalid transfer payload.' });
    }

    // RBAC: Can user transfer FROM this base?
    if (req.user.role !== 'admin' && req.user.base_id != from_base_id) {
          return res.status(403).json({ error: 'Access denied to initiate transfer from this base.' });
    }
    
    // Prevent transfer to same base
    if (from_base_id == to_base_id) {
        return res.status(400).json({ error: 'Cannot transfer to the same base.' });
    }

    await client.query('BEGIN');

    // Check Inventory at Source
    const inventoryCheck = await client.query(
      'SELECT current_balance FROM inventory WHERE base_id = $1 AND equipment_type_id = $2 FOR UPDATE',
      [from_base_id, equipment_type_id]
    );

    if (inventoryCheck.rows.length === 0 || inventoryCheck.rows[0].current_balance < quantity) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Insufficient inventory at source base.' });
    }

    // Decrement Source Inventory
    await client.query(
          'UPDATE inventory SET current_balance = current_balance - $1, last_updated = CURRENT_TIMESTAMP WHERE base_id = $2 AND equipment_type_id = $3',
      [quantity, from_base_id, equipment_type_id]
    );

    // Create Transfer Record
    const transferResult = await client.query(
      `INSERT INTO transfers (from_base_id, to_base_id, equipment_type_id, quantity, status, notes, created_by)
       VALUES ($1, $2, $3, $4, 'pending', $5, $6) RETURNING *`,
      [from_base_id, to_base_id, equipment_type_id, quantity, notes, req.user.id]
    );

    await client.query('COMMIT');

    if(req.audit) req.audit({ 
        action: 'TRANSFER_INIT', 
        entityType: 'TRANSFER', 
        entityId: transferResult.rows[0].id,
        newValues: transferResult.rows[0]
    });

    res.status(201).json(transferResult.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Server error initiating transfer' });
  } finally {
    client.release();
  }
};

// Update Status: specific logic for completed/cancelled
exports.updateTransferStatus = async (req, res) => {
  const client = await db.pool.connect();
  const { id } = req.params;
  const { status } = req.body; // 'completed' or 'cancelled'

  if (!['completed', 'cancelled'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status update.' });
  }

  try {
    await client.query('BEGIN');

    // Get Transfer details
    const transferRes = await client.query('SELECT * FROM transfers WHERE id = $1 FOR UPDATE', [id]);
    if (transferRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Transfer not found.' });
    }

    const transfer = transferRes.rows[0];

    // RBAC: Who can finalize? 
    // Usually logic: Dest base commander checks items and "completes" (receives). 
    // Source base commander or admin can "cancel" if pending.
    // Simplifying: Admin can do anything. Dest Commander can Complete. Source Commander can Cancel.
    
    if (transfer.status !== 'pending') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Transfer is not pending.' });
    }

    if (status === 'completed') {
        if (req.user.role !== 'admin' && req.user.base_id != transfer.to_base_id) {
          await client.query('ROLLBACK');
          return res.status(403).json({ error: 'Only destination base or admin can complete this transfer.' });
        }

        // Increment Destination Inventory (Upsert)
        const destCheck = await client.query(
          'SELECT 1 FROM inventory WHERE base_id = $1 AND equipment_type_id = $2',
          [transfer.to_base_id, transfer.equipment_type_id]
        );

        if (destCheck.rows.length === 0) {
          await client.query(
            'INSERT INTO inventory (base_id, equipment_type_id, current_balance) VALUES ($1, $2, $3)',
            [transfer.to_base_id, transfer.equipment_type_id, transfer.quantity]
          );
        } else {
          await client.query(
            'UPDATE inventory SET current_balance = current_balance + $1, last_updated = CURRENT_TIMESTAMP WHERE base_id = $2 AND equipment_type_id = $3',
            [transfer.quantity, transfer.to_base_id, transfer.equipment_type_id]
          );
        }
    } else if (status === 'cancelled') {
        if (req.user.role !== 'admin' && req.user.base_id != transfer.from_base_id) {
          await client.query('ROLLBACK');
          return res.status(403).json({ error: 'Only source base or admin can cancel this transfer.' });
        }

        // Refund Source Inventory
        await client.query(
          'UPDATE inventory SET current_balance = current_balance + $1, last_updated = CURRENT_TIMESTAMP WHERE base_id = $2 AND equipment_type_id = $3',
          [transfer.quantity, transfer.from_base_id, transfer.equipment_type_id]
        );
    }

    // Update Transfer Status
    const updateRes = await client.query(
      'UPDATE transfers SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );

    await client.query('COMMIT');
    
    if(req.audit) req.audit({ 
        action: `TRANSFER_${status.toUpperCase()}`, 
        entityType: 'TRANSFER', 
        entityId: id,
        newValues: updateRes.rows[0],
        oldValues: transfer
    });

    res.json(updateRes.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Server error updating transfer' });
  } finally {
    client.release();
  }
};

exports.getTransfers = async (req, res) => {
  try {
    const { base_id, equipment_type_id, start_date, end_date } = req.query; // Filter by base (either source or dest)

    let query = `
      SELECT t.*, 
             fb.name as from_base_name, 
             tb.name as to_base_name, 
             e.name as equipment_name,
             u.username as created_by_username
      FROM transfers t
      JOIN bases fb ON t.from_base_id = fb.id
      JOIN bases tb ON t.to_base_id = tb.id
      JOIN equipment_types e ON t.equipment_type_id = e.id
      LEFT JOIN users u ON t.created_by = u.id
      WHERE 1=1
    `;
    
    let queryParams = [];

    // RBAC
    if (req.user.role !== 'admin') {
      queryParams.push(req.user.base_id);
      // Show if my base is source OR dest
      query += ` AND (t.from_base_id = $${queryParams.length} OR t.to_base_id = $${queryParams.length})`;
    } else if (base_id) {
         queryParams.push(base_id);
         query += ` AND (t.from_base_id = $${queryParams.length} OR t.to_base_id = $${queryParams.length})`;
    }

    if (equipment_type_id) {
      queryParams.push(equipment_type_id);
      query += ` AND t.equipment_type_id = $${queryParams.length}`;
    }

    if (start_date) {
      queryParams.push(start_date);
      query += ` AND DATE(t.created_at) >= DATE($${queryParams.length})`;
    }

    if (end_date) {
      queryParams.push(end_date);
      query += ` AND DATE(t.created_at) <= DATE($${queryParams.length})`;
    }

    query += ' ORDER BY t.created_at DESC';

    const result = await db.query(query, queryParams);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching transfers' });
  }
};
