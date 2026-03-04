const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const { getUsers, getUserById, createUser, updateUser, toggleUserStatus, deleteUser } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

// All user management routes are Admin-only
router.use(protect, authorize('Admin'));

router.get('/', getUsers);
router.get('/:id', getUserById);

router.post(
  '/',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('role')
      .isIn(['Admin', 'Agent', 'Technician', 'Collections Officer', 'Customer'])
      .withMessage('Invalid role'),
    body('password')
      .optional()
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters'),
  ],
  validate,
  createUser
);

router.put(
  '/:id',
  [
    body('email').optional().isEmail().withMessage('Valid email is required'),
    body('role')
      .optional()
      .isIn(['Admin', 'Agent', 'Technician', 'Collections Officer', 'Customer'])
      .withMessage('Invalid role'),
  ],
  validate,
  updateUser
);

router.patch('/:id/status', toggleUserStatus);
router.delete('/:id', deleteUser);

module.exports = router;
