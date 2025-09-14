const express = require('express');
const { protect } = require('../middleware/auth');
const walletController = require('../controllers/walletController');

const router = express.Router();

router.post('/withdraw', protect, walletController.withdraw);

module.exports = router;