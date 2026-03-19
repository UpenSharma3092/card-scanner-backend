const User = require('../models/User');
const Invitation = require('../models/Invitation');
const TeamMember = require('../models/TeamMember');
const nodemailer = require('nodemailer');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, company, phone } = req.body;

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      company,
      phone,
    });

    // Check for team invitations for this new email
    const invitations = await Invitation.find({ email, status: 'pending' });
    for (const inv of invitations) {
      await TeamMember.create({
        user: user.id,
        owner: inv.inviter,
        company: inv.company,
        name: user.name,
        email: user.email,
        role: inv.role
      });
      inv.status = 'accepted';
      await inv.save();
    }

    sendTokenResponse(user, 201, res);
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email and password',
      });
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    sendTokenResponse(user, 200, res);
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

// @desc    Google login/register
// @route   POST /api/auth/google
// @access  Public
exports.googleLogin = async (req, res, next) => {
  try {
    const { idToken } = req.body;
    
    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: 'Google ID Token is required',
      });
    }

    const { OAuth2Client } = require('google-auth-library');
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

    let payload;
    try {
      const ticket = await client.verifyIdToken({
        idToken: idToken,
        audience: process.env.GOOGLE_CLIENT_ID, // Specify the CLIENT_ID of the app that accesses the backend
      });
      payload = ticket.getPayload();
    } catch (tokenError) {
      console.error(`[CardScan] Google Token Verification failed: ${tokenError.message}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid Google ID Token',
      });
    }

    const { email, name, picture, sub: googleId } = payload;
    console.log(`[CardScan] Google login attempt for email: ${email}, GoogleID: ${googleId}`);
    
    let user = await User.findOne({ 
      $or: [{ email }, { googleId }] 
    });
    
    if (!user) {
      console.log(`[CardScan] New Google user. Registering...`);
      // Register new google user
      user = await User.create({
        name,
        email,
        googleId,
        avatarUrl: picture,
        profilePicture: picture,
        company: 'Individual',
        // Password is not required now due to the schema change we made, but bcryptjs might still be needed for other things
      });
      console.log(`[CardScan] User created successfully: ${user._id}`);
      
      // Check for team invitations for this new email
      console.log(`[CardScan] Checking pending invitations for: ${email}`);
      const invitations = await Invitation.find({ email, status: 'pending' });
      for (const inv of invitations) {
        console.log(`[CardScan] Invitation found from owner: ${inv.inviter}. Linkage started...`);
        await TeamMember.create({
          user: user.id,
          owner: inv.inviter,
          company: inv.company,
          name: user.name,
          email: user.email,
          role: inv.role
        });
        inv.status = 'accepted';
        await inv.save();
        console.log(`[CardScan] Member successfully added to team!`);
      }
    } else {
      console.log(`[CardScan] Existing user found. Logging in...`);
      // Update googleId and avatar if not present/changed
      let updated = false;
      if (!user.googleId) {
        user.googleId = googleId;
        updated = true;
      }
      if (user.avatarUrl !== picture || user.profilePicture !== picture) {
        user.avatarUrl = picture;
        user.profilePicture = picture;
        updated = true;
      }
      if (updated) {
        await user.save();
      }
    }
    
    sendTokenResponse(user, 200, res);
  } catch (err) {
    console.error(`[CardScan] Google login error: ${err.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error during Google authentication',
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

// @desc    Update password
// @route   PUT /api/auth/update-password
// @access  Private
exports.updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    console.log(`[CardScan] Attempting password update for user: ${req.user.id}`);
    
    const user = await User.findById(req.user.id).select('+password');

    if (!user) {
      console.log('[CardScan] User not found during password update');
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if current password matches
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      console.log('[CardScan] Incorrect current password provided');
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    // Update password (will be hashed in pre('save') middleware)
    user.password = newPassword;
    console.log('[CardScan] Saving new password...');
    await user.save();
    console.log('[CardScan] Password updated successfully in database');

    sendTokenResponse(user, 200, res);
  } catch (err) {
    console.log(`[CardScan] Password update error: ${err.message}`);
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Forgot password - Send OTP
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide an email' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, message: 'No user found with that email' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Set OTP and expiry (10 mins)
    user.resetPasswordOTP = otp;
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000;

    await user.save();

    console.log(`[CardScan] Password reset OTP for ${email}: ${otp}`);

    // Create transporter for email
    // Note: For local development without real SMTP, we'll log it and use Ethereal or just provide a mock.
    // Real setup usually uses process.env vars for host/port/user/pass.
    
    try {
      // Create a test account if you don't have one (for dev)
      // let testAccount = await nodemailer.createTestAccount();
      
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.ethereal.email',
        port: process.env.SMTP_PORT || 587,
        secure: false, 
        auth: {
          user: process.env.SMTP_USER || 'ethereal_user', 
          pass: process.env.SMTP_PASS || 'ethereal_pass', 
        },
      });

      const mailOptions = {
        from: '"Corporate Card Scanner" <noreply@cardscan.com>',
        to: user.email,
        subject: 'Password Reset OTP',
        text: `Your password reset code is: ${otp}. This code will expire in 10 minutes.`,
        html: `<p>Your password reset code is: <b>${otp}</b></p><p>This code will expire in 10 minutes.</p>`,
      };

      // In real production, we'd wait for this. 
      // For local dev where SMTP might not be configured, we log the OTP and return success.
      if (process.env.NODE_ENV === 'development' || !process.env.SMTP_HOST) {
        console.log('--- DEVELOPMENT MODE: EMAIL NOT SENT ---');
        console.log(`OTP for ${email}: ${otp}`);
        console.log('----------------------------------------');
      } else {
        await transporter.sendMail(mailOptions);
        console.log(`[CardScan] OTP email sent to ${email}`);
      }
    } catch (mailError) {
      console.error(`[CardScan] Error sending email: ${mailError.message}`);
      // Don't fail the request if email fails in dev, as long as we have the OTP in logs
    }

    res.status(200).json({
      success: true,
      message: 'OTP sent to email',
      // In dev mode, we might include it in the response for convenience, 
      // but for security we usually don't.
      developmentOTP: process.env.NODE_ENV === 'development' ? otp : undefined
    });

  } catch (err) {
    console.error(`[CardScan] Forgot password error: ${err.message}`);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res, next) => {
  try {
    const { email, otp, password } = req.body;

    if (!email || !otp || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email, OTP, and new password' });
    }

    const user = await User.findOne({
      email,
      resetPasswordOTP: otp,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    // Set new password
    user.password = password;
    user.resetPasswordOTP = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successful',
    });

  } catch (err) {
    console.error(`[CardScan] Reset password error: ${err.message}`);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = user.getSignedJwtToken();

  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      company: user.company,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      profilePicture: user.profilePicture,
      googleId: user.googleId,
      plan: user.plan,
      joinedAt: user.joinedAt,
      createdAt: user.createdAt,
      settings: user.settings,
    },
  });
};
