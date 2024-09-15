const mongoose = require('mongoose');

const contentPdfSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true // PDF'lerin adlarının benzersiz olmasını sağlamak için
    },
    contentType: {
        type: String,
        required: true
    },
    pdfData: {
        type: Buffer,
        required: true
    },
    isHidden: { 
        type: Boolean, 
        default: false // Varsayılan olarak PDF içeriklerinin gizli olmadığını belirler
    }
});

module.exports = mongoose.models.ContentPdf || mongoose.model('ContentPdf', contentPdfSchema);
