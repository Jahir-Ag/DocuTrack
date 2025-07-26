const express = require('express');
const router = express.Router();
const admin = require('../controllers/adminController');

router.get('/requests', admin.getAllRequests);
router.put('/update-status', admin.updateStatus);

module.exports = router;
