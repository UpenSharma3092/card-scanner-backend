const express = require('express');
const {
  getContacts,
  getContact,
  createContact,
  updateContact,
  deleteContact,
} = require('../controllers/contacts');

const router = express.Router();

const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/').get(getContacts).post(createContact);

router.route('/:id').get(getContact).put(updateContact).delete(deleteContact);

module.exports = router;
