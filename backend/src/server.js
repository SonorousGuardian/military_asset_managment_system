const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

// Ensure DB connection initializes at startup.
require('./config/db');

const authRoutes = require('./routes/authRoutes');
const baseRoutes = require('./routes/baseRoutes');
const equipmentRoutes = require('./routes/equipmentRoutes');
const purchaseRoutes = require('./routes/purchaseRoutes');
const transferRoutes = require('./routes/transferRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/bases', baseRoutes);
app.use('/api/equipment-types', equipmentRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/transfers', transferRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.get('/', (req, res) => {
  res.send('Military Asset Management System API');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
