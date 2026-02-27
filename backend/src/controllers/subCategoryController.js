const SubCategory = require('../models/SubCategory');

const getSubCategories = async (req, res) => {
  try {
    const filter = {};
    if (req.query.categoryId) filter.categoryId = req.query.categoryId;
    const subCategories = await SubCategory.find(filter).populate('categoryId', 'name');
    res.json(subCategories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createSubCategory = async (req, res) => {
  try {
    const subCategory = new SubCategory({
      name: req.body.name,
      categoryId: req.body.categoryId,
      isFixed: req.body.isFixed || false
    });
    const saved = await subCategory.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const updateSubCategory = async (req, res) => {
  try {
    const updated = await SubCategory.findByIdAndUpdate(
      req.params.id,
      { name: req.body.name, isFixed: req.body.isFixed },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: 'SubCategory not found' });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteSubCategory = async (req, res) => {
  try {
    const deleted = await SubCategory.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'SubCategory not found' });
    res.json({ message: 'SubCategory deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getSubCategories, createSubCategory, updateSubCategory, deleteSubCategory };