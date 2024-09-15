const mongoose = require('mongoose');
const validator = require('validator');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
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
        unique: true,
        validate: [validator.isEmail, "Geçersiz E-posta"]
    },
    password: {
        type: String,
        required: true,
        minlength: [8, "* Şifreniz 8 karakterden fazla olmalı"]
    },
    userType: {
        type: String,
        enum: ["USER", "ADMIN"],
        required: true
    },
    registrationDate: {
        type: Date,
        required: true,
        default: Date.now()
    },
    phoneNumber: {
        type: String,
        required: true
    },
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

module.exports = User;
