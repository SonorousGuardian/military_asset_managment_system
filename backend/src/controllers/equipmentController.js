const db = require('../config/db');

exports.getAllEquipmentTypes = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM equipment_types ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching equipment types' });
  }
};

exports.createEquipmentType = async (req, res) => {
  try {
    const { name, category, unit } = req.body;
    if (!name || !category || !unit) {
      return res.status(400).json({ error: 'Name, category, and unit are required' });
    }

    const result = await db.query(
      'INSERT INTO equipment_types (name, category, unit) VALUES ($1, $2, $3) RETURNING *',
      [name, category, unit]
    );

    if(req.audit) req.audit({ 
        action: 'CREATE', 
        entityType: 'EQUIPMENT_TYPE', 
        entityId: result.rows[0].id,
        newValues: result.rows[0]
    });

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error creating equipment type' });
  }
};
