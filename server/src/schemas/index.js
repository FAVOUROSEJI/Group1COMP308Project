const { gql } = require("apollo-server-express");

const typeDefs = gql`
  type User {
    id: ID!
    name: String!
    email: String!
    role: String!
    token: String
  }

  type Query {
    hello: String
  }

  type Mutation {
    register(name: String!, email: String!, password: String!, role: String): User
    login(email: String!, password: String!): User
  }
`;

module.exports = typeDefs;