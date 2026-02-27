const mongoose = require('mongoose');

const subCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  isFixed: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('SubCategory', subCategorySchema);