const express = require("express");
const Item = require('../models/bookModel.js');
const User = require('../models/userModel.js');

const router = express.Router();

router.get("/search", async (req, res) => {
    try {
        // Arama kutusuna yazılan metni al
        const { query } = req.query;

        // Eğer arama metni yoksa boş sonuç döndür
        if (!query) {
            return res.status(200).json([]);
        }

        // Regex ile arama metni eşleşmesini kontrol et
        const regex = new RegExp(query, 'i');

        // Veritabanından arama kriterlerine göre eşleşen verileri bul
        const auctionList = await Auction.find({
            $or: [
                { auctionTitle: regex },
                { auctionDescription: regex }
            ]
        });

        const itemList = await Item.find({
            $or: [
                { itemName: regex },
                { itemDescription: regex }
            ]
        });

        const userList = await User.find({
            username: regex
        });

        // Arama sonuçlarını birleştir
        const searchResults = [
            ...auctionList.map(auction => ({ type: 'auction', title: auction.auctionTitle, description: auction.auctionDescription })),
            ...itemList.map(item => ({ type: 'item', title: item.itemName, description: item.itemDescription })),
            ...userList.map(user => ({ type: 'user', title: user.username }))
        ];

        // JSON formatında geri döndür
        return res.status(200).json(searchResults);
    } catch (error) {
        // Hata durumunda hata mesajını geri döndür
        console.error(error);
        return res.status(500).json({ message: "Arama Sonuçlanmadı." });
    }
});

module.exports = router;