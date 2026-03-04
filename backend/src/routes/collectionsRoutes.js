const express = require('express');
const { body } = require('express-validator');

const {
  getCollectionsOverview,
  processOverdueCollections,
  getReceiptByNumber,
  voidPayment,
} = require('../controllers/collectionsController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(protect);

router.get(
  '/overview',
  authorize('Admin', 'Agent', 'Collections Officer'),
  getCollectionsOverview
);

router.post(
  '/process-overdue',
  authorize('Admin', 'Agent', 'Collections Officer'),
  processOverdueCollections
);

router.get(
  '/receipt/:receiptNumber',
  authorize('Admin', 'Agent', 'Collections Officer'),
  getReceiptByNumber
);

router.post(
  '/payments/:id/void',
  authorize('Admin', 'Collections Officer'),
  [
    body('reason')
      .optional({ values: 'falsy' })
      .isLength({ max: 300 })
      .withMessage('Void reason must be 300 characters or fewer'),
  ],
  validate,
  voidPayment
);

module.exports = router;
