/**
 * Kept for the callers written before Sanity's multi-warehouse stock:
 * everything now goes through services/stockService.js (CMUP, warehouses,
 * lots). applyMovement keeps its old signature.
 */
const { applyMovement } = require("./stockService");

module.exports = { applyMovement };
