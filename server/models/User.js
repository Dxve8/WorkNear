/**
 * User Model
 * Defines system identity credentials, security attributes, roles (Seeker, Business, Admin),
 * 2dsphere geospatial coordinates, and password hashing hooks.
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    passwordHash: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ['JOB_SEEKER', 'BUSINESS', 'ADMIN'],
      required: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude] in WGS84 GeoJSON format
        default: [0, 0],
      },
      address: {
        type: String,
        default: '',
      },
      city: {
        type: String,
        default: '',
      },
      locality: {
        type: String,
        default: '',
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isSuspended: {
      type: Boolean,
      default: false,
    },
    suspensionReason: {
      type: String,
      default: '',
      trim: true,
      maxlength: 500,
    },
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

// ============================================================================
// Geospatial & Query Indexes
// ============================================================================
userSchema.index({ location: '2dsphere' });

// ============================================================================
// Password Cryptography Middleware & Methods
// ============================================================================

/**
 * Pre-save lifecycle hook: hash plaintext passwords using bcrypt
 */
userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  next();
});

/**
 * Validates a candidate password against stored bcrypt hash
 * @param {string} enteredPassword - Plaintext candidate password
 * @returns {Promise<boolean>} True if match
 */
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.passwordHash);
};

module.exports = mongoose.model('User', userSchema);
