const express = require("express");
const crypto = require("crypto");
const axios = require("axios");
const Payment = require("../models/paymentModel");
const router = express.Router();


// Kitap satış rotası (ödeme durumu ile)
router.post("/purchaseBook", async (req, res) => {
  try {
    const { bookId, customerData, price } = req.body;

    // Benzersiz sipariş numarası
    const merchant_oid = "ORDER_" + new Date().getTime();

    // Kullanıcı IP'si
    const user_ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    // Ödeme yapılacak tutar kuruş cinsinden
    const payment_amount = price * 100;

    // Sepet bilgisi
    const basket = [
      [bookId, price, 1],  // Örnek ürün bilgisi
    ];
    const user_basket = Buffer.from(JSON.stringify(basket)).toString("base64");

    // Hash oluşturma
    const hashStr = `${merchant_id}${user_ip}${merchant_oid}${customerData.email}${payment_amount}${user_basket}0${process.env.merchant_salt}`;
    const paytr_token = crypto.createHmac("sha256", process.env.merchant_key).update(hashStr).digest("base64");

    const postData = {
      merchant_id: process.env.merchant_id,
      user_ip: user_ip,
      merchant_oid: merchant_oid,
      email: customerData.email,
      payment_amount: payment_amount,
      user_basket: user_basket,
      paytr_token: paytr_token,
      no_installment: 0, // Taksit yok
      max_installment: 0, // Maksimum taksit sayısı
      currency: "TL",
      user_name: customerData.name,
      user_address: customerData.address,
      user_phone: customerData.phoneNumber,
      merchant_ok_url: "http://www.siteniz.com/odeme_basarili",  // Başarılı yönlendirme
      merchant_fail_url: "http://www.siteniz.com/odeme_hata",  // Başarısız yönlendirme
      test_mode: 1, // Test modunda 1, canlıda 0
      lang: "tr",
      debug_on: 1,  // Hataları göster
    };

    // PayTR API'ye istek gönder
    const response = await axios.post("https://www.paytr.com/odeme/api/get-token", postData);

    if (response.data.status === "success") {
      // Ödeme bilgilerini veritabanına kaydet
      const payment = new Payment({
        books: [bookId],
        customer: customerData,
        price,
        paymentStatus: "pending", // Başlangıçta ödeme durumu pending
        merchant_oid: merchant_oid, // Sipariş numarası kaydedilir
      });

      await payment.save();

      // iFrame token'ı frontend'e gönderin
      res.status(201).json({
        message: "Ödeme başlatıldı, lütfen işlemi tamamlayın.",
        iframe_token: response.data.token,
        paymentId: payment._id,
      });
    } else {
      res.status(400).json({ message: response.data.reason });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Satış işlemi sırasında bir hata oluştu" });
  }
});

// Ödeme işlemi tamamlandıktan sonra durumu güncelleme (completed)
router.put("/confirmPayment", async (req, res) => {
  try {
    const { paymentId } = req.body;

    // İlgili ödeme kaydını bul
    const payment = await Payment.findById(paymentId);

    if (!payment) {
      return res.status(404).json({ message: "Ödeme kaydı bulunamadı" });
    }

    // Ödeme durumunu completed olarak güncelle
    payment.paymentStatus = "completed";
    await payment.save();

    res.status(200).json({
      message: "Ödeme başarıyla tamamlandı.",
      payment,
    });

    // Satış işlemleri burada yapılabilir
    // Örneğin kitap stoğu güncellenebilir veya sipariş tamamlanabilir
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Ödeme tamamlanırken bir hata oluştu" });
  }
});

// Ödeme işlemi başarısız olursa durumu güncelleme (failed)
router.put("/failPayment", async (req, res) => {
  try {
    const { paymentId } = req.body;

    // İlgili ödeme kaydını bul
    const payment = await Payment.findById(paymentId);

    if (!payment) {
      return res.status(404).json({ message: "Ödeme kaydı bulunamadı" });
    }

    // Ödeme durumunu failed olarak güncelle
    payment.paymentStatus = "failed";
    await payment.save();

    res.status(200).json({
      message: "Ödeme başarısız oldu.",
      payment,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Ödeme işlemi başarısız olurken bir hata oluştu" });
  }
});


module.exports = router;
