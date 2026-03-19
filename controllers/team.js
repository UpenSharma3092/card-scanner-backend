const Invitation = require('../models/Invitation');
const TeamMember = require('../models/TeamMember');
const User = require('../models/User');

// @desc    Get all team members
// @route   GET /api/team
// @access  Private
exports.getTeam = async (req, res, next) => {
  try {
    // Current user is the owner, find all members who have joined 'owner: req.user.id'
    const team = await TeamMember.find({ owner: req.user.id });

    res.status(200).json({
      success: true,
      count: team.length,
      data: team,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

// @desc    Invite a team member
// @route   POST /api/team/invite
// @access  Private
exports.inviteMember = async (req, res, next) => {
  try {
    const { email, role, company } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide an email' });
    }

    // 1. Create invitation record
    const invitation = await Invitation.create({
      email,
      inviter: req.user.id,
      company: company || req.user.company || 'Team Member',
      role: role || 'member'
    });

    // 2. See if the user already exists in CardScan
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      // If user exists, immediately create relationship
      const existingInTeam = await TeamMember.findOne({ owner: req.user.id, email });
      if (!existingInTeam) {
        await TeamMember.create({
          user: existingUser.id,
          owner: req.user.id,
          company: company || req.user.company || 'Team Member',
          name: existingUser.name,
          email: existingUser.email,
          role: role || 'member'
        });
        invitation.status = 'accepted';
        await invitation.save();
      }
    }

    res.status(201).json({
      success: true,
      message: 'Invitation sent successfully',
      data: invitation
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};
