const db = require('../config/db');

exports.getAllBases = async (req, res) => {
  try {
    // If Admin, return all. If Commander/Logistics, return their assigned base?
    // Requirement says Admin has full access. Commander access to their base.
    // We can filter here or in the route middleware.
    // For now, let's return all, but we might want to restrict for non-admins if they shouldn't see others.
    
    let query = 'SELECT * FROM bases ORDER BY name';
    const result = await db.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching bases' });
  }
};

exports.getBaseById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // RBAC check: if not admin, user can only view their own base
    if (req.user.role !== 'admin' && req.user.base_id != id) {
      return res.status(403).json({ error: 'Access denied to this base.' });
    }

    const result = await db.query('SELECT * FROM bases WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Base not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching base' });
  }
};

exports.createBase = async (req, res) => {
  try {
    const { name, location } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    const result = await db.query(
      'INSERT INTO bases (name, location) VALUES ($1, $2) RETURNING *',
      [name, location]
    );
    
    // Log audit
    if(req.audit) req.audit({ 
        action: 'CREATE', 
        entityType: 'BASE', 
        entityId: result.rows[0].id,
        newValues: result.rows[0]
    });

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error creating base' });
  }
};

exports.updateBase = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, location } = req.body;
    const existing = await db.query('SELECT * FROM bases WHERE id = $1', [id]);

    if (existing.rows.length === 0) return res.status(404).json({ error: 'Base not found' });

    const result = await db.query(
      'UPDATE bases SET name = COALESCE($1, name), location = COALESCE($2, location) WHERE id = $3 RETURNING *',
      [name, location, id]
    );

    if (req.audit) {
      req.audit({
        entityId: result.rows[0].id,
        oldValues: existing.rows[0],
        newValues: result.rows[0]
      });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error updating base' });
  }
};

exports.deleteBase = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('DELETE FROM bases WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) return res.status(404).json({ error: 'Base not found' });
    
    if (req.audit) {
      req.audit({
        entityId: result.rows[0].id,
        oldValues: result.rows[0]
      });
    }

    res.json({ message: 'Base deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error deleting base' });
  }
};
