// controllers/property.controller.js
const pool = require('../config/db');
const { asyncHandler } = require('../utils/asyncHandler');

const createProperty = asyncHandler(async (req, res) => {
    const {
      property_name,
      state,
      lga,
      address,
      city,
      total_rooms,
      default_room_type,
      default_yearly_rent,
      allow_partial_payment,
    } = req.body;
    const landlordId = req.user.user_id;

    if (!property_name || !address) {
      return res.status(400).json({
        error: 'Property name and address are required.',
      });
    }

    // Check for duplicate property name for this landlord
    const existingProp = await pool.query(
      `SELECT property_id FROM properties
       WHERE landlord_id = $1
         AND LOWER(TRIM(property_name)) = LOWER(TRIM($2))
         AND deleted_at IS NULL`,
      [landlordId, property_name]
    );
    if (existingProp.rows.length > 0) {
      return res.status(409).json({
        error: `You already have a property named "${property_name}". Please use a different name.`,
      });
    }

    const numRooms = parseInt(total_rooms, 10);
    if (!numRooms || numRooms < 1 || numRooms > 500) {
      return res.status(400).json({
        error: 'Total rooms must be a number between 1 and 500.',
      });
    }

    const yearlyRent = parseFloat(default_yearly_rent) || 0;
    if (yearlyRent < 0) {
      return res.status(400).json({
        error: 'Yearly rent cannot be negative.',
      });
    }

    const monthlyRent = yearlyRent > 0 ? Number((yearlyRent / 12).toFixed(2)) : 0;

    const validRoomTypes = ['single', 'shared', 'self_contain'];
    const roomType = validRoomTypes.includes(default_room_type) ? default_room_type : 'single';
    const allowPartial = typeof allow_partial_payment === 'string'
      ? allow_partial_payment === 'true'
      : Boolean(allow_partial_payment);

    const propertyResult = await pool.query(
      `INSERT INTO properties
        (landlord_id, property_name, state, lga, address, city, total_rooms, allow_partial_payment)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING property_id, property_name, state, lga, address, city, total_rooms, allow_partial_payment`,
      [landlordId, property_name, state || null, lga || null, address, city || lga || 'Ogbomoso', numRooms, allowPartial]
    );

    const property = propertyResult.rows[0];

    const valuePlaceholders = [];
    const valueParams = [];
    let paramIndex = 1;

    for (let roomIndex = 1; roomIndex <= numRooms; roomIndex += 1) {
      valuePlaceholders.push(`($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3})`);
      valueParams.push(
        property.property_id,
        `Room ${roomIndex}`,
        roomType,
        monthlyRent
      );
      paramIndex += 4;
    }

    await pool.query(
      `INSERT INTO rooms
        (property_id, room_number, room_type, monthly_rent)
       VALUES ${valuePlaceholders.join(', ')}`,
      valueParams
    );

    return res.status(201).json({
      message: `Property created with ${numRooms} rooms generated automatically.`,
      property: {
        property_id: property.property_id,
        property_name: property.property_name,
        state: property.state,
        lga: property.lga,
        address: property.address,
        city: property.city,
        total_rooms: property.total_rooms,
        allow_partial_payment: property.allow_partial_payment,
        rooms_created: numRooms,
      },
    });
});

const getProperties = asyncHandler(async (req, res) => {
    const landlord_id = req.user.user_id;

    // Exclude soft-deleted properties
    const propertiesResult = await pool.query(
      `SELECT property_id, landlord_id, property_name, state, lga, address, city, total_rooms, allow_partial_payment, created_at, updated_at
       FROM properties
       WHERE landlord_id = $1
         AND deleted_at IS NULL
       ORDER BY created_at DESC`,
      [landlord_id]
    );

    return res.status(200).json({
      message: 'Properties retrieved successfully',
      data: propertiesResult.rows,
    });
});

const getPropertyById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const landlord_id = req.user.user_id;

    const propertiesResult = await pool.query(
      `SELECT property_id, landlord_id, property_name, state, lga, address, city, total_rooms, allow_partial_payment, created_at, updated_at
       FROM properties
       WHERE property_id = $1
         AND landlord_id = $2
         AND deleted_at IS NULL`,
      [id, landlord_id]
    );

    if (propertiesResult.rows.length === 0) {
      return res.status(404).json({ error: 'Property not found' });
    }

    return res.status(200).json({
      message: 'Property retrieved successfully',
      data: propertiesResult.rows[0],
    });
});

const updateProperty = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { property_name, state, lga, address, city, total_rooms, allow_partial_payment } = req.body;
    const landlord_id = req.user.user_id;
    const normalizedAllowPartial = typeof allow_partial_payment === 'string'
      ? allow_partial_payment === 'true'
      : typeof allow_partial_payment === 'boolean'
        ? allow_partial_payment
        : null;

    const propertiesResult = await pool.query(
      'SELECT property_id FROM properties WHERE property_id = $1 AND landlord_id = $2 AND deleted_at IS NULL',
      [id, landlord_id]
    );

    if (propertiesResult.rows.length === 0) {
      return res.status(404).json({ error: 'Property not found' });
    }

    await pool.query(
      `UPDATE properties SET
         property_name = COALESCE($1, property_name),
         state         = COALESCE($2, state),
         lga           = COALESCE($3, lga),
         address       = COALESCE($4, address),
         city          = COALESCE($5, city),
         total_rooms   = COALESCE($6, total_rooms),
         allow_partial_payment = COALESCE($7, allow_partial_payment)
       WHERE property_id = $8`,
      [
        property_name || null,
        state || null,
        lga || null,
        address || null,
        city || lga || null,
        total_rooms || null,
        normalizedAllowPartial,
        id
      ]
    );

    return res.status(200).json({
      message: 'Property updated successfully',
    });
});

const softDeleteProperty = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const landlord_id = req.user.user_id;

    // Verify the property belongs to this landlord
    const propResult = await pool.query(
      'SELECT property_id FROM properties WHERE property_id = $1 AND landlord_id = $2 AND deleted_at IS NULL',
      [id, landlord_id]
    );

    if (propResult.rows.length === 0) {
      return res.status(404).json({ error: 'Property not found' });
    }

    // Check for active leases on this property's rooms
    const activeLeasesResult = await pool.query(
      `SELECT COUNT(*) FROM leases l
       JOIN rooms r ON l.room_id = r.room_id
       WHERE r.property_id = $1
         AND l.lease_status = 'active'`,
      [id]
    );

    if (parseInt(activeLeasesResult.rows[0].count) > 0) {
      return res.status(400).json({
        error: 'Cannot delete property with active tenants. Remove all tenants first.',
      });
    }

    // Soft delete property and all its rooms
    await pool.query(
      'UPDATE properties SET deleted_at = NOW() WHERE property_id = $1',
      [id]
    );
    await pool.query(
      'UPDATE rooms SET deleted_at = NOW() WHERE property_id = $1',
      [id]
    );

    return res.status(200).json({
      message: 'Property deleted. Recovery available for 30 days.',
    });
});

const restoreProperty = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const landlord_id = req.user.user_id;

    const propResult = await pool.query(
      `SELECT property_id, deleted_at,
              (NOW() - deleted_at) AS time_since_deletion
       FROM properties
       WHERE property_id = $1
         AND landlord_id = $2
         AND deleted_at IS NOT NULL`,
      [id, landlord_id]
    );

    if (propResult.rows.length === 0) {
      return res.status(404).json({ error: 'Deleted property not found' });
    }

    // Check 30-day window
    const deletedAt = new Date(propResult.rows[0].deleted_at);
    const daysSinceDelete = (Date.now() - deletedAt.getTime()) / 86400000;

    if (daysSinceDelete >= 30) {
      return res.status(400).json({
        error: 'Recovery window has expired. This property has been permanently deleted.',
      });
    }

    await pool.query(
      'UPDATE properties SET deleted_at = NULL WHERE property_id = $1',
      [id]
    );
    await pool.query(
      'UPDATE rooms SET deleted_at = NULL WHERE property_id = $1',
      [id]
    );

    return res.status(200).json({
      message: 'Property restored successfully.',
    });
});

const getDeletedProperties = asyncHandler(async (req, res) => {
    const landlord_id = req.user.user_id;

    const result = await pool.query(
      `SELECT
         property_id, property_name, address, city, total_rooms,
         deleted_at,
         EXTRACT(DAY FROM (NOW() - deleted_at))::INTEGER AS days_since_deletion,
         (30 - EXTRACT(DAY FROM (NOW() - deleted_at))::INTEGER) AS days_remaining
       FROM properties
       WHERE landlord_id = $1
         AND deleted_at IS NOT NULL
         AND NOW() - deleted_at < INTERVAL '30 days'
       ORDER BY deleted_at DESC`,
      [landlord_id]
    );

    return res.status(200).json({
      message: 'Deleted properties retrieved successfully',
      data: result.rows,
    });
});

module.exports = {
  createProperty,
  getProperties,
  getPropertyById,
  updateProperty,
  deleteProperty: softDeleteProperty, // backward-compat alias for existing route
  softDeleteProperty,
  restoreProperty,
  getDeletedProperties,
};
