const express = require('express');
const router = express.Router();
const baseController = require('../controllers/baseController');
const authMiddleware = require('../middleware/authMiddleware');
const rbacMiddleware = require('../middleware/rbacMiddleware');
const auditMiddleware = require('../middleware/auditMiddleware');

router.use(authMiddleware);

// Public-ish or restricted list
router.get('/', baseController.getAllBases);

// Get specific base
router.get('/:id', baseController.getBaseById);

// Create Base (Admin only)
router.post('/', 
  rbacMiddleware(['admin']), 
  auditMiddleware('CREATE', 'BASE'),
  baseController.createBase
);

// Update Base (Admin only)
router.put('/:id', 
  rbacMiddleware(['admin']), 
  auditMiddleware('UPDATE', 'BASE'),
  baseController.updateBase
);

// Delete Base (Admin only)
router.delete('/:id', 
  rbacMiddleware(['admin']), 
  auditMiddleware('DELETE', 'BASE'),
  baseController.deleteBase
);

module.exports = router;
