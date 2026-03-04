const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const {
  getPackages,
  getPackageById,
  createPackage,
  updatePackage,
  deletePackage,
} = require('../controllers/packageController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

const packageValidation = [
  body('name').notEmpty().withMessage('Package name is required'),
  body('totalCost').isFloat({ gt: 0 }).withMessage('Total cost must be greater than 0'),
  body('depositPercent')
    .isFloat({ min: 0, max: 100 })
    .withMessage('Deposit % must be between 0 and 100'),
  body('weeklyAmount')
    .optional({ values: 'falsy' })
    .isFloat({ gt: 0 })
    .withMessage('Weekly amount must be greater than 0'),
  body('weeks')
    .optional({ values: 'falsy' })
    .isInt({ min: 1 })
    .withMessage('Duration must be at least 1 week'),
  body('type')
    .isIn(['Household', 'Business', 'School'])
    .withMessage('Invalid package type'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be true or false'),
];

router.use(protect);

router.get('/', getPackages);
router.get('/:id', getPackageById);

router.post('/', authorize('Admin'), packageValidation, validate, createPackage);
router.put('/:id', authorize('Admin'), packageValidation, validate, updatePackage);
router.delete('/:id', authorize('Admin'), deletePackage);

module.exports = router;
