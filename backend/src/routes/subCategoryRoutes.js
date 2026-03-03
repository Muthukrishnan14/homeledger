const express = require('express');
const router = express.Router();
const {
  getSubCategories,
  createSubCategory,
  updateSubCategory,
  deleteSubCategory
} = require('../controllers/subCategoryController');

router.get('/', getSubCategories);
router.post('/', createSubCategory);
router.put('/:id', updateSubCategory);
router.delete('/:id', deleteSubCategory);

module.exports = router;