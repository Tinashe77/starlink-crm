const express = require('express');
const { body } = require('express-validator');

const {
  getPaymentSchedule,
  generatePaymentSchedule,
  updatePaymentScheduleItem,
} = require('../controllers/paymentPlanController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(protect);

router.get('/', authorize('Admin', 'Agent', 'Collections Officer', 'Customer'), getPaymentSchedule);

router.post(
  '/generate',
  authorize('Admin', 'Agent', 'Collections Officer'),
  [
    body('contract').notEmpty().withMessage('Contract is required'),
    body('startDate')
      .optional({ values: 'falsy' })
      .isISO8601()
      .withMessage('Start date must be a valid date'),
  ],
  validate,
  generatePaymentSchedule
);

router.put(
  '/:id',
  authorize('Admin', 'Agent', 'Collections Officer'),
  [
    body('status')
      .optional()
      .isIn(['Pending', 'Paid', 'Late', 'Defaulted'])
      .withMessage('Invalid installment status'),
    body('amountDue')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Amount due must be 0 or greater'),
    body('amountPaid')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Amount paid must be 0 or greater'),
    body('dueDate')
      .optional({ values: 'falsy' })
      .isISO8601()
      .withMessage('Due date must be a valid date'),
  ],
  validate,
  updatePaymentScheduleItem
);

module.exports = router;
