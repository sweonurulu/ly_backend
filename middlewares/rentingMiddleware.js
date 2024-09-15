const GeneralRentalPrice = require('../models/rentedPriceModel');

// Middleware for calculating rental prices
const calculateRentalPrices = async (req, res, next) => {
  try {
    const { price } = req.body;

    if (!price) {
      return res.status(400).json({ message: 'Kitap fiyatı belirtilmemiş.' });
    }

    // GeneralRentalPrice veritabanından kiralama oranlarını al
    const rentalPriceData = await GeneralRentalPrice.findOne();
    if (!rentalPriceData) {
      return res.status(500).json({ message: 'Kiralama oranları bulunamadı.' });
    }

    // Kiralama fiyatlarını hesapla
    const threeMonthRentalPrice = calculateRoundedPrice(price, rentalPriceData.threeMonthPercentage);
    const sixMonthRentalPrice = calculateRoundedPrice(price, rentalPriceData.sixMonthPercentage);
    const oneYearRentalPrice = calculateRoundedPrice(price, rentalPriceData.oneYearPercentage);

    // Kiralama fiyatlarını req.body'ye ekle
    req.body.threeMonthRentalPrice = threeMonthRentalPrice;
    req.body.sixMonthRentalPrice = sixMonthRentalPrice;
    req.body.oneYearRentalPrice = oneYearRentalPrice;

    next();
  } catch (error) {
    console.error('Kiralama fiyatları hesaplanırken hata oluştu:', error);
    res.status(500).json({ message: 'Kiralama fiyatları hesaplanamadı.' });
  }
};

// Fiyatları 0, 25, 50, 75 yuvarlama fonksiyonu
const calculateRoundedPrice = (price, percentage) => {
  let discountedPrice = price * (percentage / 100);
  discountedPrice = price - discountedPrice;
  return roundPrice(discountedPrice);
};

// Yuvarlama fonksiyonu
const roundPrice = (price) => {
  const remainder = price % 1; // Küsürat kısmını al
  if (remainder < 0.125) return Math.floor(price); // 0.00
  if (remainder < 0.375) return Math.floor(price) + 0.25; // 0.25
  if (remainder < 0.625) return Math.floor(price) + 0.50; // 0.50
  if (remainder < 0.875) return Math.floor(price) + 0.75; // 0.75
  return Math.ceil(price); // 1.00
};

module.exports = calculateRentalPrices;
