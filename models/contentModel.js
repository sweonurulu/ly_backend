const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema({
    aboutUsContent: {
        type: String,
        required: true
    },
    customerServiceContent: {
        type: String,
        required: true
    },
    bookOrderContent: {
        type: String,
        required: true
    },
    internationalPublicationURL: {
        type: String,
        required: false
    },
    referencesURL: {
        type: String,
        required: false
    }
});

module.exports = mongoose.models.Content || mongoose.model('Content', contentSchema);
