const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();
const {
  createOrUpdateBusiness,
  getMyBusiness,
  getBusinessById,
  uploadBusinessImage,
  deleteBusinessImage,
} = require('../controllers/businessController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Validation rules for business creation/update
const businessValidation = [
  body('businessName')
    .trim()
    .notEmpty().withMessage('Business name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Business name must be 2-100 characters'),
  body('category')
    .notEmpty().withMessage('Category is required')
    .isIn(['Cafe', 'Restaurant', 'Shop', 'Salon', 'Hotel', 'Garage', 'Clinic', 'Tuition', 'Retail', 'Office', 'Other'])
    .withMessage('Invalid category'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 2000 }).withMessage('Description must be 10-2000 characters'),
  body('phone')
    .optional()
    .trim()
    .isMobilePhone('any', { strictMode: false }).withMessage('Invalid phone number'),
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

router.post('/', protect, authorize('BUSINESS'), businessValidation, createOrUpdateBusiness);
router.put('/', protect, authorize('BUSINESS'), businessValidation, createOrUpdateBusiness);
router.get('/me', protect, authorize('BUSINESS'), getMyBusiness);
router.post('/upload-image', protect, authorize('BUSINESS'), upload.single('image'), uploadBusinessImage);
router.delete('/image', protect, authorize('BUSINESS'), deleteBusinessImage);
router.get('/:id', getBusinessById);

module.exports = router;
