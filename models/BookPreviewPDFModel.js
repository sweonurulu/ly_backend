const mongoose = require('mongoose');

const bookPreviewPDFSchema = new mongoose.Schema({
    bookId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Book',
        required: true
    },
    previewPdf: {
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

module.exports = mongoose.model('BookPreviewPDF', bookPreviewPDFSchema);
