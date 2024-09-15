const express = require('express');
const GeneralRentalPrice = require('../models/rentedPriceModel');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');

const router = express.Router();

// Tüm kitaplar için geçerli genel kiralama oranlarını getir
router.get('/list-rental-prices', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    console.log("backende istek geldi");
    const rentalPrice = await GeneralRentalPrice.findOne();

    if (!rentalPrice) {
      return res.status(404).json({ message: 'Kiralama oranları bulunamadı.' });
    }

    res.status(200).json(rentalPrice);
  } catch (error) {
    res.status(500).json({ message: 'Kiralama oranları alınırken bir hata oluştu.' });
  }
});

// Tüm kitaplar için geçerli genel kiralama oranlarını güncelle
router.put('/change-rental-prices', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { threeMonthPercentage, sixMonthPercentage, oneYearPercentage } = req.body;

    let rentalPrice = await GeneralRentalPrice.findOne();

    if (!rentalPrice) {
      rentalPrice = new GeneralRentalPrice({
        threeMonthPercentage,
        sixMonthPercentage,
        oneYearPercentage,
      });
    } else {
      rentalPrice.threeMonthPercentage = threeMonthPercentage;
      rentalPrice.sixMonthPercentage = sixMonthPercentage;
      rentalPrice.oneYearPercentage = oneYearPercentage;
    }

    await rentalPrice.save();

    res.status(200).json({ message: 'Kiralama oranları başarıyla güncellendi.', rentalPrice });
  } catch (error) {
    res.status(500).json({ message: 'Kiralama oranları güncellenirken bir hata oluştu.' });
  }
});

// Kitap detayları ile birlikte kiralama fiyatlarını hesapla
router.get('/getBookWithRentalPrices/:bookId', async (req, res) => {
  try {
      const { bookId } = req.params;

      // Kitap detaylarını al
      const book = await Book.findById(bookId).populate('bookCategory', 'name');
      if (!book) {
          return res.status(404).json({ message: 'Kitap bulunamadı.' });
      }

      // Kiralama oranlarını al
      const rentalPrices = await GeneralRentalPrice.findOne();
      if (!rentalPrices) {
          return res.status(404).json({ message: 'Kiralama oranları bulunamadı.' });
      }

      // Kiralama fiyatlarını hesapla
      const threeMonthRentalPrice = calculateRoundedPrice(book.price, rentalPrices.threeMonthPercentage);
      const sixMonthRentalPrice = calculateRoundedPrice(book.price, rentalPrices.sixMonthPercentage);
      const oneYearRentalPrice = calculateRoundedPrice(book.price, rentalPrices.oneYearPercentage);

      // Kitap görselini base64 formatına çevir
      const bookWithBase64Image = {
          ...book._doc,
          bookImg: book.bookImg 
              ? `data:${book.bookImg.contentType};base64,${book.bookImg.image.toString('base64')}`
              : null,
          rentalPrices: {
              threeMonthRentalPrice,
              sixMonthRentalPrice,
              oneYearRentalPrice
          }
      };

      return res.status(200).json(bookWithBase64Image);
  } catch (error) {
      console.error("Kitap detayları alınırken bir hata oluştu:", error);
      return res.status(500).json({ message: "Kitap bilgileri alınırken bir hata oluştu." });
  }
});

// Yuvarlanmış kiralama fiyatlarını hesaplamak için fonksiyon
const calculateRoundedPrice = (price, percentage) => {
  let discountedPrice = price * (percentage / 100);
  discountedPrice = price - discountedPrice;
  return roundPrice(discountedPrice);
};

// Fiyatları 0, 25, 50, 75 yuvarlama fonksiyonu
const roundPrice = (price) => {
  const remainder = price % 1; // Küsürat kısmını al
  if (remainder < 0.125) return Math.floor(price); // 0.00
  if (remainder < 0.375) return Math.floor(price) + 0.25; // 0.25
  if (remainder < 0.625) return Math.floor(price) + 0.50; // 0.50
  if (remainder < 0.875) return Math.floor(price) + 0.75; // 0.75
  return Math.ceil(price); // 1.00
};


module.exports = router;
