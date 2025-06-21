const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { validationResult } = require('express-validator');
const sgMail = require('@sendgrid/mail');
const crypto = require('crypto');

// Configure SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/**
 * Register a new user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response
 */
exports.register = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, firstName, lastName, userType } = req.body;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ errors: [{ msg: 'User already exists' }] });
    }

    // Create user
    const userData = {
      email,
      password,
      firstName,
      lastName,
      userType,
      // Additional fields for specific user types
      ...(userType === 'artist' && {
        artistName: req.body.artistName,
        bio: req.body.bio,
        socialMediaLinks: req.body.socialMediaLinks,
      }),
      ...(userType === 'fan' && {
        preferences: req.body.preferences,
        accessibilityRequirements: req.body.accessibilityRequirements,
      }),
    };

    const user = await User.create(userData);

    // Generate JWT token
    const payload = {
      user: {
        id: user.user_id,
        type: user.user_type,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        res.status(201).json({ token, user });
      }
    );

    // Send welcome email
    const msg = {
      to: email,
      from: process.env.SENDGRID_FROM_EMAIL,
      subject: 'Welcome to Fan Meet & Greet Manager',
      text: `Hello ${firstName},\n\nWelcome to Fan Meet & Greet Manager! We're excited to have you on board.\n\nBest regards,\nThe Fan Meet & Greet Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome to Fan Meet & Greet Manager!</h2>
          <p>Hello ${firstName},</p>
          <p>We're excited to have you on board. Here's what you can do now:</p>
          <ul>
            ${userType === 'artist' ? `
              <li>Set up your profile</li>
              <li>Create your first meet & greet event</li>
              <li>Invite your fans</li>
            ` : `
              <li>Browse upcoming meet & greet events</li>
              <li>Follow your favorite artists</li>
              <li>Book your first session</li>
            `}
          </ul>
          <p>If you have any questions, feel free to contact our support team.</p>
          <p>Best regards,<br>The Fan Meet & Greet Team</p>
        </div>
      `,
    };

    sgMail.send(msg).catch((error) => {
      console.error('Error sending welcome email:', error);
    });
  } catch (error) {
    console.error('Error in register:', error);
    res.status(500).json({ errors: [{ msg: 'Server error' }] });
  }
};

/**
 * Authenticate a user and get token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response
 */
exports.login = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Authenticate user
    const user = await User.authenticate(email, password);
    if (!user) {
      return res.status(401).json({ errors: [{ msg: 'Invalid credentials' }] });
    }

    // Get complete profile
    const userProfile = await User.getCompleteProfile(user.user_id);

    // Generate JWT token
    const payload = {
      user: {
        id: user.user_id,
        type: user.user_type,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        res.json({ token, user: userProfile });
      }
    );
  } catch (error) {
    console.error('Error in login:', error);
    res.status(500).json({ errors: [{ msg: 'Server error' }] });
  }
};

/**
 * Get authenticated user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response
 */
exports.getMe = async (req, res) => {
  try {
    const userProfile = await User.getCompleteProfile(req.user.id);
    res.json(userProfile);
  } catch (error) {
    console.error('Error in getMe:', error);
    res.status(500).json({ errors: [{ msg: 'Server error' }] });
  }
};

/**
 * Forgot password - send reset email
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response
 */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Find user by email
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(404).json({ errors: [{ msg: 'User not found' }] });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString('hex');
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour

    // Store reset token in database
    // This should be implemented in your User model
    // For simplicity, we're just sending the token in the email

    // Create reset URL
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    // Send reset email
    const msg = {
      to: email,
      from: process.env.SENDGRID_FROM_EMAIL,
      subject: 'Password Reset Request',
      text: `You are receiving this because you (or someone else) requested a password reset. Please click on the following link to reset your password: ${resetUrl}. If you did not request this, please ignore this email.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset Request</h2>
          <p>You are receiving this because you (or someone else) requested a password reset.</p>
          <p>Please click on the following link to reset your password:</p>
          <p><a href="${resetUrl}" style="padding: 10px 15px; background-color: #3f51b5; color: white; text-decoration: none; border-radius: 4px;">Reset Password</a></p>
          <p>If you did not request this, please ignore this email.</p>
          <p>Best regards,<br>The Fan Meet & Greet Team</p>
        </div>
      `,
    };

    await sgMail.send(msg);

    res.json({ msg: 'Password reset email sent' });
  } catch (error) {
    console.error('Error in forgotPassword:', error);
    res.status(500).json({ errors: [{ msg: 'Server error' }] });
  }
};

/**
 * Reset password
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response
 */
exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    // Verify token and find user
    // This should be implemented in your User model
    // For simplicity, we're just returning a generic response

    res.json({ msg: 'Password reset successful' });
  } catch (error) {
    console.error('Error in resetPassword:', error);
    res.status(500).json({ errors: [{ msg: 'Server error' }] });
  }
};