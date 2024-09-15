const dotenv = require('dotenv');
const path = require('path');

// .env dosyasının tam yolunu belirtiyoruz
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const mongoose = require('mongoose');
const Content = require('../models/contentModel');
const fs = require('fs');

// MongoDB bağlantısı
mongoose.connect(process.env.DB_CONNECTION, {
  useNewUrlParser: true, 
  useUnifiedTopology: true
})
.then(() => {
  console.log("MongoDB'ye başarıyla bağlandı.");
})
.catch((error) => {
  console.error("MongoDB'ye bağlanılamadı:", error);
  process.exit(1);
});

// Kaynakça PDF dosyasını okuma ve veritabanına yükleme
const filePath = './server/files/2023 Kaynakca-compressed.pdf';

fs.readFile(filePath, (err, pdfData) => {
  if (err) {
    return console.error("Kaynakça PDF dosyası okunamadı:", err);
  }

  const contentType = 'application/pdf';

  Content.findOneAndUpdate(
    {},
    {
      referencesPDF: {
        pdfData: pdfData,
        contentType: contentType
      }
    },
    { new: true, upsert: true }
  ).then((result) => {
    console.log("Kaynakça PDF dosyası başarıyla yüklendi:", result);
    mongoose.connection.close();
  }).catch((error) => {
    console.error("Kaynakça PDF dosyası yüklenemedi:", error);
    mongoose.connection.close();
  });
});
