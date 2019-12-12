const { ApolloServer, gql } = require("apollo-server-koa");

const typeDefs = gql`
  scalar Date
  #data type
  type user {
    userId: ID
    name: String
    user: String
    userGroup: String
    mail: String
    orgin: String
    tel: Int
    creatTime: Date
    modifyTime: Date
    address: String
    status: Boolean
  }
  type result {
    msg: String
    ok: Int
    n: Int
    nModified: Int
  }

  #Query
  type Query {
    hello: String
    User(user: String, mail: String): user
    Users: [user]
  }

  #mutation
  type Mutation {
    #admin
    modify_select_user(user: String): result
    disable_select_user(user: String, status: Boolean): result
    delete_select_user(user: String): result
    #register
    userRegister(arg: String): result
  }
`;

const resolvers = {};

module.exports = new ApolloServer({ typeDefs, resolvers });
