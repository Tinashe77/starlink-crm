const express = require('express');
const { body } = require('express-validator');

const {
  getInstallations,
  getInstallationById,
  getInstallationOptions,
  createInstallation,
  updateInstallation,
} = require('../controllers/installationController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(protect);

router.get(
  '/',
  authorize('Admin', 'Agent', 'Technician', 'Customer'),
  getInstallations
);

router.get(
  '/options',
  authorize('Admin', 'Agent'),
  getInstallationOptions
);

router.get(
  '/:id',
  authorize('Admin', 'Agent', 'Technician', 'Customer'),
  getInstallationById
);

router.post(
  '/',
  authorize('Admin', 'Agent'),
  [
    body('contract').notEmpty().withMessage('Contract is required'),
    body('status')
      .optional({ values: 'falsy' })
      .isIn(['Pending', 'Scheduled', 'In Progress', 'Installed', 'Revisit Required', 'Failed'])
      .withMessage('Invalid installation status'),
    body('scheduledFor')
      .optional({ values: 'falsy' })
      .isISO8601()
      .withMessage('Scheduled date must be a valid date'),
  ],
  validate,
  createInstallation
);

router.put(
  '/:id',
  authorize('Admin', 'Agent', 'Technician'),
  [
    body('status')
      .optional({ values: 'falsy' })
      .isIn(['Pending', 'Scheduled', 'In Progress', 'Installed', 'Revisit Required', 'Failed'])
      .withMessage('Invalid installation status'),
    body('scheduledFor')
      .optional({ values: 'falsy' })
      .isISO8601()
      .withMessage('Scheduled date must be a valid date'),
    body('certificateIssued')
      .optional()
      .isBoolean()
      .withMessage('Certificate issued must be true or false'),
  ],
  validate,
  updateInstallation
);

module.exports = router;
