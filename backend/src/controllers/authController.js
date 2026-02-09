const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

exports.register = async (req, res) => {
  const { username, password, role, base_id } = req.body;

  try {
    // Basic validation
    if (!username || !password || !role) {
      return res.status(400).json({ error: 'Please provide username, password, and role.' });
    }

    // Check if user exists
    const userCheck = await db.query('SELECT * FROM users WHERE username = $1', [username]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Username already exists.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const newUser = await db.query(
      'INSERT INTO users (username, password_hash, role, base_id) VALUES ($1, $2, $3, $4) RETURNING id, username, role, base_id',
      [username, hashedPassword, role, base_id || null]
    );

    res.status(201).json({ message: 'User registered successfully', user: newUser.rows[0] });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during registration.' });
  }
};

exports.login = async (req, res) => {
  const { username, password } = req.body;

  try {
    // Check if user exists
    const result = await db.query('SELECT * FROM users WHERE username = $1', [username]);
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid credentials.' });
    }

    const user = result.rows[0];

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials.' });
    }

    // Generate JWT
    const payload = {
      id: user.id,
      username: user.username,
      role: user.role,
      base_id: user.base_id
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });

    res.json({ token, user: payload });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during login.' });
  }
};
