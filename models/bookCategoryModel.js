const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    parentCategory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        default: null
    },
    isVisible: {
        type: Boolean,
        default: true  // Varsayılan olarak kategori görünür olacak
    }
});

module.exports = mongoose.models.Category || mongoose.model('Category', categorySchema);
