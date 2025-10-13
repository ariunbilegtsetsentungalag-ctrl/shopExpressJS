const Category = require('../models/Category');
const Product = require('../models/Product');

const adminCategoryController = {

  async viewCategories(req, res) {
    try {
      const categories = await Category.find().populate('createdBy', 'username').sort({ createdAt: -1 });
      
      const categoryCounts = {};
      for (const category of categories) {
        const count = await Product.countDocuments({ category: category.name });
        categoryCounts[category.name] = count;
      }
      
      res.render('admin/categories', {
        title: 'Category Management',
        categories,
        categoryCounts
      });
    } catch (error) {
      console.error('Error fetching categories:', error);
      req.flash('error', 'Error loading categories');
      res.redirect('/admin');
    }
  },

  async addCategory(req, res) {
    try {
      const { name, description } = req.body;
      
      if (!name || !name.trim()) {
        req.flash('error', 'Category name is required');
        return res.redirect('/admin/categories');
      }

      const existingCategory = await Category.findOne({ 
        name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } 
      });
      
      if (existingCategory) {
        req.flash('error', 'Category already exists');
        return res.redirect('/admin/categories');
      }

      const category = new Category({
        name: name.trim(),
        description: description?.trim() || '',
        createdBy: req.session.user.id
      });

      await category.save();
      req.flash('success', `Category "${name.trim()}" added successfully`);
      res.redirect('/admin/categories');
    } catch (error) {
      console.error('Error adding category:', error);
      req.flash('error', 'Error adding category');
      res.redirect('/admin/categories');
    }
  },

  async updateCategory(req, res) {
    try {
      const { id } = req.params;
      const { name, description, isActive } = req.body;

      if (!name || !name.trim()) {
        req.flash('error', 'Category name is required');
        return res.redirect('/admin/categories');
      }

      const category = await Category.findById(id);
      if (!category) {
        req.flash('error', 'Category not found');
        return res.redirect('/admin/categories');
      }

      const newName = name.trim();

      if (newName !== category.name) {
        const existingCategory = await Category.findOne({ 
          name: { $regex: new RegExp(`^${newName}$`, 'i') },
          _id: { $ne: id }
        });
        if (existingCategory) {
          req.flash('error', 'Category name already exists');
          return res.redirect('/admin/categories');
        }

        await Product.updateMany(
          { category: category.name },
          { category: newName }
        );
      }

      category.name = newName;
      category.description = description?.trim() || '';
      category.isActive = isActive === 'true';

      await category.save();
      req.flash('success', `Category "${newName}" updated successfully`);
      res.redirect('/admin/categories');
    } catch (error) {
      console.error('Error updating category:', error);
      req.flash('error', 'Error updating category');
      res.redirect('/admin/categories');
    }
  },

  async deleteCategory(req, res) {
    try {
      const { id } = req.params;

      const category = await Category.findById(id);
      if (!category) {
        req.flash('error', 'Category not found');
        return res.redirect('/admin/categories');
      }

      const productCount = await Product.countDocuments({ category: category.name });
      if (productCount > 0) {
        req.flash('error', `Cannot delete category "${category.name}". It has ${productCount} products. Move or delete products first.`);
        return res.redirect('/admin/categories');
      }

      await Category.findByIdAndDelete(id);
      req.flash('success', `Category "${category.name}" deleted successfully`);
      res.redirect('/admin/categories');
    } catch (error) {
      console.error('Error deleting category:', error);
      req.flash('error', 'Error deleting category');
      res.redirect('/admin/categories');
    }
  }
};

module.exports = adminCategoryController;