const express = require('express');
const router = express.Router();
const assignmentController = require('../controllers/assignmentController');
const authMiddleware = require('../middleware/authMiddleware');
const rbacMiddleware = require('../middleware/rbacMiddleware');
const auditMiddleware = require('../middleware/auditMiddleware');

router.use(authMiddleware);

router.post('/', 
  rbacMiddleware(['admin', 'commander']), // Logistics user usually handles movement, maybe assignments too?
  // Let's stick strictly to plan: Admin/Commander
  auditMiddleware('ASSET_ACTION', 'ASSIGNMENT'),
  assignmentController.createAssignment
);

router.get('/', assignmentController.getAssignments);

module.exports = router;
