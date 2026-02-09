const express = require('express');
const router = express.Router();
const transferController = require('../controllers/transferController');
const authMiddleware = require('../middleware/authMiddleware');
const rbacMiddleware = require('../middleware/rbacMiddleware');
const auditMiddleware = require('../middleware/auditMiddleware');

router.use(authMiddleware);

// Initiate Transfer
router.post('/', 
  rbacMiddleware(['admin', 'commander', 'logistics']),
  auditMiddleware('TRANSFER_INIT', 'TRANSFER'),
  transferController.createTransfer
);

// Update Status (Complete/Cancel)
// Anyone with access can try, controller handles logic updates
router.patch('/:id/status', 
  rbacMiddleware(['admin', 'commander', 'logistics']),
  auditMiddleware('TRANSFER_STATUS', 'TRANSFER'),
  transferController.updateTransferStatus
);

router.get('/', transferController.getTransfers);

module.exports = router;
