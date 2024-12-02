const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    email: {
        type: String,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
    },
    profilePicture: {
        type: String,
        default: 'default.png'
    },
    posts: {
        type: Array,
        default: []
    }
}, { timestamps: true });

const User = mongoose.model('user', userSchema);

module.exports = User;

