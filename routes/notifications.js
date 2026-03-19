const express = require('express');
const {
  getNotifications,
  markAsRead,
  clearNotifications,
} = require('../controllers/notifications');

const router = express.Router();

const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getNotifications);
router.put('/:id/read', markAsRead);
router.delete('/', clearNotifications);

module.exports = router;
