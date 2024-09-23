const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  notificationText: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now, // Bildirimin oluşturulduğu tarih otomatik olarak atanır
  },
  notificationType: {
    type: String,
    enum: ['info', 'warning', 'error'], // Örneğin, bilgi, uyarı veya hata gibi farklı bildirim tipleri olabilir
    default: 'info', // Varsayılan olarak 'info' tipi atanır
  },
  isRead: {
    type: Boolean,
    default: false, // Bildirimin okunup okunmadığını izlemek için
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Kullanıcıya referans
    required: true,
  },
});

module.exports = mongoose.model('Notification', notificationSchema);
