const express = require('express');
const { verifyToken } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const {
  getDeletedProperties,
  getDeletedTenants,
  recoverProperty,
  recoverTenant,
} = require('../controllers/recycleBin.controller');

const router = express.Router();
router.use(verifyToken, requireRole('landlord'));
router.get('/properties', getDeletedProperties);
router.get('/tenants', getDeletedTenants);
router.put('/properties/:id/recover', recoverProperty);
router.put('/tenants/:id/recover', recoverTenant);

module.exports = router;
