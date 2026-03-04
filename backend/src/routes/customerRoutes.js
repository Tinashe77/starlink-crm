const express = require('express');
const router = express.Router();
const { getCustomers, getCustomerById, createCustomer, updateCustomer, getMyProfile } = require('../controllers/customerController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/me', getMyProfile);

router.get('/', authorize('Admin', 'Agent'), getCustomers);
router.get('/:id', authorize('Admin', 'Agent'), getCustomerById);
router.post('/', createCustomer);
router.put('/:id', updateCustomer);

module.exports = router;
