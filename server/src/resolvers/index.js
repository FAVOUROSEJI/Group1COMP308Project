const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const JWT_SECRET = "secret123";

const resolvers = {
  Query: {
    hello: () => "Backend working 🚀",
  },

  Mutation: {
    register: async (_, { name, email, password, role }) => {
      const hashed = await bcrypt.hash(password, 10);

      const user = await User.create({
        name,
        email,
        password: hashed,
        role,
      });

      const token = jwt.sign({ id: user._id }, JWT_SECRET);

      return {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token,
      };
    },

    login: async (_, { email, password }) => {
      const user = await User.findOne({ email });
      if (!user) throw new Error("User not found");

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) throw new Error("Invalid password");

      const token = jwt.sign({ id: user._id }, JWT_SECRET);

      return {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token,
      };
    },
  },
};

module.exports = resolvers;