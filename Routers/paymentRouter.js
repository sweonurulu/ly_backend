const express = require("express");
const Payment = require("../models/paymentModel");
const router = express.Router();

// Kitap kiralama rotası
router.post("/rentBook", async (req, res) => {
  try {
    const { bookId, rentalPeriod, customerData, price } = req.body;

    // Kiralama süresine göre bitiş tarihini hesapla
    const rentalStartDate = new Date();
    const rentalEndDate = new Date();
    if (rentalPeriod === "3 months") {
      rentalEndDate.setMonth(rentalEndDate.getMonth() + 3);
    } else if (rentalPeriod === "6 months") {
      rentalEndDate.setMonth(rentalEndDate.getMonth() + 6);
    } else if (rentalPeriod === "12 months") {
      rentalEndDate.setFullYear(rentalEndDate.getFullYear() + 1);
    }

    // Ödeme bilgilerini veritabanına kaydet
    const payment = new Payment({
      bookId,
      rentalPeriod,
      customer: customerData,
      price,
      rentalStartDate,
      rentalEndDate,
    });

    await payment.save();

    res.status(201).json({ message: "Kitap başarıyla kiralandı", payment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Kiralama işlemi sırasında bir hata oluştu" });
  }
});

module.exports = router;
