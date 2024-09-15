const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel.js");

const router = express.Router();

router.post("/adminSignup", async (req, res) => {
    try {
        const { username, name, surname, password, correctionPassword, phoneNumber, email } = req.body;

        if (!username || !name || !surname || !password || !correctionPassword || !phoneNumber || !email) {
            return res.status(400).json({ message: 'Tüm alanlar doldurulmalıdır.' });
        }

        if (password !== correctionPassword) {
            return res.status(400).json({ message: "Şifreler eşleşmiyor." });
        }

        const emailExists = await User.findOne({ email });
        if (emailExists) {
            return res.status(400).json({ message: "E-posta zaten mevcut." });
        }

        const usernameExists = await User.findOne({ username });
        if (usernameExists) {
            return res.status(400).json({ message: "Kullanıcı adı zaten mevcut." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const createdUser = await User.create({
            username,
            name,
            surname,
            email,
            password: hashedPassword,
            phoneNumber,
            userType: "ADMIN" // Admin olarak işaretliyoruz
        });

        return res.status(201).json(createdUser);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Kullanıcı oluşturma başarısız." });
    }
});

module.exports = router;
