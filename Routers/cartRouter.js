const express = require("express");
const Cart = require("../models/cartModel");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

// Sepete kitap ekle
router.post("/add", authMiddleware, async (req, res) => {
  const { userId, bookId, price } = req.body;

  try {
    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = new Cart({ userId, items: [], totalPrice: 0 });
    }

    const existingItemIndex = cart.items.findIndex(item => item.bookId.toString() === bookId);

    if (existingItemIndex >= 0) {
      // Kitap zaten sepette, miktarı artır
      cart.items[existingItemIndex].quantity += 1;
    } else {
      // Kitap sepete yeni ekleniyor
      cart.items.push({ bookId, quantity: 1, price });
    }

    cart.totalPrice += price;
    await cart.save();

    res.status(200).json(cart);
  } catch (error) {
    res.status(500).json({ message: "Sepete ekleme sırasında hata oluştu." });
  }
});

// Kullanıcıya ait sepeti getir
router.get("/:userId", authMiddleware, async (req, res) => {
  const { userId } = req.params;

  try {
    const cart = await Cart.findOne({ userId }).populate("items.bookId", "bookName");
    if (!cart) return res.status(404).json({ message: "Sepet bulunamadı." });

    res.status(200).json(cart);
  } catch (error) {
    res.status(500).json({ message: "Sepet getirilemedi." });
  }
});

// Sepetten kitap kaldır
router.post("/remove", authMiddleware, async (req, res) => {
  const { userId, bookId } = req.body;

  try {
    let cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(404).json({ message: "Sepet bulunamadı." });
    }

    const itemIndex = cart.items.findIndex(item => item.bookId.toString() === bookId);

    if (itemIndex >= 0) {
      const itemPrice = cart.items[itemIndex].price * cart.items[itemIndex].quantity;
      cart.items.splice(itemIndex, 1); // Kitabı sepetten çıkar
      cart.totalPrice -= itemPrice; // Toplam fiyatı güncelle
      await cart.save();
      return res.status(200).json(cart);
    }

    return res.status(404).json({ message: "Ürün sepetinizde bulunamadı." });
  } catch (error) {
    res.status(500).json({ message: "Ürün sepetten çıkarılırken hata oluştu." });
  }
});

module.exports = router;
