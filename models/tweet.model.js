const mongoose = require('mongoose');

const tweetSchema = new mongoose.Schema({
    tweet: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true
    },
    likes: {
        type: [String],
        default: []
    },
    profilePicture: {
        type: String,
        default: 'default.png'
    },
    comments: [{
        comment: String,
        username: String,
        createdAt: Date
    }],
    postPicture: {
        type: String,
        default: 'default.png, default.jpg, default.jpeg, default.webp, default.gif'
    },
    document: {
        type: String,
        default: 'default.pdf, default.doc, default.docx, default.txt, default.ppt, default.pptx, default.xls, default.xlsx, default.csv'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Tweet', tweetSchema);

