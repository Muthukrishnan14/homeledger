const mongoose = require('mongoose');

const subCategorySchema = new mongoose.Schema({
  name:       { type: String, required: true },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  isFixed:    { type: Boolean, default: true },   // false = user-created ad-hoc row
}, { timestamps: true });

module.exports = mongoose.model('SubCategory', subCategorySchema);
