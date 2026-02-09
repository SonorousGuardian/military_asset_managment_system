const db = require('../config/db');

exports.createPurchase = async (req, res) => {
  const client = await db.pool.connect();
  try {
    const { base_id, equipment_type_id, supplier, notes, purchase_date } = req.body;
    const quantity = Number(req.body.quantity);
    
    // Validations
    if (!base_id || !equipment_type_id || Number.isNaN(quantity) || quantity <= 0) {
      return res.status(400).json({ error: 'Invalid purchase data' });
    }

    // RBAC: Check if user can purchase for this base
    if (req.user.role !== 'admin' && req.user.base_id != base_id) {
          return res.status(403).json({ error: 'Access denied to purchase for this base.' });
    }

    await client.query('BEGIN');

    // 1. Record Purchase
    const purchaseResult = await client.query(
      `INSERT INTO purchases (base_id, equipment_type_id, quantity, supplier, notes, purchase_date, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [base_id, equipment_type_id, quantity, supplier, notes, purchase_date || new Date(), req.user.id]
    );

    // 2. Update Inventory (Upsert)
    // Check existence
    const inventoryCheck = await client.query(
      'SELECT * FROM inventory WHERE base_id = $1 AND equipment_type_id = $2',
      [base_id, equipment_type_id]
    );

    if (inventoryCheck.rows.length === 0) {
      await client.query(
        'INSERT INTO inventory (base_id, equipment_type_id, current_balance) VALUES ($1, $2, $3)',
        [base_id, equipment_type_id, quantity]
      );
    } else {
      await client.query(
        'UPDATE inventory SET current_balance = current_balance + $1, last_updated = CURRENT_TIMESTAMP WHERE base_id = $2 AND equipment_type_id = $3',
        [quantity, base_id, equipment_type_id]
      );
    }

    await client.query('COMMIT');

    // Audit (outside transaction for simplicity, or could be inside)
    if(req.audit) req.audit({ 
        action: 'PURCHASE', 
        entityType: 'PURCHASE', 
        entityId: purchaseResult.rows[0].id,
        newValues: purchaseResult.rows[0]
    });

    res.status(201).json(purchaseResult.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Server error processing purchase' });
  } finally {
    client.release();
  }
};

exports.getPurchases = async (req, res) => {
  try {
    const { base_id, start_date, end_date, equipment_type_id } = req.query;
    
    // RBAC Filtering
    let queryParams = [];
    let query = `
      SELECT p.*, b.name as base_name, e.name as equipment_name, u.username as created_by_username
      FROM purchases p
      JOIN bases b ON p.base_id = b.id
      JOIN equipment_types e ON p.equipment_type_id = e.id
      LEFT JOIN users u ON p.created_by = u.id
      WHERE 1=1
    `;

    // Role restrictions
    if (req.user.role !== 'admin') {
      queryParams.push(req.user.base_id);
      query += ` AND p.base_id = $${queryParams.length}`;
    } else if (base_id) {
        queryParams.push(base_id);
        query += ` AND p.base_id = $${queryParams.length}`;
    }

    if (equipment_type_id) {
      queryParams.push(equipment_type_id);
      query += ` AND p.equipment_type_id = $${queryParams.length}`;
    }

    if (start_date) {
      queryParams.push(start_date);
      query += ` AND DATE(p.purchase_date) >= DATE($${queryParams.length})`;
    }

    if (end_date) {
      queryParams.push(end_date);
      query += ` AND DATE(p.purchase_date) <= DATE($${queryParams.length})`;
    }

    query += ' ORDER BY p.purchase_date DESC, p.created_at DESC';

    const result = await db.query(query, queryParams);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching purchases' });
  }
};
