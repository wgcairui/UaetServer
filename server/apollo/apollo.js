"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable no-unused-vars */
/* eslint-disable no-console */
/* eslint-disable no-return-await */
const apollo_server_koa_1 = require("apollo-server-koa");
const { BcryptDo } = require("../bin/bcrypt");
const { JwtVerify } = require("../bin/Secret");
const { NodeClient, NodeRunInfo, TerminalClientResult, TerminalClientResults } = require("../mongoose/node");
const { DeviceProtocol, DevsType } = require("../mongoose/DeviceAndProtocol");
const { Terminal } = require("../mongoose/Terminal");
const { EcTerminal } = require("../mongoose/EnvironmentalControl");
const { Users, UserBindDevice } = require("../mongoose/user");
const typeDefs = apollo_server_koa_1.gql `
  scalar Date
  scalar JSON
  scalar JSONObject
  #通用Mutate返回
  type result {
    msg: String
    ok: Int
    n: Int
    nModified: Int
  }
  #tool节点配置
  type Node {
    Name: String
    IP: String
    Port: Int
    MaxConnections: String
  }
  #tool协议详细指令
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
  #协议集
  type Protocol {
    Type: String
    Protocol: String
    ProtocolType: String
    instruct: [ProtocolInstruct]
  }
  #设备类型
  type DevType {
    Type: String
    DevModel: String
    Protocols: [Protocol]
  }
  #终端挂载的设备类型
  type MountDev {
    mountDev: String
    protocol: String
    pid: Int
  }
  #终端
  type Terminal {
    DevMac: String
    name: String
    mountNode: String
    mountDevs: [MountDev]
  }
  #环控
  type ECterminal {
    ECid: String
    name: String
    model: String
  }
  #节点的socket终端数据
  type NodeInfoTerminal {
    mac: String
    port: Int
    ip: String
    jw: String
  }
  #节点的运行状态
  type NodeInfo {
    updateTime: Date
    hostname: String
    totalmem: String
    freemem: String
    loadavg: [Float]
    type: String
    uptime: String
    NodeName: String
    Connections: Int
    SocketMaps: [NodeInfoTerminal]
  }
  #用户
  type User {
    name: String
    user: String
    userGroup: String
    mail: String
    company: String
    tel: Int
    creatTime: Date
    modifyTime: Date
    address: String
    status: Boolean
    messageId: String
  }
  # 用户绑定的设备
  type BindDevice {
    user: String
    UTs: [Terminal]
    ECs: [ECterminal]
  }
  # terminalData
  type terminalData {
    name: String
    value: String
    unit: String
  }
  # 透传设备数据
  type UartTerminalData {
    stat: String
    result: [terminalData]
    pid: Int
    time: Date
    mac: String
    type: Int
    protocol: String
    content: String
  }
  #Query
  type Query {
    #tool
    Node(IP: String, Name: String): Node
    Nodes: [Node]
    Protocol(Protocol: String): Protocol
    Protocols: [Protocol]
    DevType(DevModel: String): DevType
    DevTypes: [DevType]
    Terminal(DevMac: String): Terminal
    Terminals: [Terminal]
    ECterminal(ECid: String): ECterminal
    EcTerminals: [ECterminal]
    #admin
    NodeInfo(NodeName: String): [NodeInfo]
    #user
    User(user: String): User
    Users: [User]
    #BindDevice
    #由ctx提供user
    BindDevice: BindDevice
    BindDevices: [BindDevice]
    #获取用户组
    userGroup: String
    #获取透传设备数据
    UartTerminalData(DevMac: String, pid: Int): UartTerminalData
    UartTerminalDatas(DevMac: String, pid: Int, num: Int): [UartTerminalData]
    UartTerminalFragmentDatas(
      DevMac: String
      pid: Int
      start: String
      end: String
    ): [UartTerminalData]
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
    #User
    addUser(arg: JSON): result
    #addUserTerminal
    addUserTerminal(type: String, id: String): result
  }

  # Subscription
  type Subscription {
    postAdded: String
  }
`;
const resolvers = {
    Query: {
        // 节点状态
        async Node(root, { IP, Name }) {
            return await NodeClient.findOne({
                $or: [{ IP: IP || "" }, { Name: Name || "" }]
            });
        },
        async Nodes() {
            return await NodeClient.find();
        },
        // 协议
        async Protocol(root, { Protocol }) {
            return await DeviceProtocol.findOne({ Protocol });
        },
        async Protocols() {
            return await DeviceProtocol.find();
        },
        // 设备类型
        async DevType(root, { DevModel }) {
            return await DevsType.findOne({ DevModel });
        },
        async DevTypes(root, arg, ctx) {
            return await DevsType.find();
        },
        // 终端信息
        async Terminal(root, { DevMac }) {
            return await Terminal.findOne({ DevMac });
        },
        async Terminals() {
            return await Terminal.find();
        },
        // 环控终端信息
        async ECterminal(root, { ECid }) {
            return await EcTerminal.findOne({ ECid });
        },
        EcTerminals: async () => {
            return await EcTerminal.find({});
        },
        // 节点信息
        async NodeInfo(root, { NodeName }) {
            return await NodeRunInfo.find(NodeName ? { NodeName } : {});
        },
        // 用户
        async User(root, { user }, ctx) {
            return await Users.findOne({ user });
        },
        async Users() {
            return await Users.find();
        },
        // 绑定设备信息
        async BindDevice(root, arg, ctx) {
            const Bind = await UserBindDevice.findOne({ user: ctx.user }).lean();
            if (!Bind)
                return null;
            Bind.UTs = await Terminal.find({ DevMac: { $in: Bind.UTs } });
            Bind.ECs = await EcTerminal.find({ ECid: { $in: Bind.ECs } });
            return Bind;
        },
        async BindDevices() {
            const Bind = await UserBindDevice.find({}).lean();
            if (!Bind || Bind.length === 0)
                return null;
            Bind.forEach(async (el) => {
                el.UTs = await Terminal.find({ DevMac: { $in: el.UTs } });
            });
            // Bind.UTs = await Terminal.find({ DevMac: { $in: Bind.UTs } });
            return await Bind;
        },
        // 获取用户组
        userGroup(root, arg, ctx) {
            return ctx.userGroup;
        },
        // 获取透传设备数据-单条
        async UartTerminalData(root, { DevMac, pid }) {
            return await TerminalClientResult.findOne({ mac: DevMac, pid });
        },
        // 获取透传设备数据-多条
        async UartTerminalDatas(root, { DevMac, pid, num }) {
            return await TerminalClientResults.find({ mac: DevMac, pid })
                .sort("-_id")
                .limit(num);
        },
        // 获取透传设备数据-时间片段
        async UartTerminalFragmentDatas(root, { DevMac, pid, start, end }) {
            return await TerminalClientResults.find({ mac: DevMac, pid })
                .where("time")
                .lte(new Date(end))
                .gte(new Date(start))
                .exec();
        }
    },
    Mutation: {
        // 设置节点
        async setNode(root, { arg }, ctx) {
            const { Name, IP, Port, MaxConnections } = JSON.parse(arg);
            const result = await NodeClient.updateOne({ IP }, { $set: { Name, Port, MaxConnections } }, { upsert: true });
            await ctx.$Event.Query.RefreshCacheNode();
            return result;
        },
        // 删除节点
        async deleteNode(root, { IP }, ctx) {
            const result = await NodeClient.deleteOne({ IP });
            await ctx.$Event.Query.RefreshCacheNode();
            return result;
        },
        // 设置协议
        async setProtocol(root, { arg }, ctx) {
            const { Type, ProtocolType, Protocol, instruct } = arg;
            const result = await DeviceProtocol.updateOne({ Type, Protocol }, { $set: { ProtocolType, instruct } }, { upsert: true });
            await ctx.$Event.Query.RefreshCacheProtocol();
            return result;
        },
        // 删除协议
        async deleteProtocol(root, { Protocol }, ctx) {
            const result = await DeviceProtocol.deleteOne({ Protocol });
            await ctx.$Event.Query.RefreshCacheProtocol();
            return result;
        },
        // 添加设备类型
        async addDevType(root, { arg }, ctx) {
            const { Type, DevModel, Protocols } = arg;
            const result = await DevsType.updateOne({ Type, DevModel }, { $set: { Protocols } }, { upsert: true });
            await ctx.$Event.Query.RefreshCacheDevType();
            return result;
        },
        // 添加设备类型
        async deleteDevModel(root, { DevModel }, ctx) {
            const result = await DevsType.deleteOne({ DevModel });
            await ctx.$Event.Query.RefreshCacheDevType();
            return result;
        },
        // 添加终端信息
        async addTerminal(root, { arg }, ctx) {
            const { DevMac, name, mountNode, mountDevs } = arg;
            const result = await Terminal.updateOne({ DevMac, name, mountNode }, { $set: { mountDevs } }, { upsert: true });
            await ctx.$Event.Query.RefreshCacheTerminal();
            return result;
        },
        // 删除终端信息
        async deleteTerminal(root, { DevMac }, ctx) {
            const result = await Terminal.deleteOne({ DevMac });
            await ctx.$Event.Query.RefreshCacheTerminal();
            return result;
        },
        // 添加终端挂载信息
        async addTerminalMountDev(root, { arg }, ctx) {
            const { DevMac, mountDev, protocol, pid } = arg;
            const result = await Terminal.updateOne({ DevMac }, {
                $addToSet: {
                    mountDevs: {
                        mountDev,
                        protocol,
                        pid
                    }
                }
            });
            await ctx.$Event.Query.RefreshCacheTerminal();
            return result;
        },
        // 添加用户
        async addUser(root, { arg }) {
            const userStat = await Users.findOne({ user: arg.user });
            if (userStat)
                return { ok: 0, msg: "账号有重复,请重新编写账号" };
            const user = Object.assign(arg, { passwd: await BcryptDo(arg.passwd) });
            const User = new Users(user);
            return await User.save()
                .then(() => {
                return { ok: 1, msg: "账号注册成功" };
            })
                .catch((e) => console.log(e));
        },
        // 添加用户绑定终端
        async addUserTerminal(root, { type, id }, ctx) {
            switch (type) {
                case "UT":
                    return await UserBindDevice.updateOne({ user: ctx.user }, { $addToSet: { UTs: id } }, { upsert: true });
                case "EC":
                    return await UserBindDevice.updateOne({ user: ctx.user }, { $addToSet: { ECs: id } }, { upsert: true });
            }
        }
    }
};
const context = ({ ctx }) => {
    // 获取Token
    const token = ctx.cookies.get("auth._token.local");
    // 没有token则检查body，注册和重置页面的请求则通过
    if (token && token === "false") {
        // 获取gragpl
        const { operationName } = ctx.request.body;
        const guestQuery = ["getUser", "addUserAccont"];
        if (operationName && guestQuery.includes(operationName))
            return { user: "guest", loggedIn: false };
        else
            throw new Error("query error");
    }
    // 解构token
    const user = JwtVerify(token.replace("bearer%20", ""));
    //
    if (!user || !user.user)
        throw new Error("you must be logged in");
    return { ...user, loggedIn: true, $Event: ctx.$Event };
};
exports.default = new apollo_server_koa_1.ApolloServer({ typeDefs, resolvers, context });
