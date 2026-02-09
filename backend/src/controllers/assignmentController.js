const db = require('../config/db');

exports.createAssignment = async (req, res) => {
  const client = await db.pool.connect();
  try {
    const { base_id, equipment_type_id, assigned_to_user_id, type, notes } = req.body;
    const quantity = Number(req.body.quantity);
    // type: 'assigned' or 'expended'

    if (!base_id || !equipment_type_id || Number.isNaN(quantity) || quantity <= 0) {
      return res.status(400).json({ error: 'Invalid assignment payload.' });
    }

    // RBAC
    if (req.user.role !== 'admin' && req.user.base_id != base_id) {
          return res.status(403).json({ error: 'Access denied to assign/expend from this base.' });
    }

    if (!['assigned', 'expended'].includes(type)) {
        return res.status(400).json({ error: 'Invalid type. Must be assigned or expended.' });
    }

    await client.query('BEGIN');

    // Check Inventory
    const inventoryCheck = await client.query(
      'SELECT current_balance FROM inventory WHERE base_id = $1 AND equipment_type_id = $2 FOR UPDATE',
      [base_id, equipment_type_id]
    );

    if (inventoryCheck.rows.length === 0 || inventoryCheck.rows[0].current_balance < quantity) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Insufficient inventory.' });
    }

    // Decrement Inventory
    await client.query(
      'UPDATE inventory SET current_balance = current_balance - $1, last_updated = CURRENT_TIMESTAMP WHERE base_id = $2 AND equipment_type_id = $3',
      [quantity, base_id, equipment_type_id]
    );

    // Record Assignment
    const assignmentResult = await client.query(
      `INSERT INTO assignments (base_id, equipment_type_id, assigned_to_user_id, quantity, type, notes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [base_id, equipment_type_id, assigned_to_user_id || null, quantity, type, notes, req.user.id]
    );

    await client.query('COMMIT');

    if(req.audit) req.audit({ 
        action: `ASSET_${type.toUpperCase()}`, 
        entityType: 'ASSIGNMENT', 
        entityId: assignmentResult.rows[0].id,
        newValues: assignmentResult.rows[0]
    });

    res.status(201).json(assignmentResult.rows[0]);

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Assignment Error Details:', err);
    res.status(500).json({ error: 'Server error processing assignment' });
  } finally {
    client.release();
  }
};

exports.getAssignments = async (req, res) => {
  try {
    const { base_id, equipment_type_id, start_date, end_date } = req.query;

    let query = `
      SELECT a.*, b.name as base_name, e.name as equipment_name, u.username as assigned_to_username, c.username as created_by_username
      FROM assignments a
      JOIN bases b ON a.base_id = b.id
      JOIN equipment_types e ON a.equipment_type_id = e.id
      LEFT JOIN users u ON a.assigned_to_user_id = u.id
      LEFT JOIN users c ON a.created_by = c.id
      WHERE 1=1
    `;
    
    let queryParams = [];

    // RBAC
    if (req.user.role !== 'admin') {
      queryParams.push(req.user.base_id);
      query += ` AND a.base_id = $${queryParams.length}`;
    } else if (base_id) {
      queryParams.push(base_id);
      query += ` AND a.base_id = $${queryParams.length}`;
    }

    if (equipment_type_id) {
      queryParams.push(equipment_type_id);
      query += ` AND a.equipment_type_id = $${queryParams.length}`;
    }

    if (start_date) {
      queryParams.push(start_date);
      query += ` AND DATE(a.created_at) >= DATE($${queryParams.length})`;
    }

    if (end_date) {
      queryParams.push(end_date);
      query += ` AND DATE(a.created_at) <= DATE($${queryParams.length})`;
    }

    query += ' ORDER BY a.created_at DESC';

    const result = await db.query(query, queryParams);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching assignments' });
  }
};
