const express = require('express');
const router = express.Router();
const {
  getMyApplications,
  updateApplicationStatus,
} = require('../controllers/applicationController');
const { protect, authorize } = require('../middleware/auth');

router.get('/my', protect, authorize('JOB_SEEKER'), getMyApplications);
router.put('/:id/status', protect, authorize('BUSINESS', 'ADMIN'), updateApplicationStatus);

module.exports = router;
