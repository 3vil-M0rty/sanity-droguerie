// Must load before the schema is compiled — registers the client-isolation plugin.
require("../services/tenantScope");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

/**
 * A reseller's login to the ordering portal (/portail). NOT a User: it
 * can't reach the internal API at all (its token is refused by
 * middleware/auth.js), only /api/portal, and only for its own customer.
 *   buyer  — orders, sees prices, invoices and balance
 *   viewer — sees, doesn't order
 */
const portalUserSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 200 },
    phone: { type: String, trim: true, maxlength: 50 },
    password: { type: String, required: true, select: false },
    tokenVersion: { type: Number, default: 0 },
    role: { type: String, enum: ["buyer", "viewer"], default: "buyer" },
    active: { type: Boolean, default: true },
    mustChangePassword: { type: Boolean, default: true },
    lastLoginAt: { type: Date, default: null },
    failedLogins: { type: Number, default: 0 },
    lockedUntil: { type: Date, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);
portalUserSchema.index({ email: 1 }, { unique: true });

portalUserSchema.pre("save", async function hash() {
  if (this.isModified("password")) {
    // A new password (changed or reset) ends every session opened before.
    if (!this.isNew) this.tokenVersion = (this.tokenVersion || 0) + 1;
    this.password = await bcrypt.hash(this.password, 10);
  }
});
portalUserSchema.methods.matches = function matches(pw) { return bcrypt.compare(String(pw || ""), this.password); };

module.exports = mongoose.model("PortalUser", portalUserSchema);
