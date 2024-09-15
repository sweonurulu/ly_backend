// routers/contentRouter.js
const express = require('express');
const Content = require('../models/contentModel');
const router = express.Router();

// İçerik verilerini çekme
router.get('/get-content', async (req, res) => {
    try {
        const content = await Content.findOne({});
        if (!content) {
            return res.status(404).json({ message: 'İçerik bulunamadı.' });
        }
        res.status(200).json(content);
    } catch (error) {
        console.error('İçerik alınırken hata oluştu:', error);
        res.status(500).json({ message: 'İçerik alınırken bir hata oluştu.' });
    }
});

// Hakkımızda metnini güncelleme
router.put('/update-about-us', async (req, res) => {
    try {
        const { aboutUsContent } = req.body;

        if (!aboutUsContent) {
            return res.status(400).json({ message: 'Hakkımızda içeriği gereklidir.' });
        }

        const updatedContent = await Content.findOneAndUpdate(
            {}, 
            { aboutUsContent },
            { new: true, upsert: true }
        );

        res.status(200).json(updatedContent);
    } catch (error) {
        console.error('Error updating about us content:', error);
        res.status(500).json({ message: 'Hakkımızda içeriği güncellenemedi.' });
    }
});

// Müşteri Hizmetleri metnini güncelleme
router.put('/update-customer-service', async (req, res) => {
    try {
        const { customerServiceContent } = req.body;

        if (!customerServiceContent) {
            return res.status(400).json({ message: 'Müşteri Hizmetleri içeriği gereklidir.' });
        }

        const updatedContent = await Content.findOneAndUpdate(
            {}, 
            { customerServiceContent },
            { new: true, upsert: true }
        );

        res.status(200).json(updatedContent);
    } catch (error) {
        console.error('Error updating customer service content:', error);
        res.status(500).json({ message: 'Müşteri Hizmetleri içeriği güncellenemedi.' });
    }
});

// Kitap sipariş metnini güncelleme
router.put('/update-book-order', async (req, res) => {
    try {
        const { bookOrderContent } = req.body;

        if (!bookOrderContent) {
            return res.status(400).json({ message: 'Kitap sipariş içeriği gereklidir.' });
        }

        const updatedContent = await Content.findOneAndUpdate(
            {}, 
            { bookOrderContent },
            { new: true, upsert: true }
        );

        res.status(200).json(updatedContent);
    } catch (error) {
        console.error('Error updating book order content:', error);
        res.status(500).json({ message: 'Kitap sipariş içeriği güncellenemedi.' });
    }
});

// Kitap sipariş mesajını döndüren endpoint
router.get('/get-book-order-content', async (req, res) => {
    try {
      const content = await Content.findOne({});
      if (content && content.bookOrderContent) {
        res.status(200).json({ message: content.bookOrderContent });
      } else {
        res.status(404).json({ message: 'Kitap sipariş içeriği bulunamadı.' });
      }
    } catch (error) {
      console.error("Kitap sipariş içeriği alınırken hata:", error);
      res.status(500).json({ message: 'Kitap sipariş içeriği alınamadı.' });
    }
  });


// Uluslararası Yayın Belgesi URL'sini güncelleme
router.put('/update-international-publication-url', async (req, res) => {
    try {
        const { internationalPublicationURL } = req.body;

        if (!internationalPublicationURL) {
            return res.status(400).json({ message: 'Uluslararası Yayın Belgesi URL\'si gereklidir.' });
        }

        const updatedContent = await Content.findOneAndUpdate(
            {}, 
            { internationalPublicationURL },
            { new: true, upsert: true }
        );

        res.status(200).json(updatedContent);
    } catch (error) {
        console.error('Error updating international publication URL:', error);
        res.status(500).json({ message: 'Uluslararası Yayın Belgesi URL\'si güncellenemedi.' });
    }
});

// Kaynakça URL'sini güncelleme
router.put('/update-references-url', async (req, res) => {
    try {
        const { referencesURL } = req.body;

        if (!referencesURL) {
            return res.status(400).json({ message: 'Kaynakça URL\'si gereklidir.' });
        }

        const updatedContent = await Content.findOneAndUpdate(
            {}, 
            { referencesURL },
            { new: true, upsert: true }
        );

        res.status(200).json(updatedContent);
    } catch (error) {
        console.error('Error updating references URL:', error);
        res.status(500).json({ message: 'Kaynakça URL\'si güncellenemedi.' });
    }
});
  
module.exports = router;
