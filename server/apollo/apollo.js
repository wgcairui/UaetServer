/* eslint-disable no-unused-vars */
/* eslint-disable no-console */
/* eslint-disable no-return-await */
const { ApolloServer, gql } = require("apollo-server-koa");
const { GraphQLJSON, GraphQLJSONObject } = require("graphql-type-json");
const { NodeClient } = require("../mongoose/node");
const { DeviceProtocol, DevsType } = require("../mongoose/DeviceAndProtocol");
const { Terminal } = require("../mongoose/Terminal");

const typeDefs = gql`
  scalar Date
  scalar JSON
  scalar JSONObject
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
  type ProtocolInstruct {
    name: String
    resultType: String
    shift: Boolean
    shiftNum: Int
    pop: Boolean
    popNum: Int
    resize: String
    formResize: JSON
  }
  type Protocol {
    Type: String
    Protocol: String
    instruct: [ProtocolInstruct]
  }
  type DevType {
    Type: String
    DevModel: String
    Protocols: [Protocol]
  }
  type MountDev {
    mountDev: String
    protocol: String
    pid: Int
  }
  type Terminal {
    DevMac: String
    name: String
    mountNode: String
    mountDevs: [MountDev]
  }
  #Query
  type Query {
    #
    Node(IP: String, Name: String): Node
    Nodes: [Node]
    Protocol(Protocol: String): Protocol
    Protocols: [Protocol]
    DevType(DevModel: String): DevType
    DevTypes: [DevType]
    Terminal(DevMac: String): Terminal
    Terminals: [Terminal]
  }

  #mutation
  type Mutation {
    #admin
    setNode(arg: String): result
    deleteNode(IP: String): result
    setProtocol(arg: JSON): result
    deleteProtocol(Protocol: String): result
    addDevType(arg: JSON): result
    deleteDevModel(DevModel: String): result
    addTerminal(arg: JSON): result
    deleteTerminal(DevMac: String): result
    addTerminalMountDev(arg: JSON): result
  }
`;

const resolvers = {
  Query: {
    async Node(root, { IP, Name }) {
      return await NodeClient.findOne({
        $or: [{ IP: IP || "" }, { Name: Name || "" }]
      });
    },
    async Nodes() {
      return await NodeClient.find();
    },
    async Protocol(root, { Protocol }) {
      return await DeviceProtocol.findOne({ Protocol });
    },
    async Protocols() {
      return await DeviceProtocol.find();
    },
    async DevType(root, { DevModel }) {
      return await DevsType.findOne({ DevModel });
    },
    async DevTypes() {
      return await DevsType.find();
    },
    async Terminal(root, { DevMac }) {
      return await Terminal.findOne({ DevMac });
    },
    async Terminals() {
      return await Terminal.find();
    }
  },
  Mutation: {
    async setNode(root, { arg }) {
      const { Name, IP, Port, MaxConnections } = JSON.parse(arg);
      return await NodeClient.updateOne(
        { IP },
        { $set: { Name, Port, MaxConnections } },
        { upsert: true }
      );
    },
    async deleteNode(root, { IP }) {
      return await NodeClient.deleteOne({ IP });
    },
    async setProtocol(root, { arg }) {
      const { Type, Protocol, instruct } = arg;
      return await DeviceProtocol.updateOne(
        { Type, Protocol },
        { $set: { instruct } },
        { upsert: true }
      );
    },
    async deleteProtocol(root, { Protocol }) {
      return await DeviceProtocol.deleteOne({ Protocol });
    },
    async addDevType(root, { arg }) {
      const { Type, DevModel, Protocols } = arg;
      return await DevsType.updateOne(
        { Type, DevModel },
        { $set: { Protocols } },
        { upsert: true }
      );
    },
    async deleteDevModel(root, { DevModel }) {
      return await DevsType.deleteOne({ DevModel });
    },
    async addTerminal(root, { arg }) {
      const { DevMac, name, mountNode, mountDevs } = arg;
      return await Terminal.updateOne(
        { DevMac, name, mountNode },
        { $set: { mountDevs } },
        { upsert: true }
      );
    },
    async deleteTerminal(root, { DevMac }) {
      return await Terminal.deleteOne({ DevMac });
    },
    async addTerminalMountDev(root, { arg }) {
      const { DevMac, mountDev, protocol, pid } = arg;
      return await Terminal.updateOne(
        { DevMac },
        {
          $addToSet: {
            mountDevs: {
              mountDev,
              protocol,
              pid
            }
          }
        }
      );
    }
  }
};

module.exports = new ApolloServer({ typeDefs, resolvers });
