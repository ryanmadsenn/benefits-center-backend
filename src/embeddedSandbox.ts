import { ApolloSandbox } from "@apollo/sandbox";

new ApolloSandbox({
  target: "#embedded-sandbox",
  initialEndpoint: `${process.env.BASE_URL}/graphql`,
});
