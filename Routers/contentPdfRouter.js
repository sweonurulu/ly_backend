const express = require('express');
const ContentPdf = require('../models/contentPdfModel');
const multer = require('multer');
const mongoose = require('mongoose');

const router = express.Router();
const ObjectId = mongoose.Types.ObjectId; // ObjectId'yi kullanarak validasyon yapıyoruz

// Multer konfigürasyonu (disk storage kullanmadan bellekte tut)
const upload = multer();

// PDF yükleme ve güncelleme
router.put('/update-pdf', upload.single('pdf'), async (req, res) => {
    const { name, isHidden } = req.body;  // Form'dan gelen PDF ismi ve gizlilik durumu

    if (!req.file || !name) {
        return res.status(400).json({ message: 'PDF dosyası ve adı gereklidir.' });
    }

    try {
        // Base64 formatına dönüştür
        const pdfBase64 = req.file.buffer.toString('base64');

        // Veritabanına kaydet
        const updatedPdf = await ContentPdf.findOneAndUpdate(
            { name }, // Dosya ismine göre arama
            {
                contentType: req.file.mimetype,
                pdfData: pdfBase64, // Base64 olarak kaydediyoruz
                isHidden: isHidden || false // isHidden değeri varsayılan olarak false gelir
            },
            { new: true, upsert: true } // Eğer yeni ise oluştur
        );

        res.status(200).json({ message: `${name} PDF güncellendi.` });
    } catch (error) {
        console.error(`Error updating ${name} PDF:`, error);
        res.status(500).json({ message: `${name} PDF güncellenemedi.` });
    }
});

// Tüm PDF başlıklarını listeleyen route
router.get('/list-pdf-titles', async (req, res) => {
    try {
        const pdfs = await ContentPdf.find({}, 'name isHidden'); // PDF başlıklarını ve isHidden durumunu döner
        res.status(200).json(pdfs);
    } catch (error) {
        console.error(`Error fetching PDF titles:`, error);
        res.status(500).json({ message: 'PDF başlıkları getirilemedi.' });
    }
});

// MongoDB'deki `_id` ile PDF getirme route'u
/*
router.get('/get-pdf/:id', async (req, res) => {
    const { id } = req.params;
  
    try {
      const pdf = await ContentPdf.findById(id);
      if (!pdf) {
        console.log('PDF bulunamadı.');
        return res.status(404).json({ message: 'PDF bulunamadı.' });
      }
    
      // Base64 verisini buffer'a çevirip PDF olarak gönder
      const pdfBuffer = Buffer.from(pdf.pdfData, 'base64');
      res.setHeader('Content-Type', pdf.contentType); // PDF'nin content type'ı
      res.send(pdfBuffer); // PDF verisini buffer olarak gönder
    } catch (error) {
      console.error('PDF getirme hatası:', error);
      res.status(500).json({ message: 'PDF alınamadı.' });
    }
  });
  */
  router.get('/get-pdf/:id', async (req, res) => {
    const { id } = req.params;
  
    try {
      const pdf = await ContentPdf.findById(id);
      if (!pdf) {
        console.log('PDF bulunamadı.');
        return res.status(404).json({ message: 'PDF bulunamadı.' });
      }
    
      // PDF başlıklarını ekleyin
      res.set({
        'Content-Type': pdf.contentType, // PDF'nin content type'ı
        'Content-Disposition': 'inline' // Tarayıcıda görüntüleme
      });
    
      //console.log(pdf.pdfData);
      res.send(pdf.pdfData); // PDF verisini gönder
    } catch (error) {
      console.error('PDF getirme hatası:', error);
      res.status(500).json({ message: 'PDF alınamadı.' });
    }
});


// Yeni PDF dosyası oluşturma
router.post('/create-pdf', upload.single('pdf'), async (req, res) => {
    const { name, isHidden } = req.body; // Form'dan gelen PDF ismi ve gizlilik durumu

    if (!req.file || !name) {
        return res.status(400).json({ message: 'PDF dosyası ve adı gereklidir.' });
    }

    try {
        // Base64 formatına dönüştür
        const pdfBase64 = req.file.buffer.toString('base64');

        // Yeni bir PDF kaydı oluştur
        const newPdf = new ContentPdf({
            name,
            contentType: req.file.mimetype,
            pdfData: pdfBase64, // Base64 olarak kaydediyoruz
            isHidden: isHidden || false, // isHidden değeri varsayılan olarak false gelir
        });

        // Veritabanına kaydet
        await newPdf.save();

        res.status(201).json({ message: `${name} PDF başarıyla oluşturuldu.` });
    } catch (error) {
        console.error(`Error creating ${name} PDF:`, error);
        res.status(500).json({ message: `${name} PDF oluşturulamadı.` });
    }
});

// PDF silme
router.delete('/delete-pdf/:name', async (req, res) => {
    const { name } = req.params; // URL'den gelen PDF ismi

    try {
        const deletedPdf = await ContentPdf.findOneAndDelete({ name });

        if (!deletedPdf) {
            return res.status(404).json({ message: 'PDF bulunamadı.' });
        }

        res.status(200).json({ message: `${name} PDF başarıyla silindi.` });
    } catch (error) {
        console.error(`Error deleting ${name} PDF:`, error);
        res.status(500).json({ message: `${name} PDF silinemedi.` });
    }
});

module.exports = router;
