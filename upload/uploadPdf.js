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

// PDF dosyasını okuma ve veritabanına yükleme
const filePath = './server/files/UluslararasiBelge.pdf';

fs.readFile(filePath, (err, pdfData) => {
  if (err) {
    return console.error("PDF dosyası okunamadı:", err);
  }

  const contentType = 'application/pdf';

  Content.findOneAndUpdate(
    {},
    {
      internationalPublicationPDF: {
        pdfData: pdfData,
        contentType: contentType
      }
    },
    { new: true, upsert: true }
  ).then((result) => {
    console.log("PDF dosyası başarıyla yüklendi:", result);
    mongoose.connection.close();
  }).catch((error) => {
    console.error("PDF dosyası yüklenemedi:", error);
    mongoose.connection.close();
  });
});
