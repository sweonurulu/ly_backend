const mongoose = require('mongoose');
const validator = require("validator");

const contactSchema = new mongoose.Schema({
    username: {
        type: String,
        minlength: [2, "* Kullanıcı Adınız 2 karakterden fazla olmalı"]
    },
    name: {
        type: String,
        required: true,
        minlength: [2, "* İsminiz 2 karakterden fazla olmalı"]
    },
    surname: {
        type: String,
        required: true,
        minlength: [2, "* Soyisminiz 2 karakterden fazla olmalı"]
    },
    email: {
        type: String,
        required: true,
        validate: [validator.isEmail, "Geçersiz E-posta"]
    },
    message: {
        type: String,
        required: true,
        minlength: [3, "* Mesajınız 3 karakterden fazla olmalı"]
    },
    phoneNumber: {
        type: String,
        required: true
    },
});

const Contact = mongoose.models.Contact || mongoose.model('Contact', contactSchema);

module.exports = Contact;
