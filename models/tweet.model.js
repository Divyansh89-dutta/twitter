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
    comments: {
        type: [String],
        default: []
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Tweet', tweetSchema);

