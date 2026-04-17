const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const { ApolloServer } = require("apollo-server-express");

const typeDefs = require("./schemas");
const resolvers = require("./resolvers");

async function startServer() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // ✅ STEP 1: CONNECT DB FIRST (IMPORTANT)
  await mongoose.connect("mongodb://127.0.0.1:27017/neighborhoodHub");
  console.log("✅ MongoDB Connected");

  // ✅ STEP 2: THEN START GRAPHQL
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req }) => ({
      token: req.headers.authorization || "",
    }),
  });

  await server.start();
  server.applyMiddleware({ app });

  app.listen(4000, () => {
    console.log("🚀 Server running at http://localhost:4000/graphql");
  });
}

startServer();