const mongoose = require("mongoose");

const dealSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    business: { type: mongoose.Schema.Types.ObjectId, ref: "BusinessListing", required: true },
}, { timestamps: true });

module.exports = mongoose.model("Deal", dealSchema);