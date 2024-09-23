const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  books: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      required: true,
    },
  ],
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Kullanıcının ID'si
    required: false, // Eğer kullanıcı giriş yapmamışsa boş bırakılabilir
  },
  customer: {
    name: { type: String, required: true },
    surname: { type: String, required: true },
    email: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    tcIdNumber: { type: String, required: true },
  },
  address: {
    title: { type: String, required: true },
    addressLine1: { type: String, required: true },
    addressLine2: { type: String },
    city: { type: String, required: true },
    district: { type: String, required: true },
    zipCode: { type: String, required: true },
  },
  price: {
    type: Number,
    required: true,
  },
  paymentStatus: {
    type: String,
    enum: ["pending", "completed", "failed"],
    default: "pending", // Ödeme başlangıçta beklemede
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Payment", paymentSchema);
