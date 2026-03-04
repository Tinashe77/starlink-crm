const express = require('express');
const { body } = require('express-validator');

const {
  getCustomerApplications,
  getCustomerApplicationById,
  createCustomerApplication,
  updateCustomerApplication,
} = require('../controllers/customerApplicationController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

const customerTypes = ['Individual/Household', 'Business/Company', 'School/Institution'];
const propertyOwnershipTypes = ['Owner', 'Tenant', 'Other'];
const applicationStatuses = ['Draft', 'Submitted', 'Under Review', 'Approved', 'Rejected'];
const referralSources = ['Facebook/Social Media', 'Radio', 'Referral', 'Website', 'Other', ''];

const applicationValidation = [
  body('customerType').isIn(customerTypes).withMessage('Invalid customer type'),
  body('fullName').notEmpty().withMessage('Full name / company name is required'),
  body('packageName').notEmpty().withMessage('A valid service package is required'),
  body('propertyOwnership')
    .optional({ values: 'falsy' })
    .isIn(propertyOwnershipTypes)
    .withMessage('Invalid property ownership value'),
  body('status')
    .optional({ values: 'falsy' })
    .isIn(applicationStatuses)
    .withMessage('Invalid application status'),
  body('referralSource')
    .optional()
    .isIn(referralSources)
    .withMessage('Invalid referral source'),
  body('email').optional({ values: 'falsy' }).isEmail().withMessage('Valid email is required'),
  body('sponsorEmail').optional({ values: 'falsy' }).isEmail().withMessage('Valid sponsor email is required'),
  body('declarationAccepted')
    .custom((value) => value === true)
    .withMessage('Declaration and consent must be accepted'),
];

router.use(protect);

router.get('/', getCustomerApplications);
router.get('/:id', getCustomerApplicationById);

router.post(
  '/',
  authorize('Admin', 'Agent', 'Customer'),
  applicationValidation,
  validate,
  createCustomerApplication
);

router.put(
  '/:id',
  authorize('Admin', 'Agent', 'Customer'),
  applicationValidation,
  validate,
  updateCustomerApplication
);

module.exports = router;
