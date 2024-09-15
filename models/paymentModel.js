const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  bookId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Book",
    required: true,
  },
  rentalPeriod: {
    type: String,
    required: true,
  },
  customer: {
    name: { type: String, required: true },
    surname: { type: String, required: true },
    email: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    tcIdNumber: { type: String, required: true },
  },
  price: {
    type: Number,
    required: true,
  },
  rentalStartDate: {
    type: Date,
    required: true,
  },
  rentalEndDate: {
    type: Date,
    required: true,
  },
});

module.exports = mongoose.model("Payment", paymentSchema);
