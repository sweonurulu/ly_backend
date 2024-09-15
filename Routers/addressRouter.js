const express = require('express');
const Address = require('../models/addressModel');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

// Adres ekle
router.post('/:userId/add', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const { title, addressLine1, addressLine2, city, district, zipCode } = req.body;

    const newAddress = new Address({
      userId,
      title,
      addressLine1,
      addressLine2,
      city,
      district,
      zipCode,
    });

    const savedAddress = await newAddress.save();
    res.status(201).json(savedAddress);
  } catch (error) {
    res.status(500).json({ message: "Adres eklenirken bir hata oluştu." });
  }
});

// Adres güncelle
router.put('/:userId/update/:addressId', authMiddleware, async (req, res) => {
  try {
    const { userId, addressId } = req.params;
    const { title, addressLine1, addressLine2, city, district, zipCode } = req.body;

    const updatedAddress = await Address.findOneAndUpdate(
      { _id: addressId, userId },
      { title, addressLine1, addressLine2, city, district, zipCode },
      { new: true }
    );

    if (!updatedAddress) return res.status(404).json({ message: "Adres bulunamadı." });
    res.json(updatedAddress);
  } catch (error) {
    res.status(500).json({ message: "Adres güncellenirken bir hata oluştu." });
  }
});

// Adres sil
router.delete('/:userId/delete/:addressId', authMiddleware, async (req, res) => {
  try {
    const { userId, addressId } = req.params;
    const deletedAddress = await Address.findOneAndDelete({ _id: addressId, userId });

    if (!deletedAddress) return res.status(404).json({ message: "Adres bulunamadı." });
    res.json({ message: "Adres silindi." });
  } catch (error) {
    res.status(500).json({ message: "Adres silinirken bir hata oluştu." });
  }
});

// Get user's addresses
router.get('/:userId', authMiddleware, async (req, res) => {
    try {
      const { userId } = req.params;
      const addresses = await Address.find({ userId });
      res.json(addresses);
    } catch (error) {
      res.status(500).json({ message: "Adresler alınırken hata oluştu." });
    }
  });

module.exports = router;
