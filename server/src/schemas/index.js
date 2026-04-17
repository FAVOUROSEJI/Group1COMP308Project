const { gql } = require("apollo-server-express");

const typeDefs = gql`
  type User {
    id: ID!
    name: String!
    email: String!
    role: String!
    token: String
  }

  type Post {
    id: ID!
    title: String!
    content: String!
    author: User!
    createdAt: String!
  }

  type HelpRequest {
    id: ID!
    title: String!
    description: String!
    author: User!
    createdAt: String!
  }

  type EmergencyAlert {
    id: ID!
    title: String!
    description: String!
    location: String!
    author: User!
    createdAt: String!
  }

  type BusinessListing {
    id: ID!
    name: String!
    description: String!
    category: String!
    author: User!
  }

  type Review {
    id: ID!
    content: String!
    rating: Int!
    business: BusinessListing!
    author: User!
  }

  type Deal {
    id: ID!
    title: String!
    description: String!
    business: BusinessListing!
  }

  type Event {
    id: ID!
    title: String!
    description: String!
    date: String!
    location: String!
    organizer: User!
  }

  type Query {
    hello: String
    getPosts: [Post]
    getHelpRequests: [HelpRequest]
    getEmergencyAlerts: [EmergencyAlert]
    getBusinessListings: [BusinessListing]
    getReviews(businessId: ID!): [Review]
    getDeals(businessId: ID!): [Deal]
    getEvents: [Event]
  }

  type Mutation {
    register(name: String!, email: String!, password: String!, role: String): User
    login(email: String!, password: String!): User
    createPost(title: String!, content: String!): Post
    createHelpRequest(title: String!, description: String!): HelpRequest
    createEmergencyAlert(title: String!, description: String!, location: String!): EmergencyAlert
    createBusinessListing(name: String!, description: String!, category: String!): BusinessListing
    createReview(businessId: ID!, content: String!, rating: Int!): Review
    createDeal(businessId: ID!, title: String!, description: String!): Deal
    createEvent(title: String!, description: String!, date: String!, location: String!): Event
  }
`;

module.exports = typeDefs;