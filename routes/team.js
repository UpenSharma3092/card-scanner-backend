const express = require('express');
const { getTeam, inviteMember } = require('../controllers/team');

const router = express.Router();

const { protect } = require('../middleware/auth');

router.get('/', protect, getTeam);
router.post('/invite', protect, inviteMember);

module.exports = router;
