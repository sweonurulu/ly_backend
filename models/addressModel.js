const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true }, // Benzersiz adres başlığı
  addressLine1: { type: String, required: true },
  addressLine2: { type: String },
  city: { type: String, required: true },
  district: { type: String, required: true }, // İlçe bilgisi
  zipCode: { type: String, required: true },
});

module.exports = mongoose.model("Address", addressSchema);
