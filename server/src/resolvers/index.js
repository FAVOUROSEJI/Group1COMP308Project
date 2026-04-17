const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Post = require("../models/Post");
const HelpRequest = require("../models/HelpRequest");
const EmergencyAlert = require("../models/EmergencyAlert");
const BusinessListing = require("../models/BusinessListing");
const Review = require("../models/Review");
const Deal = require("../models/Deal");
const Event = require("../models/Event");

const JWT_SECRET = "secret123";

const getUserFromToken = async (token) => {
  if (!token) throw new Error("Not authenticated");
  const decoded = jwt.verify(token.replace("Bearer ", ""), JWT_SECRET);
  const user = await User.findById(decoded.id);
  if (!user) throw new Error("User not found");
  return user;
};

const resolvers = {
  Query: {
    hello: () => "Backend working 🚀",

    getPosts: async () => {
      return await Post.find().populate("author").sort({ createdAt: -1 });
    },

    getHelpRequests: async () => {
      return await HelpRequest.find().populate("author").sort({ createdAt: -1 });
    },

    getEmergencyAlerts: async () => {
      return await EmergencyAlert.find().populate("author").sort({ createdAt: -1 });
    },

    getBusinessListings: async () => {
      return await BusinessListing.find().populate("author").sort({ createdAt: -1 });
    },

    getReviews: async (_, { businessId }) => {
      return await Review.find({ business: businessId })
        .populate("author")
        .populate("business")
        .sort({ createdAt: -1 });
    },

    getDeals: async (_, { businessId }) => {
      return await Deal.find({ business: businessId })
        .populate("business")
        .sort({ createdAt: -1 });
    },

    getEvents: async () => {
      return await Event.find().populate("organizer").sort({ createdAt: -1 });
    },
  },

  Mutation: {
    register: async (_, { name, email, password, role }) => {
      const hashed = await bcrypt.hash(password, 10);
      const user = await User.create({ name, email, password: hashed, role });
      const token = jwt.sign({ id: user._id }, JWT_SECRET);
      return { id: user._id, name: user.name, email: user.email, role: user.role, token };
    },

    login: async (_, { email, password }) => {
      const user = await User.findOne({ email });
      if (!user) throw new Error("User not found");
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) throw new Error("Invalid password");
      const token = jwt.sign({ id: user._id }, JWT_SECRET);
      return { id: user._id, name: user.name, email: user.email, role: user.role, token };
    },

    createPost: async (_, { title, content }, { token }) => {
      const user = await getUserFromToken(token);
      const post = await Post.create({ title, content, author: user._id });
      return await Post.findById(post._id).populate("author");
    },

    createHelpRequest: async (_, { title, description }, { token }) => {
      const user = await getUserFromToken(token);
      const helpRequest = await HelpRequest.create({ title, description, author: user._id });
      return await HelpRequest.findById(helpRequest._id).populate("author");
    },

    createEmergencyAlert: async (_, { title, description, location }, { token }) => {
      const user = await getUserFromToken(token);
      const alert = await EmergencyAlert.create({ title, description, location, author: user._id });
      return await EmergencyAlert.findById(alert._id).populate("author");
    },

    createBusinessListing: async (_, { name, description, category }, { token }) => {
      const user = await getUserFromToken(token);
      const listing = await BusinessListing.create({ name, description, category, author: user._id });
      return await BusinessListing.findById(listing._id).populate("author");
    },

    createReview: async (_, { businessId, content, rating }, { token }) => {
      const user = await getUserFromToken(token);
      const review = await Review.create({ content, rating, business: businessId, author: user._id });
      return await Review.findById(review._id).populate("author").populate("business");
    },

    createDeal: async (_, { businessId, title, description }, { token }) => {
      const user = await getUserFromToken(token);
      const deal = await Deal.create({ title, description, business: businessId });
      return await Deal.findById(deal._id).populate("business");
    },

    createEvent: async (_, { title, description, date, location }, { token }) => {
      const user = await getUserFromToken(token);
      const event = await Event.create({ title, description, date, location, organizer: user._id });
      return await Event.findById(event._id).populate("organizer");
    },
  },
};

module.exports = resolvers;