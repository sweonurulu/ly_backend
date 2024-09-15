const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
    bookName: {
        type: String,
        required: true,
    },
    bookImg: {
        image: {
            type: Buffer,  // Resim verisi burada saklanacak
            required: true,
        },
        contentType: {
            type: String,  // Resim formatı burada saklanacak (örneğin, 'image/png')
            required: true,
        }
    },
    bookDescription: {
        type: String,
        required: false,
    },
    bookCreatedDate: {
        type: Date,
        default: Date.now,  // Kitap oluşturulurken otomatik olarak tarihi kaydeder
    },
    bookCategory: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category',
            required: true,
        }
    ], // Birden fazla kategoriye izin vermek için Array formatında
    price: {
        type: Number,
        required: true,
    },
    threeMonthRentalPrice: {
        type: Number,
        required: false,
    },
    sixMonthRentalPrice: {
        type: Number,
        required: false,
    },
    oneYearRentalPrice: {
        type: Number,
        required: false,
    },
    bookPdfUploaded: {
        type: Boolean,
        required: true,
        default: false,
    },
    bookReviewPdfUploaded: {
        type: Boolean,
        required: true,
        default: false,
    },
    publisher: {
        type: String,
        required: false,
    },
    pageCount: {
        type: String,
        required: false,
    },
    publishDate: {
        type: Number,
        required: false,
    },
    bindingType: {
        type: String,
        required: false,
    },
    edition: {
        type: String,
        required: false,
    },
    language: {
        type: String,
        required: false,
        default: 'Türkçe',
    },
    dimensions: {
        type: String,
        required: false,
    },
    authors: {
        type: [String],
        required: true,
    },
    isbn: {
        type: String,
        required: false,
    },
});

module.exports = mongoose.models.Book || mongoose.model('Book', bookSchema);
