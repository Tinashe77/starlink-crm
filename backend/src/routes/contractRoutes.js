const express = require('express');
const { body } = require('express-validator');

const {
  getContracts,
  getContractById,
  createContract,
  updateContract,
  signContract,
} = require('../controllers/contractController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

const contractStatuses = ['Pending Deposit', 'Active', 'In Arrears', 'Default', 'Completed'];

router.use(protect);

router.get('/', authorize('Admin', 'Agent', 'Collections Officer', 'Customer'), getContracts);
router.get('/:id', authorize('Admin', 'Agent', 'Collections Officer', 'Customer'), getContractById);

router.post(
  '/',
  authorize('Admin', 'Agent'),
  [
    body('application').notEmpty().withMessage('Approved application is required'),
    body('status')
      .optional({ values: 'falsy' })
      .isIn(contractStatuses)
      .withMessage('Invalid contract status'),
    body('outstandingBalance')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Outstanding balance must be 0 or greater'),
    body('depositPaid')
      .optional()
      .isBoolean()
      .withMessage('depositPaid must be true or false'),
    body('paymentPlanReady')
      .optional()
      .isBoolean()
      .withMessage('paymentPlanReady must be true or false'),
  ],
  validate,
  createContract
);

router.put(
  '/:id',
  authorize('Admin', 'Agent', 'Collections Officer'),
  [
    body('status')
      .optional()
      .isIn(contractStatuses)
      .withMessage('Invalid contract status'),
    body('outstandingBalance')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Outstanding balance must be 0 or greater'),
    body('depositPaid')
      .optional()
      .isBoolean()
      .withMessage('depositPaid must be true or false'),
    body('paymentPlanReady')
      .optional()
      .isBoolean()
      .withMessage('paymentPlanReady must be true or false'),
  ],
  validate,
  updateContract
);

router.patch(
  '/:id/sign',
  authorize('Customer'),
  [
    body('signatureDataUrl').notEmpty().withMessage('Signature is required'),
    body('signatureName').notEmpty().withMessage('Signature name is required'),
    body('witnessName')
      .optional({ values: 'falsy' })
      .isString()
      .withMessage('Witness name must be text'),
    body('witnessIdNumber')
      .optional({ values: 'falsy' })
      .isString()
      .withMessage('Witness ID number must be text'),
  ],
  validate,
  signContract
);

module.exports = router;
