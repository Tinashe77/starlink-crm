const express = require('express');
const router = express.Router();
const {
  getApplications, getApplicationById, createApplication, updateApplicationStatus, deleteApplication,
} = require('../controllers/applicationController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/', getApplications);
router.get('/:id', getApplicationById);
router.post('/', createApplication);
router.patch('/:id/status', authorize('Admin', 'Agent'), updateApplicationStatus);
router.delete('/:id', authorize('Admin', 'Agent', 'Customer'), deleteApplication);

module.exports = router;
