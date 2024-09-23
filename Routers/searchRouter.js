const express = require("express");
const Book = require("../models/bookModel.js");

const router = express.Router();

// Arama terimindeki Türkçe ve İngilizce karakter dönüşümleri için bir fonksiyon
const normalizeSearchTerm = (term) => {
  const map = {
    ç: 'c', Ç: 'C',
    ğ: 'g', Ğ: 'G',
    ı: 'i', İ: 'I',
    ö: 'o', Ö: 'O',
    ş: 's', Ş: 'S',
    ü: 'u', Ü: 'U',
  };
  return term.replace(/ç|Ç|ğ|Ğ|ı|İ|ö|Ö|ş|Ş|ü|Ü/g, (matched) => map[matched]);
};

router.get("/searchBooks", async (req, res) => {
  try {
    // Arama kutusuna yazılan metni al
    const { query } = req.query;

    // Eğer arama metni yoksa boş sonuç döndür
    if (!query) {
      return res.status(200).json([]);
    }

    // Arama terimini normalize ederek Türkçe karakterler ile İngilizce karşılıklarını eşleştir
    const normalizedQuery = normalizeSearchTerm(query);

    // Veritabanından arama kriterlerine göre eşleşen kitapları bul ve alfabetik sırayla döndür
    const bookList = await Book.find({
      $or: [
        { bookName: { $regex: normalizedQuery, $options: "i" } }, 
        { authors: { $regex: normalizedQuery, $options: "i" } }
      ],
    })
    .collation({ locale: "tr", strength: 1 }) // Türkçe karakterlere duyarlı arama
    .sort({ bookName: 1 }); // Kitap isimlerini alfabetik sıraya göre sıralama (A-Z)

    // Arama sonuçlarını JSON formatında geri döndür
    return res.status(200).json(bookList);
  } catch (error) {
    // Hata durumunda hata mesajını geri döndür
    console.error(error);
    return res.status(500).json({ message: "Arama Sonuçlanmadı." });
  }
});

module.exports = router;
