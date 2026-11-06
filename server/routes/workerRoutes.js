const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();
const { getMyProfile, updateProfile, getWorkerById } = require('../controllers/workerController');
const { protect, authorize } = require('../middleware/auth');

// Validation rules for worker profile update
const workerValidation = [
  body('skills')
    .optional()
    .isArray().withMessage('Skills must be an array')
    .custom((value) => {
      if (!Array.isArray(value)) return false;
      // Allow empty array — user may want to clear their skills
      return value.every(s => typeof s === 'string' && s.trim().length > 0 && s.length <= 50);
    }).withMessage('All skills must be non-empty strings (max 50 chars)'),

  body('education')
    .optional()
    .trim()
    .isLength({ min: 0, max: 100 }).withMessage('Education must be max 100 characters'),

  body('experience')
    .optional()
    .trim()
    .isLength({ min: 0, max: 500 }).withMessage('Experience must be max 500 characters'),

  body('experienceYears')
    .optional()
    .isInt({ min: 0, max: 60 }).withMessage('Experience years must be 0-60'),

  body('expectedSalary.min')
    .optional()
    .isInt({ min: 0 }).withMessage('Min salary must be positive'),

  body('expectedSalary.max')
    .optional()
    .isInt({ min: 0 }).withMessage('Max salary must be positive')
    .custom((value, { req }) => {
      if (value && req.body.expectedSalary?.min && value < req.body.expectedSalary.min) {
        throw new Error('Max salary must be >= min salary');
      }
      return true;
    }),

  body('preferredRadius')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Preferred radius must be 1-100 km'),

  body('languages')
    .optional()
    .isArray().withMessage('Languages must be an array')
    .custom((value) => {
      if (!Array.isArray(value)) return false;
      // Allow empty array — user may clear languages
      return value.every(l => typeof l === 'string' && l.trim().length > 0);
    }).withMessage('All languages must be non-empty strings'),

  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Bio must be max 500 characters'),

  body('jobPreference')
    .optional()
    .isIn(['FULL_TIME', 'PART_TIME', 'INTERNSHIP', 'CONTRACT', 'DAILY_WAGE', 'ANY'])
    .withMessage('Invalid job preference'),
];


router.get('/profile', protect, authorize('JOB_SEEKER'), getMyProfile);
router.put('/profile', protect, authorize('JOB_SEEKER'), workerValidation, updateProfile);
router.get('/:id', protect, getWorkerById);

module.exports = router;
