const express = require('express');
const { body } = require('express-validator');

const {
  getSupportTickets,
  getSupportTicketOptions,
  createSupportTicket,
  updateSupportTicket,
} = require('../controllers/supportTicketController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(protect);

router.get('/', authorize('Admin', 'Agent', 'Technician', 'Customer'), getSupportTickets);
router.get('/options', authorize('Admin', 'Agent', 'Customer'), getSupportTicketOptions);

router.post(
  '/',
  authorize('Admin', 'Agent', 'Customer'),
  [
    body('contract').notEmpty().withMessage('Contract is required'),
    body('category')
      .isIn(['Query', 'Complaint', 'Technical Support', 'Billing'])
      .withMessage('Invalid ticket category'),
    body('subject').notEmpty().withMessage('Subject is required'),
    body('description').notEmpty().withMessage('Description is required'),
    body('priority')
      .optional()
      .isIn(['Normal', 'Urgent'])
      .withMessage('Invalid ticket priority'),
  ],
  validate,
  createSupportTicket
);

router.put(
  '/:id',
  authorize('Admin', 'Agent', 'Technician', 'Customer'),
  [
    body('status')
      .optional()
      .isIn(['Open', 'Assigned', 'In Progress', 'Resolved', 'Closed'])
      .withMessage('Invalid ticket status'),
    body('priority')
      .optional()
      .isIn(['Normal', 'Urgent'])
      .withMessage('Invalid ticket priority'),
    body('message')
      .optional()
      .isString()
      .withMessage('Ticket response must be text'),
  ],
  validate,
  updateSupportTicket
);

module.exports = router;
