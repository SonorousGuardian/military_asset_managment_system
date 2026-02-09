const express = require('express');
const router = express.Router();
const equipmentController = require('../controllers/equipmentController');
const authMiddleware = require('../middleware/authMiddleware');
const rbacMiddleware = require('../middleware/rbacMiddleware');
const auditMiddleware = require('../middleware/auditMiddleware');

router.use(authMiddleware);

router.get('/', equipmentController.getAllEquipmentTypes);

// Admin only
router.post(
  '/',
  rbacMiddleware(['admin']),
  auditMiddleware('CREATE', 'EQUIPMENT_TYPE'),
  equipmentController.createEquipmentType
);

module.exports = router;
