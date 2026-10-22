const jwt = require("jsonwebtoken");

/**
 * The session token every login path hands out (password login, 2FA,
 * password change). "tv" = User.tokenVersion: a password change bumps
 * it, which ends every session opened before (middleware/auth.js).
 */
const SESSION_TOKEN_EXPIRY = "7d";

function signSessionToken(user) {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
      department: user.department,
      employee: user.employee || null,
      tv: user.tokenVersion || 0,
    },
    process.env.JWT_SECRET,
    { expiresIn: SESSION_TOKEN_EXPIRY, algorithm: "HS256" }
  );
}

module.exports = { signSessionToken, SESSION_TOKEN_EXPIRY };
