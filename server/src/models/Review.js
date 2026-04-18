const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
    content: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    business: { type: mongoose.Schema.Types.ObjectId, ref: "BusinessListing", required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    ownerReply: { type: String, default: null },
}, { timestamps: true });

module.exports = mongoose.model("Review", reviewSchema);