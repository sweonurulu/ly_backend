// pdfRouter.js
const express = require('express');
const BookPreviewPDF = require('../models/BookPreviewPDFModel'); // Önizleme PDF modeli
const router = express.Router();

// PDF önizlemesini görüntülemek için GET rotası
router.get('/review-pdfviewer/:bookId', async (req, res) => {
    try {
        console.log("backenddeyiz");
        const { bookId } = req.params;
        const bookPreview = await BookPreviewPDF.findOne({ bookId });

        if (!bookPreview || !bookPreview.previewPdf) {
            return res.status(404).json({ message: 'Kitap önizlemesi bulunamadı.' });
        }

        res.set({
            'Content-Type': bookPreview.previewPdf.contentType,
            'Content-Disposition': 'inline',
        });

        // Base64 verisini buffer'a çevirip gönderiyoruz
        return res.send(Buffer.from(bookPreview.previewPdf.pdfFile, 'base64'));
    } catch (error) {
        console.log(error);
        console.error('PDF önizleme alınırken hata oluştu:', error);
        return res.status(500).json({ message: 'PDF önizleme görüntülenemedi.' });
    }
});

module.exports = router;
