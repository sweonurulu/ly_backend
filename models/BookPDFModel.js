const mongoose = require('mongoose');

const bookPDFSchema = new mongoose.Schema({
    bookId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Book',
        required: true
    },
    ebookPdf: {
        pdfFile: {
            type: String, // Base64 formatında PDF dosyası
            required: true
        },
        contentType: {
            type: String, // PDF dosyasının MIME türü
            required: true
        }
    },
    uploadedAt: {
        type: Date,
        default: Date.now
    }
});

// Eğer model zaten tanımlıysa mevcut modeli kullan, değilse yeni modeli oluştur
module.exports = mongoose.models.BookPDF || mongoose.model('BookPDF', bookPDFSchema);
