const express = require('express');
const {
  register,
  login,
  getMe,
  updatePassword,
  googleLogin,
  forgotPassword,
  resetPassword,
} = require('../controllers/auth');

const router = express.Router();

const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleLogin);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', protect, getMe);
router.put('/update-password', protect, updatePassword);
router.get('/me', protect, getMe);

module.exports = router;
