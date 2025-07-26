const express = require('express');
const router = express.Router();
const request = require('../controllers/requestController');

router.post('/create', request.createRequest);
router.get('/user/:userId', request.getUserRequests);

module.exports = router;
