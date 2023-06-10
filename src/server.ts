import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import express, { json } from "express";
import http from "http";
import cors from "cors";
import { auth } from "express-openid-connect";
import { readFileSync } from "fs";
import { resolvers } from "./resolvers.js";
import { Db } from "mongodb";
import { connectDB } from "./connect.js";
const typeDefs = readFileSync("./schema.graphql", "utf-8");
const db = await connectDB();

const corsOptions = {
  origin: [process.env.BASE_URL, "https://studio.apollographql.com"],
  allowedHeaders: "*",
};

export interface Context {
  dataSources: {
    db: Db;
  };
  isAuthenticated: boolean;
}

const app = express();
const httpServer = http.createServer(app);
const server = new ApolloServer<Context>({
  typeDefs,
  resolvers,
  introspection: true,
  plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
});
await server.start();

const auth0config = {
  authRequired: false,
  auth0Logout: true,
  secret: process.env.AUTH0_SECRET,
  baseURL: process.env.BASE_URL,
  clientID: process.env.AUTH0_CLIENT_ID,
  issuerBaseURL: process.env.AUTH0_DOMAIN,
};

app.use(auth(auth0config));

app.get("/", (req, res) => {
  res.sendFile("index.html", { root: "./public" });
});

app.use(
  "/graphql",
  cors<cors.CorsRequest>(corsOptions),
  json(),
  expressMiddleware(server, {
    context: async ({ req }) => {
      return {
        dataSources: { db },
        isAuthenticated: req.oidc.isAuthenticated(),
      };
    },
  })
);

await new Promise<void>((resolve) =>
  httpServer.listen({ port: process.env.PORT }, resolve)
);

// eslint-disable-next-line no-console
console.log(`🚀 Server ready at http://localhost:${process.env.PORT}/graphql`);
