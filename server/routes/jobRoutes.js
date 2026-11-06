const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();
const {
  createJob,
  getJobs,
  getJobById,
  updateJob,
  deleteJob,
  getMyJobs,
  getRecommendedJobs,
  getJobMatch,
} = require('../controllers/jobController');
const {
  applyToJob,
  getJobApplicants,
} = require('../controllers/applicationController');
const { protect, authorize } = require('../middleware/auth');

// Validation rules for job creation/update
const jobValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Job title is required')
    .isLength({ min: 3, max: 100 }).withMessage('Title must be 3-100 characters'),
  body('description')
    .trim()
    .notEmpty().withMessage('Job description is required')
    .isLength({ min: 20, max: 5000 }).withMessage('Description must be 20-5000 characters'),
  body('category')
    .trim()
    .notEmpty().withMessage('Category is required')
    .isIn(['Cafe', 'Restaurant', 'Shop', 'Salon', 'Hotel', 'Garage', 'Clinic', 'Tuition', 'Retail', 'Office', 'Other'])
    .withMessage('Invalid category'),
  body('jobType')
    .notEmpty().withMessage('Job type is required')
    .isIn(['FULL_TIME', 'PART_TIME', 'INTERNSHIP', 'CONTRACT', 'DAILY_WAGE'])
    .withMessage('Invalid job type'),
  body('salaryMin')
    .isInt({ min: 0 }).withMessage('Salary min must be a positive number'),
  body('salaryMax')
    .isInt({ min: 0 }).withMessage('Salary max must be a positive number')
    .custom((value, { req }) => {
      if (value < req.body.salaryMin) {
        throw new Error('Salary max must be >= salary min');
      }
      return true;
    }),
  body('experienceRequired')
    .optional()
    .isInt({ min: 0, max: 50 }).withMessage('Experience must be 0-50 years'),
  body('skills')
    .optional()
    .isArray().withMessage('Skills must be an array')
    .custom((value) => {
      if (Array.isArray(value)) {
        return value.every(s => typeof s === 'string' && s.trim().length > 0);
      }
      return false;
    }).withMessage('All skills must be non-empty strings'),
  body('deadline')
    .optional()
    .isISO8601().withMessage('Deadline must be a valid date')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Deadline must be in the future');
      }
      return true;
    }),
  body('location')
    .optional()
    .isObject().withMessage('Location must be an object'),
  body('location.coordinates')
    .optional()
    .isArray({ min: 2, max: 2 }).withMessage('Location coordinates must contain longitude and latitude')
    .custom((coordinates) => {
      const [longitude, latitude] = coordinates;
      if (!Number.isFinite(Number(longitude)) || !Number.isFinite(Number(latitude))
        || Number(longitude) < -180 || Number(longitude) > 180
        || Number(latitude) < -90 || Number(latitude) > 90) {
        throw new Error('Location coordinates are invalid');
      }
      return true;
    }),
];

// Public
router.get('/', getJobs);

// Protected - specific routes before :id
router.get('/my', protect, authorize('BUSINESS'), getMyJobs);
router.get('/recommended', protect, authorize('JOB_SEEKER'), getRecommendedJobs);

router.post('/', protect, authorize('BUSINESS'), jobValidation, createJob);

router.get('/:id', getJobById);
router.put('/:id', protect, authorize('BUSINESS'), jobValidation, updateJob);
router.delete('/:id', protect, authorize('BUSINESS', 'ADMIN'), deleteJob);

router.get('/:id/match', protect, authorize('JOB_SEEKER'), getJobMatch);
router.post('/:id/apply', protect, authorize('JOB_SEEKER'), applyToJob);
router.get('/:id/applicants', protect, authorize('BUSINESS', 'ADMIN'), getJobApplicants);

module.exports = router;
