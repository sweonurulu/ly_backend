// pdfRouter.js
const express = require('express');
const BookPreviewPDF = require('../models/BookPreviewPDFModel'); // Önizleme PDF modeli
const router = express.Router();
const BookPDF = require('../models/BookPdfModel');
const Rental = require('../models/rentalModel');
const authMiddleware = require("../middlewares/authMiddleware"); // Auth middleware'i import edin


// PDF önizlemesini görüntülemek için GET rotası
router.get('/review-pdfviewer/:bookId', async (req, res) => {
    try {
        //console.log("backenddeyiz");
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

// PDF dosyasını almak için route
router.get('/books/pdf/:bookId', async (req, res) => {
  const { bookId } = req.params;

  try {
    // MongoDB'den base64 PDF verisini al
    const bookPdf = await BookPDF.findOne({ bookId });
    if (!bookPdf) {
      return res.status(404).json({ message: 'PDF bulunamadı.' });
    }

    // Base64 PDF'yi geri döndür
    res.json({
      pdfFile: bookPdf.ebookPdf.pdfFile,
      contentType: bookPdf.ebookPdf.contentType
    });
  } catch (error) {
    console.error('PDF alınırken hata oluştu:', error);
    res.status(500).json({ message: 'PDF alınamadı.' });
  }
});




module.exports = router;
