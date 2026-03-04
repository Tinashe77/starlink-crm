const express = require('express');
const { body } = require('express-validator');

const { getSettings, updateSettings } = require('../controllers/settingController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(protect);

router.get('/', getSettings);

router.put(
  '/',
  authorize('Admin'),
  [
    body('lateFeeAmount')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Late fee amount must be 0 or greater'),
    body('gracePeriodDays')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Grace period days must be 0 or greater'),
    body('earlySettlementDiscountPercent')
      .optional()
      .isFloat({ min: 0, max: 100 })
      .withMessage('Early settlement discount must be between 0 and 100'),
    body('ecocashMerchantCode')
      .optional()
      .isString()
      .withMessage('EcoCash merchant code must be text'),
  ],
  validate,
  updateSettings
);

module.exports = router;
