const db = require('../config/db');

const logAuthEvent = async (event, userId, ip, meta = {}) => {
  try {
    await db.query(`
      INSERT INTO auth_logs (event_type, user_id, ip_address, metadata, created_at)
      VALUES ($1, $2, $3, $4, NOW())
    `, [event, userId, ip, JSON.stringify(meta)]);
  } catch (_) {
    // Security logging must never interrupt authentication.
  }
};

module.exports = { logAuthEvent };