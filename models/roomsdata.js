const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    roomId: { type: String, required: true,unique: true },
    users: [String],
    mods: [String],
    name: String,
    muted: [String],
    blocked: [String],
    badgeurl: String,
    videourl: String,
    bio: String
});

const RoomModel = mongoose.model('Room', roomSchema);

module.exports = RoomModel;
