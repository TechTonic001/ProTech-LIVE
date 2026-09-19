// controllers/landlord.controller.js
// Handles soft-delete and unassign operations for tenants under a landlord's management
const db = require("../config/db");

// ── SOFT DELETE a tenant ───────────────────────────────────────────────────────
// Route: DELETE /api/tenants/:tenant_id
// Auth:  verifyToken + requireRole('landlord')
const softDeleteTenant = async (req, res, next) => {
  try {
    const { tenant_id } = req.params;
    if (!tenant_id) {
      return res.status(400).json({ error: "tenant_id is required" });
    }
    const landlord_id = req.user.user_id;
    const { reason } = req.body;

    // Verify this tenant belongs to the requesting landlord via tenant_approvals OR leases
    const checkResult = await db.query(
      `SELECT approval_id FROM tenant_approvals WHERE tenant_id = $1 AND landlord_id = $2
       UNION
       SELECT lease_id FROM leases WHERE tenant_id = $1 AND landlord_id = $2`,
      [tenant_id, landlord_id],
    );

    if (checkResult.rows.length === 0) {
      return res.status(403).json({
        error: "You do not have permission to remove this tenant.",
      });
    }

    // Check tenant exists and is not already deleted
    const tenantResult = await db.query(
      "SELECT user_id, deleted_at FROM users WHERE user_id = $1 AND role = $2",
      [tenant_id, "tenant"],
    );

    if (tenantResult.rows.length === 0) {
      return res.status(404).json({ error: "Tenant not found." });
    }

    if (tenantResult.rows[0].deleted_at) {
      return res.status(400).json({ error: "Tenant is already removed." });
    }

    // Soft delete the tenant user account
    await db.query(
      `UPDATE users
       SET deleted_at = NOW(),
           deletion_reason = $2
       WHERE user_id = $1`,
      [tenant_id, reason || "Removed by landlord"],
    );

    // Deactivate active leases and free up rooms
    const leasesRes = await db.query(
      `SELECT lease_id, room_id FROM leases
       WHERE tenant_id = $1
         AND landlord_id = $2
         AND lease_status = 'active'`,
      [tenant_id, landlord_id],
    );

    for (const row of leasesRes.rows) {
      await db.query(
        `UPDATE leases SET lease_status = 'terminated' WHERE lease_id = $1`,
        [row.lease_id],
      );
      if (row.room_id) {
        await db.query(
          `UPDATE rooms SET is_occupied = 0 WHERE room_id = $1`,
          [row.room_id],
        );
      }
    }

    // Mark approval status as removed
    await db.query(
      `UPDATE tenant_approvals SET status = 'removed' WHERE tenant_id = $1 AND landlord_id = $2`,
      [tenant_id, landlord_id],
    );

    return res.status(200).json({
      message: "Tenant removed. Recovery available for 30 days.",
    });
  } catch (error) {
    next(error);
  }
};

// ── RESTORE a soft-deleted tenant ──────────────────────────────────────────────
// Route: POST /api/tenants/:tenant_id/restore
// Auth:  verifyToken + requireRole('landlord')
const restoreTenant = async (req, res, next) => {
  try {
    const { tenant_id } = req.params;
    if (!tenant_id) {
      return res.status(400).json({ error: "tenant_id is required" });
    }
    const landlord_id = req.user.user_id;

    // Verify this tenant belongs to the requesting landlord
    const checkResult = await db.query(
      `SELECT approval_id FROM tenant_approvals WHERE tenant_id = $1 AND landlord_id = $2
       UNION
       SELECT lease_id FROM leases WHERE tenant_id = $1 AND landlord_id = $2`,
      [tenant_id, landlord_id],
    );

    if (checkResult.rows.length === 0) {
      return res.status(403).json({
        error: "You do not have permission to restore this tenant.",
      });
    }

    const tenantResult = await db.query(
      "SELECT user_id, deleted_at FROM users WHERE user_id = $1 AND deleted_at IS NOT NULL",
      [tenant_id],
    );

    if (tenantResult.rows.length === 0) {
      return res.status(404).json({ error: "Deleted tenant not found." });
    }

    // Check 30-day window
    const deletedAt = new Date(tenantResult.rows[0].deleted_at);
    const daysSinceDelete = (Date.now() - deletedAt.getTime()) / 86400000;

    if (daysSinceDelete >= 30) {
      return res.status(400).json({
        error:
          "Recovery window has expired. This tenant account has been permanently deleted.",
      });
    }

    // Restore the tenant user account
    await db.query(
      `UPDATE users
       SET deleted_at = NULL,
           deletion_reason = NULL
       WHERE user_id = $1`,
      [tenant_id],
    );

    // Restore approval status to approved
    await db.query(
      `UPDATE tenant_approvals SET status = 'approved' WHERE tenant_id = $1 AND landlord_id = $2 AND status = 'removed'`,
      [tenant_id, landlord_id],
    );

    // Restore their most recent lease for this landlord
    await db.query(
      `UPDATE leases
       SET lease_status = 'active'
       WHERE tenant_id = $1
         AND landlord_id = $2
         AND lease_status = 'terminated'
         AND lease_id = (
           SELECT lease_id FROM leases
           WHERE tenant_id = $1
             AND landlord_id = $2
             AND lease_status = 'terminated'
           ORDER BY created_at DESC
           LIMIT 1
         )`,
      [tenant_id, landlord_id],
    );

    return res.status(200).json({
      message: "Tenant account restored successfully.",
    });
  } catch (error) {
    next(error);
  }
};

// ── GET soft-deleted tenants for this landlord (Recycle Bin) ──────────────────
// Route: GET /api/tenants/deleted
// Auth:  verifyToken + requireRole('landlord')
const getDeletedTenants = async (req, res, next) => {
  try {
    const landlord_id = req.user.user_id;

    const result = await db.query(
      `SELECT
         u.user_id, u.full_name, u.username, u.email, u.phone_number,
         u.deleted_at, u.deletion_reason,
         EXTRACT(DAY FROM (NOW() - u.deleted_at))::INTEGER AS days_since_deletion,
         GREATEST(0, (30 - EXTRACT(DAY FROM (NOW() - u.deleted_at))::INTEGER)) AS days_remaining,
         r.room_number,
         p.property_name,
         ta.status AS approval_status
       FROM users u
       LEFT JOIN tenant_approvals ta
         ON ta.tenant_id = u.user_id
        AND ta.landlord_id = $1
       LEFT JOIN leases l
         ON l.tenant_id = u.user_id
        AND l.landlord_id = $1
       LEFT JOIN rooms r ON l.room_id = r.room_id
       LEFT JOIN properties p ON r.property_id = p.property_id
       WHERE u.deleted_at IS NOT NULL
         AND u.role = 'tenant'
         AND (ta.landlord_id = $1 OR l.landlord_id = $1)
         AND NOW() - u.deleted_at < INTERVAL '30 days'
       ORDER BY u.deleted_at DESC`,
      [landlord_id],
    );

    return res.status(200).json({
      message: "Deleted tenants retrieved successfully",
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
};

// ── UNASSIGN TENANT (Landlord removes tenant from room) ───────────────────────
// Route: PATCH /api/tenants/:tenant_id/unassign
// Auth: verifyToken + requireRole('landlord')
const unassignTenant = async (req, res, next) => {
  let client;
  try {
    const { tenant_id } = req.params;
    const landlord_id = req.user.user_id;

    // Confirm landlord has this tenant approval record OR lease
    const checkResult = await db.query(
      `SELECT approval_id FROM tenant_approvals WHERE tenant_id = $1 AND landlord_id = $2
       UNION
       SELECT lease_id FROM leases WHERE tenant_id = $1 AND landlord_id = $2`,
      [tenant_id, landlord_id],
    );

    if (checkResult.rows.length === 0) {
      return res
        .status(403)
        .json({ error: "You do not have permission to remove this tenant." });
    }

    // All removal mutations share one transaction so the tenant cannot be left
    // soft-deleted while their room or lease is still active.
    client = await db.pool().connect();
    await client.query("BEGIN");

    const deletedResult = await client.query(
      `UPDATE users
       SET deleted_at = NOW(), deletion_reason = 'Unassigned by landlord'
       WHERE user_id = $1 AND role = 'tenant'
       RETURNING user_id`,
      [tenant_id],
    );

    if (deletedResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Tenant not found." });
    }

    // Find active leases for this tenant under this landlord. Rooms are linked
    // through leases; rooms do not have a tenant_id column in this schema.
    const leasesRes = await client.query(
      `SELECT lease_id, room_id FROM leases
       WHERE tenant_id = $1
         AND landlord_id = $2
         AND lease_status = 'active'
       FOR UPDATE`,
      [tenant_id, landlord_id],
    );

    // Free each room and close its lease, recording the removal date.
    for (const row of leasesRes.rows) {
      if (row.room_id) {
        await client.query(
          `UPDATE rooms SET is_occupied = 0 WHERE room_id = $1`,
          [row.room_id],
        );
      }
      await client.query(
        `UPDATE leases
         SET lease_status = 'terminated', end_date = CURRENT_DATE
         WHERE lease_id = $1`,
        [row.lease_id],
      );
    }

    // Mark approval status as removed
    await client.query(
      `UPDATE tenant_approvals SET status = 'removed' WHERE tenant_id = $1 AND landlord_id = $2`,
      [tenant_id, landlord_id],
    );

    await client.query("COMMIT");

    return res
      .status(200)
      .json({
        message:
          "Tenant removed from room and moved to recycle bin. Recovery available for 30 days.",
      });
  } catch (error) {
    if (client) await client.query("ROLLBACK").catch(() => {});
    console.error("[UNASSIGN TENANT ERROR]", error);
    return res.status(500).json({ error: error.message });
  } finally {
    client?.release();
  }
};

module.exports = {
  softDeleteTenant,
  restoreTenant,
  getDeletedTenants,
  unassignTenant,
};
