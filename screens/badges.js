const mongoose = require('mongoose');

const badgeSchema = new mongoose.Schema({
    badgeid: { type: String, required: true,unique: true },
    
    mod: [String],
    vip: [String],
    default: [String],
    
});

const badgeModel = mongoose.model('badges', badgeSchema);

module.exports = badgeModel;
