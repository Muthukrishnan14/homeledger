const express = require('express');
const router = express.Router();
const { getActivityLogs, getRecentForSubCategory } = require('../controllers/activityLogController');

router.get('/', getActivityLogs);
router.get('/recent', getRecentForSubCategory);

module.exports = router;
