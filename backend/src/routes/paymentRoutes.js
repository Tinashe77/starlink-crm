const express = require('express');
const { body } = require('express-validator');

const {
  getPayments,
  createPayment,
  settleContractBalance,
  getPaymentStatement,
  sendPaymentReminder,
} = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(protect);

router.get('/', authorize('Admin', 'Agent', 'Technician', 'Collections Officer', 'Customer'), getPayments);
router.get('/statement/:contractId', authorize('Admin', 'Agent', 'Technician', 'Collections Officer', 'Customer'), getPaymentStatement);

router.post(
  '/',
  authorize('Admin', 'Agent', 'Collections Officer'),
  [
    body('scheduleItem').notEmpty().withMessage('Installment is required'),
    body('amount').isFloat({ gt: 0 }).withMessage('Payment amount must be greater than 0'),
    body('paymentDate')
      .optional({ values: 'falsy' })
      .isISO8601()
      .withMessage('Payment date must be a valid date'),
    body('paymentMethod')
      .optional({ values: 'falsy' })
      .isIn(['EcoCash', 'Cash', 'Bank Transfer', 'Card', 'Other'])
      .withMessage('Invalid payment method'),
  ],
  validate,
  createPayment
);

router.post(
  '/settle/:contractId',
  authorize('Admin', 'Agent', 'Collections Officer'),
  [
    body('paymentDate')
      .optional({ values: 'falsy' })
      .isISO8601()
      .withMessage('Payment date must be a valid date'),
    body('paymentMethod')
      .optional({ values: 'falsy' })
      .isIn(['EcoCash', 'Cash', 'Bank Transfer', 'Card', 'Other'])
      .withMessage('Invalid payment method'),
    body('applyDiscount')
      .optional()
      .isBoolean()
      .withMessage('Apply discount must be true or false'),
  ],
  validate,
  settleContractBalance
);

router.post(
  '/remind/:contractId',
  authorize('Admin', 'Agent', 'Collections Officer'),
  sendPaymentReminder
);

module.exports = router;
