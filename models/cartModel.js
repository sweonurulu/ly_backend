const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Kullanıcı ID'si
  items: [
    {
      bookId: { type: mongoose.Schema.Types.ObjectId, ref: "Book", required: true }, // Eklenen kitap
      quantity: { type: Number, default: 1 }, // Miktar
      price: { type: Number, required: true }, // Kitabın fiyatı
    }
  ],
  totalPrice: { type: Number, required: true, default: 0 }, // Toplam fiyat
});

module.exports = mongoose.model("Cart", cartSchema);
