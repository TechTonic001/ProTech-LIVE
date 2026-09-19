const db = require('../config/db');
const { isRoomVacant } = require('../utils/roomOccupancy');

const getDeletedProperties = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT property_id, property_name, address, city, total_rooms,
              deleted_at,
              EXTRACT(DAY FROM (NOW() - deleted_at))::INTEGER AS days_since_deletion,
              GREATEST(0, 30 - EXTRACT(DAY FROM (NOW() - deleted_at))::INTEGER) AS days_remaining
       FROM properties
       WHERE landlord_id = $1
         AND deleted_at IS NOT NULL
       ORDER BY deleted_at DESC`,
      [req.user.user_id],
    );

    return res.status(200).json({ data: result.rows });
  } catch (error) {
    next(error);
  }
};

const getDeletedTenants = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT DISTINCT ON (u.user_id)
              u.user_id, u.full_name, u.username, u.email, u.phone_number,
              u.deleted_at, u.deletion_reason,
              EXTRACT(DAY FROM (NOW() - u.deleted_at))::INTEGER AS days_since_deletion,
              GREATEST(0, 30 - EXTRACT(DAY FROM (NOW() - u.deleted_at))::INTEGER) AS days_remaining,
              r.room_number, p.property_name
       FROM users u
       LEFT JOIN tenant_approvals ta
         ON ta.tenant_id = u.user_id AND ta.landlord_id = $1
       LEFT JOIN leases l
         ON l.tenant_id = u.user_id AND l.landlord_id = $1
       LEFT JOIN rooms r ON r.room_id = l.room_id
       LEFT JOIN properties p ON p.property_id = r.property_id
       WHERE u.role = 'tenant'
         AND u.deleted_at IS NOT NULL
         AND (ta.tenant_id IS NOT NULL OR l.tenant_id IS NOT NULL)
       ORDER BY u.user_id, u.deleted_at DESC, l.created_at DESC NULLS LAST`,
      [req.user.user_id],
    );

    return res.status(200).json({ data: result.rows });
  } catch (error) {
    next(error);
  }
};

const recoverProperty = async (req, res, next) => {
  const client = await db.pool().connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      `UPDATE properties
       SET deleted_at = NULL
       WHERE property_id = $1 AND landlord_id = $2 AND deleted_at IS NOT NULL
       RETURNING property_id`,
      [req.params.id, req.user.user_id],
    );

    if (result.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Deleted property not found.' });
    }

    await client.query(
      'UPDATE rooms SET deleted_at = NULL WHERE property_id = $1',
      [req.params.id],
    );
    await client.query('COMMIT');
    return res.status(200).json({ message: 'Property recovered successfully.' });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    next(error);
  } finally {
    client.release();
  }
};

const recoverTenant = async (req, res, next) => {
  const client = await db.pool().connect();
  try {
    await client.query('BEGIN');
    const tenantId = req.params.id;
    const landlordId = req.user.user_id;

    const tenantResult = await client.query(
      `SELECT u.user_id
       FROM users u
       WHERE u.user_id = $1 AND u.role = 'tenant' AND u.deleted_at IS NOT NULL
         AND EXISTS (
           SELECT 1 FROM tenant_approvals ta
           WHERE ta.tenant_id = u.user_id AND ta.landlord_id = $2
         )`,
      [tenantId, landlordId],
    );

    if (tenantResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Deleted tenant not found.' });
    }

    await client.query(
      `UPDATE users SET deleted_at = NULL, deletion_reason = NULL WHERE user_id = $1`,
      [tenantId],
    );
    await client.query(
      `UPDATE tenant_approvals
       SET status = 'approved'
       WHERE tenant_id = $1 AND landlord_id = $2 AND status = 'removed'`,
      [tenantId, landlordId],
    );

    const leaseResult = await client.query(
      `SELECT lease_id, room_id
       FROM leases
       WHERE tenant_id = $1 AND landlord_id = $2 AND lease_status = 'terminated'
       ORDER BY created_at DESC NULLS LAST
       LIMIT 1
       FOR UPDATE`,
      [tenantId, landlordId],
    );

    const previousLease = leaseResult.rows[0];
    let roomCanBeReassigned = false;

    if (previousLease?.room_id) {
      const roomResult = await client.query(
        `SELECT room_id, is_occupied
         FROM rooms
         WHERE room_id = $1
         FOR UPDATE`,
        [previousLease.room_id],
      );
      roomCanBeReassigned = isRoomVacant(roomResult.rows[0]?.is_occupied);
    }

    if (previousLease) {
      await client.query(
        `UPDATE leases
         SET lease_status = 'active', room_id = $2
         WHERE lease_id = $1`,
        [previousLease.lease_id, roomCanBeReassigned ? previousLease.room_id : null],
      );
    }

    if (roomCanBeReassigned) {
      await client.query(
        'UPDATE rooms SET is_occupied = 1, deleted_at = NULL WHERE room_id = $1',
        [previousLease.room_id],
      );
    }

    await client.query('COMMIT');
    return res.status(200).json({ message: 'Tenant recovered successfully.' });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    next(error);
  } finally {
    client.release();
  }
};

module.exports = {
  getDeletedProperties,
  getDeletedTenants,
  recoverProperty,
  recoverTenant,
};
