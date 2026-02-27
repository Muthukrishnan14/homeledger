const Transaction = require('../models/Transaction');

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
    res.status(201).json(saved);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const updateTransaction = async (req, res) => {
  try {
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
    if (!updated) return res.status(404).json({ message: 'Transaction not found' });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteTransaction = async (req, res) => {
  try {
    const deleted = await Transaction.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Transaction not found' });
    res.json({ message: 'Transaction deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getTransactions, createTransaction, updateTransaction, deleteTransaction };