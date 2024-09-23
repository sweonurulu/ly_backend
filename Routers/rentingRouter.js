const express = require("express");
const GeneralRentalPrice = require("../models/rentedPriceModel");
const Book = require("../models/bookModel");
const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware = require("../middlewares/adminMiddleware");
const crypto = require("crypto");
const axios = require("axios");
const Rental = require("../models/rentalModel"); // Kiralama modelini kullanıyoruz
var microtime = require("microtime");

const router = express.Router();

// Tüm kitaplar için geçerli genel kiralama oranlarını getir
router.get(
  "/list-rental-prices",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      console.log("backende istek geldi");
      const rentalPrice = await GeneralRentalPrice.findOne();

      if (!rentalPrice) {
        return res
          .status(404)
          .json({ message: "Kiralama oranları bulunamadı." });
      }

      res.status(200).json(rentalPrice);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Kiralama oranları alınırken bir hata oluştu." });
    }
  }
);

// Tüm kitaplar için geçerli genel kiralama oranlarını güncelle
router.put(
  "/change-rental-prices",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const { threeMonthPercentage, sixMonthPercentage, oneYearPercentage } =
        req.body;

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

      res.status(200).json({
        message: "Kiralama oranları başarıyla güncellendi.",
        rentalPrice,
      });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Kiralama oranları güncellenirken bir hata oluştu." });
    }
  }
);

// Kitap detayları ile birlikte kiralama fiyatlarını hesapla
router.get("/getBookWithRentalPrices/:bookId", async (req, res) => {
  try {
    const { bookId } = req.params;

    // Kitap detaylarını al
    const book = await Book.findById(bookId).populate("bookCategory", "name");
    if (!book) {
      return res.status(404).json({ message: "Kitap bulunamadı." });
    }

    // Kiralama oranlarını al
    const rentalPrices = await GeneralRentalPrice.findOne();
    if (!rentalPrices) {
      return res.status(404).json({ message: "Kiralama oranları bulunamadı." });
    }

    // Kiralama fiyatlarını hesapla
    const threeMonthRentalPrice = calculateRoundedPrice(
      book.price,
      rentalPrices.threeMonthPercentage
    );
    const sixMonthRentalPrice = calculateRoundedPrice(
      book.price,
      rentalPrices.sixMonthPercentage
    );
    const oneYearRentalPrice = calculateRoundedPrice(
      book.price,
      rentalPrices.oneYearPercentage
    );

    // Kitap görselini base64 formatına çevir
    const bookWithBase64Image = {
      ...book._doc,
      bookImg: book.bookImg
        ? `data:${
            book.bookImg.contentType
          };base64,${book.bookImg.image.toString("base64")}`
        : null,
      rentalPrices: {
        threeMonthRentalPrice,
        sixMonthRentalPrice,
        oneYearRentalPrice,
      },
    };

    return res.status(200).json(bookWithBase64Image);
  } catch (error) {
    console.error("Kitap detayları alınırken bir hata oluştu:", error);
    return res
      .status(500)
      .json({ message: "Kitap bilgileri alınırken bir hata oluştu." });
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
  if (remainder < 0.625) return Math.floor(price) + 0.5; // 0.50
  if (remainder < 0.875) return Math.floor(price) + 0.75; // 0.75
  return Math.ceil(price); // 1.00
};

// KİRALANAN KİTAPLAR
// GET /rentals/user/:userId -> Kullanıcının tamamlanmış kiralamalarını getirir
router.get("/rentals/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const rentals = await Rental.find({
      "customerData.userId": userId,
      paymentStatus: "completed",
    });

    if (!rentals.length) {
      return res.status(404).json({ message: "Kiralama bulunamadı." });
    }

    res.json(rentals);
  } catch (error) {
    console.error("Kiralama listesi alınamadı:", error);
    res.status(500).json({ message: "Bir hata oluştu.", error });
  }
});

//////////// PAYTR ///////////
// POST /create-payment-session
router.post("/create-payment-session", async (req, res) => {
  let {
    bookId, // Kitap ID'si
    customerData, // Müşteri bilgileri (içinde userId olmalı)
    rentalPeriod, // Kiralama süresi
  } = req.body;
  
  console.log("Customer Data:", customerData.userId);

  if (!customerData || !customerData.userId) {
    return res.status(400).json({ message: "Kullanıcı ID'si bulunamadı." });
  }

  // Kullanıcının IP adresini alıyoruz
  const userIp = req.headers["x-forwarded-for"] || req.connection.remoteAddress;

  try {
    // Kitap bilgilerini veritabanından sorguluyoruz
    const bookDetails = await Book.findById(bookId);
    if (!bookDetails) {
      return res.status(404).json({ message: "Kitap bulunamadı." });
    }

    // Kiralama süresine göre ödeme tutarını belirleme
    let paymentAmount;
    switch (rentalPeriod) {
      case "3 months":
        paymentAmount = bookDetails.threeMonthRentalPrice;
        break;
      case "6 months":
        paymentAmount = bookDetails.sixMonthRentalPrice;
        break;
      case "1 year":
        paymentAmount = bookDetails.oneYearRentalPrice;
        break;
      default:
        return res.status(400).json({ message: "Geçersiz kiralama süresi" });
    }

    paymentAmount = Math.floor(paymentAmount * 100); // Kuruş cinsine çevir

    // Benzersiz merchant_oid oluştur
    const merchant_oid = "IN" + microtime.now();

    // Yeni bir kiralama kaydı oluştur
    const newRental = new Rental({
      books: [bookDetails],
      customerData,
      paymentAmount,
      rentalPeriod,
      merchantOid: merchant_oid,
      paymentStatus: "pending",
    });

    const savedRental = await newRental.save();

    // Kitap bilgilerini kullanarak sepeti oluştur
    const basket = [[bookDetails.title, bookDetails.price, 1]];
    const user_basket = Buffer.from(JSON.stringify(basket)).toString("base64");

    const merchant_id = process.env.merchant_id;
    const merchant_key = process.env.merchant_key;
    const merchant_salt = process.env.merchant_salt;
    const email = customerData.email;
    const user_name = `${customerData.name} ${customerData.surname}`;
    const user_address = customerData.address || "No address provided";
    const user_phone = customerData.phoneNumber;

    const currency = "TL";
    const test_mode = 1;
    const no_installment = 0;
    const max_installment = 0;
    const merchant_ok_url = "http://localhost:3000/basarili";
    const merchant_fail_url = "http://localhost:3000/basarisiz";

    // PayTR token oluşturma
    const hashStr = `${merchant_id}${userIp}${merchant_oid}${email}${paymentAmount}${user_basket}${no_installment}${max_installment}${currency}${test_mode}`;
    const paytr_token = hashStr + merchant_salt;
    const token = crypto
      .createHmac("sha256", merchant_key)
      .update(paytr_token)
      .digest("base64");

    // PayTR'dan token almak için POST isteği
    const response = await axios.post(
      "https://www.paytr.com/odeme/api/get-token",
      new URLSearchParams({
        merchant_id,
        user_ip: userIp,
        merchant_oid: merchant_oid,
        email,
        payment_amount: paymentAmount,
        currency,
        user_basket,
        no_installment,
        max_installment,
        paytr_token: token,
        user_name,
        user_address,
        user_phone,
        merchant_ok_url,
        merchant_fail_url,
        test_mode,
        debug_on: 1,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const result = response.data;

    if (result.status === "success") {
      await Rental.findOneAndUpdate(
        { merchantOid: merchant_oid },
        {
          paymentStatus: "pending",
          paymentToken: result.token,
        }
      );

      res.json({ iframeToken: result.token });
    } else {
      res.status(400).json({ message: "Ödeme oluşturulamadı", reason: result.reason });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Kitap bilgileri alınırken bir hata oluştu.", error });
  }
});

// POST /callback -> PayTR tarafından gönderilen ödeme sonuçlarını alır
router.post("/callback", async (req, res) => {
  const {
    merchant_oid,  // Sipariş numarası
    status,        // Ödeme durumu (success veya failed)
    total_amount,  // Ödenen toplam tutar
    hash,          // PayTR tarafından gönderilen güvenlik hash değeri
    payment_type,  // Ödeme tipi (kart, eft vs.)
    failed_reason_msg, // Başarısız ödeme durumunda hata mesajı
  } = req.body;

  const merchant_key = process.env.merchant_key;
  const merchant_salt = process.env.merchant_salt;

  try {
    // Hash doğrulaması (gelen POST verilerinin PayTR tarafından gönderildiğini doğrulamak için)
    const paytr_token = `${merchant_oid}${merchant_salt}${status}${total_amount}`;
    const token = crypto.createHmac("sha256", merchant_key).update(paytr_token).digest("base64");

    if (token !== hash) {
      console.error("Hash doğrulama başarısız. Bildirim PayTR'dan gelmedi!");
      return res.status(400).send("Bad request: Hash validation failed");
    }

    // Ödeme durumu kontrolü
    if (status === "success") {
      const rental = await Rental.findOne({ merchantOid: merchant_oid });

      if (rental.paymentStatus === "completed") {
        console.log("Bu işlem daha önce tamamlandı.");
        return res.send("OK");
      }

      // Kiralama bitiş tarihini hesapla
      let rentalEndDate = new Date();
      switch (rental.rentalPeriod) {
        case "3 months":
          rentalEndDate.setMonth(rentalEndDate.getMonth() + 3);
          break;
        case "6 months":
          rentalEndDate.setMonth(rentalEndDate.getMonth() + 6);
          break;
        case "1 year":
          rentalEndDate.setFullYear(rentalEndDate.getFullYear() + 1);
          break;
        default:
          throw new Error("Geçersiz kiralama süresi");
      }

      // Kiralama işlemini güncelle (paymentStatus ve rentalEndDate dahil)
      await Rental.findOneAndUpdate(
        { merchantOid: merchant_oid },
        {
          paymentStatus: "completed", // Ödeme tamamlandı
          rentalEndDate: rentalEndDate, // Kiralama bitiş tarihi
          paymentDetails: {
            method: payment_type,
            amount: total_amount,
            status: "success",
          },
        }
      );
      console.log("Ödeme başarıyla tamamlandı ve kiralama güncellendi.");
    } else {
      console.log("Ödeme başarısız:", failed_reason_msg);

      // Ödeme başarısız olduğunda durumu güncelle
      await Rental.findOneAndUpdate(
        { merchantOid: merchant_oid },
        {
          paymentStatus: "failed", // Ödeme başarısız
          paymentDetails: {
            method: payment_type,
            amount: total_amount,
            status: "failed",
            reason: failed_reason_msg,
          },
        }
      );
      console.log("Ödeme başarısız olarak kaydedildi.");
    }

    // PayTR'ye yanıt olarak "OK" dönüyoruz (aksi halde PayTR aynı bildirimi tekrar gönderir)
    res.send("OK");
  } catch (error) {
    console.error("Callback işlemi sırasında hata:", error);
    res.status(500).send("Server error");
  }
});


module.exports = router;
