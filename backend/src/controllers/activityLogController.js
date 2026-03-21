const ActivityLog = require('../models/ActivityLog');

const getActivityLogs = async (req, res) => {
  try {
    const filter = {};
    if (req.query.month) {
      const [year, month] = req.query.month.split('-');
      const start = new Date(`${year}-${month}-01T00:00:00.000Z`);
      const end = new Date(
        month === '12'
          ? `${parseInt(year) + 1}-01-01T00:00:00.000Z`
          : `${year}-${String(parseInt(month) + 1).padStart(2, '0')}-01T00:00:00.000Z`
      );
      filter.date = { $gte: start, $lt: end };
    }
    const logs = await ActivityLog.find(filter)
      .populate({
        path: 'subCategoryId',
        select: 'name categoryId',
        populate: { path: 'categoryId', select: 'name' }
      })
      .sort({ createdAt: -1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getRecentForSubCategory = async (req, res) => {
  try {
    const { subCategoryId, hours = 4 } = req.query;
    if (!subCategoryId) {
      return res.status(400).json({ message: 'subCategoryId is required' });
    }
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    const logs = await ActivityLog.find({
      subCategoryId,
      action: 'added',
      createdAt: { $gte: since }
    }).sort({ createdAt: -1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getActivityLogs, getRecentForSubCategory };
