const express = require('express');
const router = express.Router();
const purchaseController = require('../controllers/purchaseController');
const authMiddleware = require('../middleware/authMiddleware');
const rbacMiddleware = require('../middleware/rbacMiddleware');
const auditMiddleware = require('../middleware/auditMiddleware');

router.use(authMiddleware);

// Create Purchase (Admin, Commander, Logistics)
// Note: Middleware checks generally if role is allowed, controller checks specific base access
router.post('/', 
  rbacMiddleware(['admin', 'commander', 'logistics']), 
  auditMiddleware('PURCHASE', 'PURCHASE'),
  purchaseController.createPurchase
);

router.get('/', purchaseController.getPurchases);

module.exports = router;
