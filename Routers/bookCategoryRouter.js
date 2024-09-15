const express = require('express');
const Category = require('../models/bookCategoryModel.js');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');

const router = express.Router();

// Kategori Yaratma
router.post('/createCategory', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ message: 'Kategori adı gereklidir' });
        }

        // Kategori isminin benzersiz olduğundan emin olun
        const existingCategory = await Category.findOne({ name });
        if (existingCategory) {
            return res.status(400).json({ message: 'Bu kategori zaten mevcut' });
        }

        const newCategory = new Category({ name });
        await newCategory.save();

        res.status(201).json({ message: 'Kategori başarıyla oluşturuldu', category: newCategory });
    } catch (error) {
        console.error("Kategori oluşturulurken hata:", error);
        res.status(500).json({ message: 'Kategori oluşturma başarısız' });
    }
});

// Kategori Silme
router.delete('/deleteCategory/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        const category = await Category.findById(id);
        if (!category) {
            return res.status(404).json({ message: 'Kategori bulunamadı' });
        }

        await Category.findByIdAndDelete(id);

        res.status(200).json({ message: 'Kategori başarıyla silindi' });
    } catch (error) {
        console.error("Kategori silinirken hata:", error);
        res.status(500).json({ message: 'Kategori silme başarısız', error: error.message });
    }
});


// Kategorileri Listeleme (Bu işlemi herkes yapabilir, ancak sadece görünür kategoriler)
router.get('/listCategories', async (req, res) => {
    try {
        const categories = await Category.find({ isVisible: true }).populate('parentCategory', 'name');
        res.status(200).json(categories);
    } catch (error) {
        console.error("Kategoriler listelenirken hata:", error);
        res.status(500).json({ message: 'Kategoriler listelenemedi' });
    }
});

// Admin kategorileri görüntüleyebilir (gizli kategoriler dahil)
router.get('/adminListCategories', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const categories = await Category.find().populate('parentCategory', 'name');
        res.status(200).json(categories);
    } catch (error) {
        console.error("Kategoriler listelenirken hata:", error);
        res.status(500).json({ message: 'Kategoriler listelenemedi' });
    }
});


// Kategori Güncelleme
router.put('/updateCategory/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ message: 'Kategori adı gereklidir' });
        }

        const category = await Category.findById(id);
        if (!category) {
            return res.status(404).json({ message: 'Kategori bulunamadı' });
        }

        category.name = name;
        await category.save();

        res.status(200).json({ message: 'Kategori başarıyla güncellendi', category });
    } catch (error) {
        console.error("Kategori güncellenirken hata:", error);
        res.status(500).json({ message: 'Kategori güncelleme başarısız' });
    }
});

// Kategori güncellemeye ek olarak görünürlüğü değiştiren endpoint
router.put('/toggleVisibility/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const category = await Category.findById(id);
        
        if (!category) {
            return res.status(404).json({ message: 'Kategori bulunamadı' });
        }

        category.isVisible = !category.isVisible; // Kategorinin görünürlüğünü değiştir
        await category.save();

        res.status(200).json({ message: 'Kategori görünürlüğü başarıyla değiştirildi', category });
    } catch (error) {
        console.error("Kategori görünürlüğü değiştirilirken hata:", error);
        res.status(500).json({ message: 'Kategori görünürlüğü değiştirme başarısız' });
    }
});


module.exports = router;
