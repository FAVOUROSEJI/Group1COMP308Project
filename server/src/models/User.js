const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: {
    type: String,
    enum: ["resident", "business", "organizer"],
    default: "resident",
  },
});

module.exports = mongoose.model("User", userSchema);