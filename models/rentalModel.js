const mongoose = require("mongoose");

const rentalSchema = new mongoose.Schema({
  merchantOid: {
    type: String,
    required: true,
    unique: true, // Benzersiz olmalı
  },
  customerData: { type: Object, required: true }, // Müşteri bilgileri
  books: { type: Array, required: true }, // Kiralanan kitap bilgileri
  paymentAmount: { type: Number, required: true }, // Ödeme miktarı
  paymentStatus: {
    type: String,
    enum: ["pending", "completed", "failed"],
    default: "pending", // Ödeme başlangıçta beklemede
  },
  paymentType: { type: String }, // Ödeme türü
  totalAmount: { type: Number }, // Toplam miktar
  rentalPeriod: { type: String, required: true }, // Kiralama süresi
  createdAt: { type: Date, default: Date.now }, // Oluşturulma tarihi
  rentalEndDate: { type: Date }, // Kiralamanın sona erdiği tarih
});

module.exports = mongoose.model("Rental", rentalSchema);
