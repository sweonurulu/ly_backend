const express = require("express");
const multer = require('multer');
const mongoose = require('mongoose');
const Book = require('../models/bookModel.js');
const BookPDF = require('../models/BookPDFModel'); // Yeni eklediğimiz model
const BookPreviewPDF = require('../models/BookPreviewPDFModel'); // Yeni eklediğimiz model
const Category = require('../models/bookCategoryModel.js'); // Kategori modelini import ettik
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware'); 
const calculateRentalPrices = require('../middlewares/rentingMiddleware'); 
const { JSDOM } = require('jsdom');
const fs = require('fs');
const upload = multer(); // Disk veya memoryStorage kullanmıyoruz

const router = express.Router();

// Kitap yaratma rotası (sadece adminler)
router.post("/createBook", authMiddleware, adminMiddleware, upload.fields([
    { name: 'bookImg', maxCount: 1 },
    { name: 'previewPdf', maxCount: 1 },
    { name: 'ebookPdf', maxCount: 1 }
]), calculateRentalPrices, async (req, res) => {
    try {
        console.log("Request body:", req.body);
        console.log("Uploaded files:", req.files);

        const { bookName, bookDescription, bookCreatedDate, bookCategory, price, isbn, publisher, pageCount, publishDate, bindingType, edition, language, dimensions, authors } = req.body;

        if (!bookName || !bookCategory || !price || !authors || !req.files['bookImg']) {
            console.error("Eksik alanlar:", {
                bookName,
                bookCategory,
                price,
                authors,
                bookImg: req.files['bookImg']
            });
            return res.status(400).json({ message: 'Kitap Adı, Yazarlar, Fiyat, Kitap Kategorisi ve Kitap Görseli zorunludur' });
        }

        const imgBuffer = req.files['bookImg'][0].buffer;
        const imgContentType = req.files['bookImg'][0].mimetype;

        // Yeni kitabı oluştur
        const createdBook = await Book.create({
            bookName,
            bookImg: {
                contentType: imgContentType,
                image: imgBuffer
            },
            bookDescription,
            bookCreatedDate: bookCreatedDate ? new Date(bookCreatedDate) : undefined,
            bookCategory: bookCategory.split(',').map(categoryId => new mongoose.Types.ObjectId(categoryId)),
            price,
            publisher,
            pageCount,
            publishDate,
            bindingType,
            edition,
            isbn,
            language,
            dimensions,
            authors: authors.split(','),
            threeMonthRentalPrice: req.body.threeMonthRentalPrice,
            sixMonthRentalPrice: req.body.sixMonthRentalPrice,
            oneYearRentalPrice: req.body.oneYearRentalPrice,
            bookPdfUploaded: !!req.files['ebookPdf'], // E-kitap PDF yüklendi mi?
            bookReviewPdfUploaded: !!req.files['previewPdf'] // Önizleme PDF yüklendi mi?
        });

        // Önizleme PDF'si varsa kaydet
        if (req.files['previewPdf']) {
            const previewPdfBuffer = req.files['previewPdf'][0].buffer;
            const previewPdfContentType = req.files['previewPdf'][0].mimetype;

            await BookPreviewPDF.create({
                bookId: createdBook._id,
                previewPdf: {
                    pdfFile: previewPdfBuffer.toString('base64'),
                    contentType: previewPdfContentType
                }
            });
        }

        // E-Kitap PDF'si varsa kaydet
        if (req.files['ebookPdf']) {
            const ebookPdfBuffer = req.files['ebookPdf'][0].buffer;
            const ebookPdfContentType = req.files['ebookPdf'][0].mimetype;

            await BookPDF.create({
                bookId: createdBook._id,
                ebookPdf: {
                    pdfFile: ebookPdfBuffer.toString('base64'),
                    contentType: ebookPdfContentType
                }
            });
        }

        console.log("Kitap ve PDF'ler başarıyla oluşturuldu:", createdBook);

        return res.status(201).json(createdBook);
    } catch (error) {
        console.error("Kitap oluşturulurken hata oluştu:", error);
        return res.status(500).json({ message: "Kitap oluşturma başarısız." });
    }
});

// Kitap listeleme rotası
router.get("/listBooks/:bookCategory?", async (req, res) => {
    try {
        const { bookCategory } = req.params;

        let filter = {};
        if (bookCategory && mongoose.Types.ObjectId.isValid(bookCategory)) {
            filter.bookCategory = new mongoose.Types.ObjectId(bookCategory); // Kategori ID'sini ObjectId olarak filtrele
        }

        let bookList;
        if (bookCategory && mongoose.Types.ObjectId.isValid(bookCategory)) {
            // Belirli bir kategoriye göre kitapları filtrele
            bookList = await Book.find(filter).populate('bookCategory', 'name');
        } else {
            // Kategori verilmemişse, en yeni 9 kitabı getir
            bookList = await Book.find({}).sort({ bookCreatedDate: -1 }).limit(9).populate('bookCategory', 'name');
        }

        // Kitapları base64 image ile birlikte döndür
        const bookListWithBase64Images = bookList.map(book => {
            let base64Image = null;
            if (book.bookImg && book.bookImg.image) {
                base64Image = `data:${book.bookImg.contentType};base64,${book.bookImg.image.toString('base64')}`;
            }
            return { ...book._doc, bookImg: base64Image };
        });

        res.status(200).json(bookListWithBase64Images);
    } catch (error) {
        console.error("Error listing books:", error);
        res.status(500).json({ message: "Kitaplar listelenemedi." });
    }
});

// Kitap fiyatını güncelleme rotası (sadece adminler)
router.put("/updatePrice/:bookId", authMiddleware, adminMiddleware, calculateRentalPrices, async (req, res) => {  // Kiralama fiyatları hesaplama middleware'i eklendi
    try {
        const { bookId } = req.params;
        const { price } = req.body;

        if (!price) {
            return res.status(400).json({ message: "Fiyat gerekli." });
        }

        const book = await Book.findById(bookId);

        if (!book) {
            return res.status(404).json({ message: "Kitap bulunamadı." });
        }

        // Kitap fiyatını ve kiralama fiyatlarını güncelle
        book.price = price;
        book.threeMonthRentalPrice = req.body.threeMonthRentalPrice;
        book.sixMonthRentalPrice = req.body.sixMonthRentalPrice;
        book.oneYearRentalPrice = req.body.oneYearRentalPrice;

        await book.save();

        return res.status(200).json({ message: "Fiyat başarıyla güncellendi.", book });
    } catch (error) {
        console.error("Fiyat güncellenirken hata oluştu:", error);
        return res.status(500).json({ message: "Fiyat güncellenirken bir hata oluştu." });
    }
});

// Belirli bir kitabın detaylarını almak için GET fonksiyonu
router.get('/getBookById/:bookId', async (req, res) => {
    try {
        const { bookId } = req.params;

        // Veritabanında kitabı bul
        const book = await Book.findById(bookId).populate('bookCategory', 'name');

        if (!book) {
            return res.status(404).json({ message: 'Kitap bulunamadı.' });
        }

        // Kitap görselini Base64 formatına çevirme
        const bookWithBase64Image = {
            ...book._doc,
            bookImg: book.bookImg 
                ? `data:${book.bookImg.contentType};base64,${book.bookImg.image.toString('base64')}`
                : null
        };

        return res.status(200).json(bookWithBase64Image);
    } catch (error) {
        console.error("Kitap detayları alınırken bir hata oluştu:", error);
        return res.status(500).json({ message: "Kitap bilgileri alınırken bir hata oluştu." });
    }
});

// Web'den kitap bilgilerini alıp veritabanına kaydeden fonksiyon
router.post("/createBookAndUploadPDF", authMiddleware, adminMiddleware, upload.single('pdfFile'), async (req, res) => {
    try {
        console.log("Backend'de gelen veriler:", req.body, req.file);

        const { url, bookCategory, threeMonthPrice, sixMonthPrice, oneYearPrice } = req.body;
        const pdfFile = req.file;

        if (!url || !bookCategory || !pdfFile) {
            return res.status(400).json({ message: 'URL, kategori, fiyatlar ve PDF dosyası zorunludur.' });
        }

        const bookNo = parseInt(url.split('=').pop());
        const response = await JSDOM.fromURL(url);
        const { document } = response.window;

        const bookName = document.querySelector(".kitapad")?.textContent.trim() || "Bilinmeyen Kitap";
        const authorsRaw = document.querySelector(".kitapyazar")?.textContent.trim();
        const authors = authorsRaw ? authorsRaw.split(',') : ["Bilinmeyen Yazar"];
        const priceText = document.querySelector(".kitapfiyat")?.textContent.trim() || "0";
        const price = parseFloat(priceText.replace(' TL', '').replace(',', '.')) || 0;
        const pageSize = document.querySelector(".puntoaltmenuler12 p:nth-child(1)")?.textContent.trim().replace('Ebat:', '').trim() || "Belirtilmemiş";
        const pageCount = document.querySelector(".puntoaltmenuler12 p:nth-child(2)")?.textContent.trim().replace('Sayfa Sayısı:', '').trim() || "0";
        const isbn = document.querySelector(".puntoaltmenuler12 p:nth-child(3)")?.textContent.trim().replace('ISBN:', '').trim() || "Bilinmeyen ISBN";
        const imageUrl = document.querySelector(".highslide img")?.getAttribute("src") || "Bilinmeyen Resim URL";

        let category = await Category.findOne({ name: bookCategory });
        if (!category) {
            category = new Category({ name: bookCategory });
            await category.save();
        }

        const createdBook = await Book.create({
            bookName,
            bookNo,
            bookImg: imageUrl,
            bookDescription: `Ebat: ${pageSize}, ISBN: ${isbn}`,
            bookCreatedDate: new Date(),
            bookCategory: category._id,
            price,
            threeMonthPrice,
            sixMonthPrice,
            oneYearPrice,
            publisher: "Lisans Yayıncılık",
            pageCount,
            publishDate: new Date().getFullYear(),
            bindingType: null,
            edition: "1",
            isbn,
            language: 'Türkçe',
            dimensions: pageSize,
            authors,
        });

        const pdfBase64 = pdfFile.buffer.toString('base64');

        const newBookPDF = new BookPDF({
            bookNo,
            pdfFile: pdfBase64,
            contentType: pdfFile.mimetype,
        });

        await newBookPDF.save();

        res.status(201).json({ message: 'Kitap ve PDF dosyası başarıyla yüklendi.', book: createdBook, pdf: newBookPDF });
    } catch (error) {
        console.error("Kitap bilgileri veya PDF yükleme sırasında hata oluştu:", error);
        res.status(500).json({ message: "Kitap bilgileri veya PDF yükleme sırasında hata oluştu." });
    }
});

// pdf önizlemeyi görüntüler
router.get('/review-pdfviewer/:bookId', async (req, res) => {
    try {
      const { bookId } = req.params;
      const bookPdf = await BookPDF.findOne({ bookId });
  
      if (!bookPdf || !bookPdf.previewPdf) {
        return res.status(404).json({ message: 'Kitap önizlemesi bulunamadı.' });
      }
  
      res.set({
        'Content-Type': bookPdf.previewPdf.contentType,
        'Content-Disposition': `inline; filename="book-preview.pdf"`,
      });
  
      return res.send(Buffer.from(bookPdf.previewPdf.pdfFile, 'base64'));
    } catch (error) {
      console.error('PDF önizleme alınırken hata oluştu:', error);
      return res.status(500).json({ message: 'PDF önizleme görüntülenemedi.' });
    }
});

// Kitap güncelleme rotası (sadece adminler)
router.put('/updateBook/:bookId', authMiddleware, adminMiddleware, upload.fields([
    { name: 'bookImg', maxCount: 1 },
    { name: 'previewPdf', maxCount: 1 },
    { name: 'ebookPdf', maxCount: 1 },
  ]), async (req, res) => {
    try {
      const { bookId } = req.params;
      const updatedFields = req.body;

      const book = await Book.findById(bookId);
      if (!book) {
        return res.status(404).json({ message: 'Kitap bulunamadı.' });
      }

      // Kitap görseli varsa güncelle
      if (req.files['bookImg']) {
        book.bookImg.image = req.files['bookImg'][0].buffer;
        book.bookImg.contentType = req.files['bookImg'][0].mimetype;
      }

      // Eğer bookCategory güncelleniyorsa, ObjectId'lere dönüştür ve geçerli olup olmadığını kontrol et
      if (updatedFields.bookCategory) {
        const categories = updatedFields.bookCategory.split(',');
        updatedFields.bookCategory = categories.map(categoryId => {
          if (mongoose.Types.ObjectId.isValid(categoryId)) {
            return new mongoose.Types.ObjectId(categoryId);
          } else {
            throw new Error(`Geçersiz kategori ID'si: ${categoryId}`);
          }
        });
      }

      // Diğer alanları güncelle
      Object.keys(updatedFields).forEach((key) => {
        book[key] = updatedFields[key];
      });

      await book.save(); // Kitap bilgilerini kaydet
      return res.status(200).json({ message: 'Kitap başarıyla güncellendi.', book });
    } catch (error) {
      console.error('Kitap güncellenirken hata oluştu:', error);
      return res.status(500).json({ message: 'Kitap güncellenemedi.' });
    }
});




module.exports = router;