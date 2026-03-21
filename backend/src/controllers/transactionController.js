const Transaction = require('../models/Transaction');
const ActivityLog = require('../models/ActivityLog');

const getTransactions = async (req, res) => {
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
    const transactions = await Transaction.find(filter)
      .populate({
        path: 'subCategoryId',
        populate: { path: 'categoryId', select: 'name' }
      })
      .sort({ date: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createTransaction = async (req, res) => {
  try {
    const transaction = new Transaction({
      subCategoryId: req.body.subCategoryId,
      amount: req.body.amount,
      date: new Date(req.body.date),
      note: req.body.note || ''
    });
    const saved = await transaction.save();

    await ActivityLog.create({
      action: 'added',
      transactionId: saved._id,
      subCategoryId: saved.subCategoryId,
      amount: saved.amount,
      date: saved.date,
      note: saved.note
    });

    res.status(201).json(saved);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const updateTransaction = async (req, res) => {
  try {
    const existing = await Transaction.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Transaction not found' });

    const previousAmount = existing.amount;

    const updated = await Transaction.findByIdAndUpdate(
      req.params.id,
      {
        subCategoryId: req.body.subCategoryId,
        amount: req.body.amount,
        date: new Date(req.body.date),
        note: req.body.note
      },
      { new: true }
    );

    if (previousAmount !== req.body.amount) {
      await ActivityLog.create({
        action: 'edited',
        transactionId: updated._id,
        subCategoryId: updated.subCategoryId,
        amount: updated.amount,
        previousAmount,
        date: updated.date
      });
    }

    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteTransaction = async (req, res) => {
  try {
    const existing = await Transaction.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Transaction not found' });

    await Transaction.findByIdAndDelete(req.params.id);

    await ActivityLog.create({
      action: 'deleted',
      transactionId: existing._id,
      subCategoryId: existing.subCategoryId,
      amount: existing.amount,
      date: existing.date
    });

    res.json({ message: 'Transaction deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getTransactions, createTransaction, updateTransaction, deleteTransaction };
