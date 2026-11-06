const express = require('express');
const router = express.Router();
const {
  getStats,
  getUsers,
  toggleSuspendUser,
  getBusinesses,
  verifyBusiness,
  getAllJobs,
  closeJob,
  getReports,
  updateReport,
  getSkillsDemand,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('ADMIN'));

router.get('/stats', getStats);
router.get('/users', getUsers);
router.put('/users/:id/suspend', toggleSuspendUser);
router.get('/businesses', getBusinesses);
router.put('/businesses/:id/verify', verifyBusiness);
router.get('/jobs', getAllJobs);
router.put('/jobs/:id/close', closeJob);
router.get('/reports', getReports);
router.put('/reports/:id', updateReport);
router.get('/skills-demand', getSkillsDemand);

module.exports = router;
