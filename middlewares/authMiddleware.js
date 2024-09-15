const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Yetkilendirme tokenı bulunamadı.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY); // JWT token doğrulaması
        req.user = decoded; // Token geçerliyse kullanıcı bilgilerini req.user'a ekle
        console.log("Decoded user:", req.user); // Kullanıcı bilgilerini loglayın

        next(); // Bir sonraki middleware'e geç
    } catch (error) {
        console.error("Token doğrulama hatası:", error);
        return res.status(401).json({ message: 'Geçersiz token.' });
    }
};

module.exports = authMiddleware;
