const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel.js");
const authMiddleware = require("../middlewares/authMiddleware"); // Auth middleware'i import edin
const router = express.Router();

router.post("/signup", async (req, res) => {
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

        const saltRounds = 10; // Burada salt değeri belirleniyor
        const hashedPassword = await bcrypt.hash(password, saltRounds); // Doğru kullanım

        const createdUser = await User.create({
            username,
            name,
            surname,
            email,
            password: hashedPassword,
            phoneNumber,
            userType: "USER" // Varsayılan olarak USER tipi atanıyor
        });

        return res.status(201).json(createdUser);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Kullanıcı oluşturma başarısız." });
    }
});

// Kullanıcı giriş rotası
router.post("/signin", async (req, res) => {
    try {
        const { emailOrUsername, password, rememberMe } = req.body;

        const user = await User.findOne({ 
            $or: [
                { email: emailOrUsername }, 
                { username: emailOrUsername }
            ]
        });

        if (!user) return res.status(400).json({ message: "Kullanıcı mevcut değil." });

        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) return res.status(400).json({ message: "Yanlış şifre" });

        const token = jwt.sign(
            { id: user._id, username: user.username, isAdmin: user.userType === 'ADMIN' },
            process.env.JWT_SECRET_KEY,
            { expiresIn: rememberMe ? "365d" : "1h" }
        );

        return res.status(200).json({ user, token, message: 'Başarılı giriş' });
    } catch (error) {
        return res.status(500).json({ message: "Sunucu hatası: " + error.message });
    }
});

  
// Kullanıcı profilini getirme (kimlik doğrulama gereklidir)
router.get("/getProfile", authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
        }
        return res.json(user);
    } catch (error) {
        return res.status(500).json({ message: 'Sunucu hatası.' });
    }
});

// Kullanıcı profilini güncelleme (kimlik doğrulama gereklidir)
router.put("/setProfile", authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
        }

        const { name, surname, phoneNumber } = req.body;
        if (name) user.name = name;
        if (surname) user.surname = surname;
        if (phoneNumber) user.phoneNumber = phoneNumber;

        await user.save();

        return res.json(user);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Sunucu hatası.' });
    }
});

// Şifre güncelleme rotası (kimlik doğrulama gereklidir)
router.put("/changePassword", authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
        }

        const { oldPassword, newPassword } = req.body;

        // Eski şifrenin doğru olup olmadığını kontrol et
        const isPasswordCorrect = await bcrypt.compare(oldPassword, user.password);
        if (!isPasswordCorrect) {
            return res.status(400).json({ message: "Eski şifre yanlış." });
        }

        // Yeni şifreyi hash'leyip kaydet
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds); // SaltRounds ile hashleme
        user.password = hashedPassword;

        await user.save();

        return res.json({ message: 'Şifre başarıyla güncellendi.' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Şifre güncellenirken bir hata oluştu.' });
    }
});


// Logout rotası
router.post("/logout", authMiddleware, (req, res) => {
    res.clearCookie('token'); // Token'ı temizle
    return res.status(200).json({ message: 'Başarıyla çıkış yaptınız' });
});

// Şifre sıfırlama kodu gönderme
router.post("/sendResetCode", async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "Bu e-posta ile bir kullanıcı bulunamadı." });
        }

        // 6-8 haneli rastgele kod oluştur
        const resetCode = crypto.randomInt(100000, 999999).toString();

        // 5 dakika geçerli bir kod oluştur
        user.resetCode = resetCode;
        user.resetCodeExpiry = Date.now() + 5 * 60 * 1000; // 5 dakika geçerli
        await user.save();

        // E-postaya kod gönder
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Şifre Sıfırlama Kodu",
            text: `Şifre sıfırlama kodunuz: ${resetCode}. Bu kod 5 dakika geçerlidir.`,
        };

        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: "Şifre sıfırlama kodu gönderildi." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Şifre sıfırlama kodu gönderilemedi." });
    }
});
  
// Şifreyi sıfırlama
router.post("/resetPassword", async (req, res) => {
    const { resetCode, newPassword } = req.body;

    try {
        const user = await User.findOne({ resetCode, resetCodeExpiry: { $gt: Date.now() } });
        if (!user) {
            return res.status(400).json({ message: "Geçersiz veya süresi dolmuş kod." });
        }

        // Yeni şifreyi hash'le ve kaydet
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        user.resetCode = undefined; // Kodları sıfırla
        user.resetCodeExpiry = undefined;
        await user.save();

        res.status(200).json({ message: "Şifre başarıyla güncellendi." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Şifre güncellenemedi." });
    }
});

module.exports = router;
