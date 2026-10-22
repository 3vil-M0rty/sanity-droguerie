const { accountAccessProblem } = require('../services/tenantService');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const CHALLENGE_TOKEN_EXPIRY = '5m';

exports.login = async (req, res) => {
  try {
    // Plain strings only: an object such as { "$regex": "^a" } must never
    // reach the query (also refused globally, middleware/rejectOperators.js).
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user
    const user = await User.findOne({ email }).select('+password +twoFactor.secret');
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Checked only AFTER the password is confirmed, so this can't be
    // used to probe which emails exist. middleware/auth.js enforces
    // the same rule on every request, so deactivating someone also
    // cuts off a session they already had open.
    if (user.status === 'inactive' || user.status === 'suspended') {
      return res.status(403).json({ message: 'This account has been deactivated' });
    }

    // The client (tenant) itself may be suspended — see
    // services/tenantService.js. Same "after the password" rule.
    const clientProblem = await accountAccessProblem(user);
    if (clientProblem) {
      return res.status(clientProblem.status).json({ message: clientProblem.message });
    }

    // --------------------------------------------------------
    // Two-factor authentication: the password alone is only
    // "half" the login for an account with 2FA enabled. Rather
    // than issue the real session token here, hand back a
    // short-lived challenge token that only proves "this person
    // already got the password right" — routes/twoFactor.js's
    // /verify-login exchanges it (plus a correct 6-digit code, or
    // a backup code) for the real session token. Nothing about
    // this challenge token grants any actual access on its own.
    // --------------------------------------------------------

    if (user.twoFactor?.enabled) {
      const challengeToken = jwt.sign(
        { id: user._id, purpose: '2fa_challenge' },
        process.env.JWT_SECRET,
        { expiresIn: CHALLENGE_TOKEN_EXPIRY }
      );

      return res.json({
        message: 'Password verified — two-factor code required',
        data: {
          requires2FA: true,
          challengeToken,
        },
      });
    }

    // Generate token
    // Same token as after 2FA / a password change (services/sessionToken.js).
    const token = require('../services/sessionToken').signSessionToken(user);

    res.json({
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          department: user.department,
          employee: user.employee || null,
        }
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.logout = (req, res) => {
  res.json({ message: 'Logout successful' });
};
