const db = require('../config/db');

const logNotification = async ({
  tenantId = null,
  landlordId,
  category = 'reminder',
  type = 'system',
  message,
  leaseId = null,
}) => {
  try {
    await db.query(`
      INSERT INTO notifications
        (lease_id, tenant_id, landlord_id,
         channel, notification_type,
         notification_category,
         message_body, delivery_status, sent_at)
      VALUES ($1, $2, $3, 'in_app', $4, $5, $6, 'sent', NOW())
    `, [
      leaseId,
      tenantId,
      landlordId,
      type,
      category,
      message,
    ]);
  } catch (err) {
    console.error('[LOG NOTIF ERROR]', err.message);
  }
};

module.exports = { logNotification };
