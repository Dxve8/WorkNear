const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { register, login, logout, getMe, forgotPassword, resetPassword, updateProfile, changePassword } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Validation rules
const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('role').isIn(['JOB_SEEKER', 'BUSINESS']).withMessage('Role must be JOB_SEEKER or BUSINESS'),
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.post('/logout', logout);
router.post('/forgot-password', [body('email').isEmail().normalizeEmail().withMessage('Valid email is required')], forgotPassword);
router.post('/reset-password/:token', [body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')], resetPassword);
router.get('/me', protect, getMe);
router.put('/update-profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);

module.exports = router;

