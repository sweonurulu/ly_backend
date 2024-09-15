const express = require('express');
const Contact = require('../models/contactModel.js');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');

const router = express.Router();

// Kullanıcıların gönderdiği mesajları listeleme (sadece adminler)
router.get('/admin-messages', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const messages = await Contact.find({});
    res.status(200).json(messages);
  } catch (error) {
    console.error("Mesajlar listelenirken hata:", error);
    res.status(500).json({ message: 'Mesajlar listelenemedi.' });
  }
});

router.post('/send-message', async (req, res) => {
  try {
    const { name, surname, email, phoneNumber, message } = req.body;

    if (!name || !surname || !email || !phoneNumber || !message) {
      return res.status(400).json({ message: 'Tüm alanlar doldurulmalıdır.' });
    }

    const newContact = new Contact({
      name,
      surname,
      email,
      phoneNumber,
      message,
    });

    await newContact.save();
    res.status(200).json({ message: 'Mesajınız alındı.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Mesaj gönderilirken bir hata oluştu.' });
  }
});

module.exports = router;
