const { ApolloServer, gql } = require("apollo-server-koa");
const { NodeClient } = require("../mongoose/node");

const typeDefs = gql`
  scalar Date
  #data type
  type result {
    msg: String
    ok: Int
    n: Int
    nModified: Int
  }
  type Node {
    Name: String
    IP: String
    Port: Int
    MaxConnections: String
  }
  #Query
  type Query {
    #
    Node(IP: String, Name: String): Node
  }

  #mutation
  type Mutation {
    #admin
    setNode(arg: String): result
  }
`;

const resolvers = {
  Query: {
    async Node(root, { IP, Name }) {
      // eslint-disable-next-line no-return-await
      return await NodeClient.findOne({
        $or: [{ IP: IP || "" }, { Name: Name || "" }]
      });
    }
  },
  Mutation: {
    async setNode(root, { arg }) {
      const { Name, IP, Port, MaxConnections } = JSON.parse(arg);
      // eslint-disable-next-line no-return-await
      return await NodeClient.updateOne(
        { IP },
        { $set: { Name, Port, MaxConnections } },
        { upsert: true }
      );
    }
  }
};

module.exports = new ApolloServer({ typeDefs, resolvers });
