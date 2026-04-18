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

const JWT_SECRET = process.env.JWT_SECRET || "secret123";

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
      return await HelpRequest.find().populate("author").populate("volunteers").sort({ createdAt: -1 });
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
      return await Event.find().populate("organizer").populate("volunteers").sort({ createdAt: -1 });
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
      const listing = await BusinessListing.findById(businessId);
      if (!listing) throw new Error("Business listing not found");
      if (String(listing.author) !== String(user._id)) throw new Error("Not authorized to post deals for this business");
      const deal = await Deal.create({ title, description, business: businessId });
      return await Deal.findById(deal._id).populate("business");
    },

    createEvent: async (_, { title, description, date, location }, { token }) => {
      const user = await getUserFromToken(token);
      const event = await Event.create({ title, description, date, location, organizer: user._id });
      return await Event.findById(event._id).populate("organizer").populate("volunteers");
    },

    joinEvent: async (_, { eventId }, { token }) => {
      const user = await getUserFromToken(token);
      const event = await Event.findById(eventId);
      if (!event) throw new Error("Event not found");
      if (event.volunteers.map(String).includes(String(user._id))) throw new Error("Already joined this event");
      event.volunteers.push(user._id);
      await event.save();
      return await Event.findById(eventId).populate("organizer").populate("volunteers");
    },

    volunteerForHelp: async (_, { requestId }, { token }) => {
      const user = await getUserFromToken(token);
      const req = await HelpRequest.findById(requestId);
      if (!req) throw new Error("Help request not found");
      if (String(req.author) === String(user._id)) throw new Error("Cannot volunteer for your own request");
      if (req.volunteers.map(String).includes(String(user._id))) throw new Error("Already volunteered");
      req.volunteers.push(user._id);
      await req.save();
      return await HelpRequest.findById(requestId).populate("author").populate("volunteers");
    },

    fulfillHelpRequest: async (_, { requestId }, { token }) => {
      const user = await getUserFromToken(token);
      const req = await HelpRequest.findById(requestId);
      if (!req) throw new Error("Help request not found");
      if (String(req.author) !== String(user._id)) throw new Error("Only the author can mark this as fulfilled");
      req.status = "fulfilled";
      await req.save();
      return await HelpRequest.findById(requestId).populate("author").populate("volunteers");
    },

    deleteHelpRequest: async (_, { id }, { token }) => {
      const user = await getUserFromToken(token);
      const req = await HelpRequest.findById(id);
      if (!req) throw new Error("Help request not found");
      if (String(req.author) !== String(user._id)) throw new Error("Not authorized");
      await HelpRequest.findByIdAndDelete(id);
      return true;
    },

    updateBusinessListing: async (_, { id, name, description, category }, { token }) => {
      const user = await getUserFromToken(token);
      const listing = await BusinessListing.findById(id);
      if (!listing) throw new Error("Listing not found");
      if (String(listing.author) !== String(user._id)) throw new Error("Not authorized");
      if (name) listing.name = name;
      if (description) listing.description = description;
      if (category) listing.category = category;
      await listing.save();
      return await BusinessListing.findById(id).populate("author");
    },

    deleteBusinessListing: async (_, { id }, { token }) => {
      const user = await getUserFromToken(token);
      const listing = await BusinessListing.findById(id);
      if (!listing) throw new Error("Listing not found");
      if (String(listing.author) !== String(user._id)) throw new Error("Not authorized");
      await BusinessListing.findByIdAndDelete(id);
      await Review.deleteMany({ business: id });
      await Deal.deleteMany({ business: id });
      return true;
    },

    deleteReview: async (_, { id }, { token }) => {
      const user = await getUserFromToken(token);
      const review = await Review.findById(id);
      if (!review) throw new Error("Review not found");
      if (String(review.author) !== String(user._id)) throw new Error("Not authorized");
      await Review.findByIdAndDelete(id);
      return true;
    },

    deleteDeal: async (_, { id }, { token }) => {
      const user = await getUserFromToken(token);
      const deal = await Deal.findById(id).populate("business");
      if (!deal) throw new Error("Deal not found");
      if (String(deal.business.author) !== String(user._id)) throw new Error("Not authorized");
      await Deal.findByIdAndDelete(id);
      return true;
    },

    deleteEvent: async (_, { id }, { token }) => {
      const user = await getUserFromToken(token);
      const event = await Event.findById(id);
      if (!event) throw new Error("Event not found");
      if (String(event.organizer) !== String(user._id)) throw new Error("Not authorized");
      await Event.findByIdAndDelete(id);
      return true;
    },

    addReviewReply: async (_, { reviewId, reply }, { token }) => {
      const user = await getUserFromToken(token);
      const review = await Review.findById(reviewId).populate("business");
      if (!review) throw new Error("Review not found");
      if (String(review.business.author) !== String(user._id)) throw new Error("Only the business owner can reply");
      review.ownerReply = reply;
      await review.save();
      return await Review.findById(reviewId).populate("author").populate("business");
    },
  },
};

module.exports = resolvers;