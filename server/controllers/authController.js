/**
 * Authentication Controller
 * Handles user registration, JWT generation, secure cookie persistence,
 * login/logout, profile details, and cryptographic password reset workflows.
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const WorkerProfile = require('../models/WorkerProfile');
const Business = require('../models/Business');
const { sendPasswordResetEmail } = require('../services/emailService');

// ============================================================================
// Internal Helpers
// ============================================================================

/**
 * Sign a JWT token for a given user ID
 * @param {string} id - MongoDB ObjectId
 * @returns {string} Signed JSON Web Token
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

/**
 * Persist the authentication token in an httpOnly, SameSite=Strict cookie
 * @param {Response} res - Express Response object
 * @param {string} token - Signed JWT
 */
const setTokenCookie = (res, token) => {
  res.cookie('worknear_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

// ============================================================================
// Public Auth Endpoints
// ============================================================================

/**
 * @desc    Register a new user account (JOB_SEEKER or BUSINESS)
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, email, password, role, phone, location } = req.body;

    if (!['JOB_SEEKER', 'BUSINESS'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role must be JOB_SEEKER or BUSINESS',
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered',
      });
    }

    // Create user record (pre-save hook hashes passwordHash)
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash: password,
      role,
      phone: phone || '',
      location: location || {
        type: 'Point',
        coordinates: [0, 0],
        address: '',
        city: '',
        locality: '',
      },
    });

    // Automatically scaffold companion profile based on registered role
    if (role === 'JOB_SEEKER') {
      await WorkerProfile.create({ userId: user._id });
    }

    const token = generateToken(user._id);
    setTokenCookie(res, token);

    res.status(201).json({
      success: true,
      token, // Maintained for client compatibility
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Authenticate user & issue JWT
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    if (user.isSuspended) {
      return res.status(403).json({
        success: false,
        message: 'Account has been suspended. Please contact support.',
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const token = generateToken(user._id);
    setTokenCookie(res, token);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Fetch current authenticated user profile and details
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    let profile = null;
    if (user.role === 'JOB_SEEKER') {
      profile = await WorkerProfile.findOne({ userId: user._id });
    } else if (user.role === 'BUSINESS') {
      profile = await Business.findOne({ userId: user._id });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        location: user.location,
        isActive: user.isActive,
      },
      profile,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Initiate password reset email request
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
const forgotPassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const user = await User.findOne({ email: req.body.email.toLowerCase() }).select(
      '+passwordResetToken +passwordResetExpires'
    );

    const response = {
      success: true,
      message: 'If an account exists for that email, a password-reset link has been sent.',
    };

    if (user) {
      const resetToken = crypto.randomBytes(32).toString('hex');
      user.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
      user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 min expiry
      await user.save({ validateBeforeSave: false });

      const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
      const resetUrl = `${clientUrl}/reset-password/${resetToken}`;

      try {
        const previewUrl = await sendPasswordResetEmail({
          to: user.email,
          name: user.name,
          resetUrl,
        });

        if (process.env.NODE_ENV !== 'production' && previewUrl) {
          response.previewUrl = previewUrl;
        }
      } catch (error) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });
        throw error;
      }
    }

    res.json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Complete password reset with a valid token
 * @route   POST /api/auth/reset-password/:token
 * @access  Public
 */
const resetPassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
    }).select('+passwordHash +passwordResetToken +passwordResetExpires');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'This reset link is invalid or has expired.',
      });
    }

    user.passwordHash = req.body.password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    const token = generateToken(user._id);
    setTokenCookie(res, token);

    res.json({
      success: true,
      message: 'Password reset successfully.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Log out user by clearing the httpOnly session cookie
 * @route   POST /api/auth/logout
 * @access  Public
 */
const logout = (req, res) => {
  res.cookie('worknear_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    expires: new Date(0),
  });
  res.json({ success: true, message: 'Logged out successfully' });
};

/**
 * @desc    Update basic account profile fields (name, phone)
 * @route   PUT /api/auth/update-profile
 * @access  Private
 */
const updateProfile = async (req, res, next) => {
  try {
    const { name, phone } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (name) user.name = name.trim();
    if (phone !== undefined) user.phone = phone.trim();
    await user.save();

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update account password for authenticated user
 * @route   PUT /api/auth/change-password
 * @access  Private
 */
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current and new passwords are required' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'New password must be at least 8 characters' });
    }

    const user = await User.findById(req.user.id).select('+passwordHash');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    user.passwordHash = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  updateProfile,
  changePassword,
};
