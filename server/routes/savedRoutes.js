const express = require('express');
const router = express.Router();
const { saveJob, unsaveJob, getSavedJobs } = require('../controllers/savedJobController');
const { protect, authorize } = require('../middleware/auth');

router.post('/', protect, authorize('JOB_SEEKER'), saveJob);
router.get('/', protect, authorize('JOB_SEEKER'), getSavedJobs);
router.delete('/:jobId', protect, authorize('JOB_SEEKER'), unsaveJob);

module.exports = router;
