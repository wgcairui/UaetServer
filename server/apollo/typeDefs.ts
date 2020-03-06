import { DocumentNode } from "graphql";
import { gql } from "apollo-server-koa";
import { GraphQLJSON, GraphQLJSONObject } from "graphql-type-json";

const typeDefs: DocumentNode = gql`
  scalar Date
  scalar JSON
  scalar JSONObject
  # 通用Mutate返回
  type result {
    msg: String
    ok: Int
    n: Int
    nModified: Int
    upserted:JSON
  }
  # tool节点配置
  type Node {
    Name: String
    IP: String
    Port: Int
    MaxConnections: String
  }
  # tool协议详细指令
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
  # 协议集
  type Protocol {
    Type: Int
    Protocol: String
    ProtocolType: String
    instruct: [ProtocolInstruct]
  }
  # 设备类型
  type DevType {
    Type: String
    DevModel: String
    Protocols: [Protocol]
  }
  # 终端挂载的设备类型
  type MountDev {
    Type:String
    mountDev: String
    protocol: String
    pid: Int
  }
  # 注册终端
  type RegisterTerminal{
    DevMac: String
    mountNode: String
  }
  # 终端
  type Terminal {
    DevMac: String
    name: String
    mountNode: String
    mountDevs: [MountDev]
  }
  # 环控
  type ECterminal {
    ECid: String
    name: String
    model: String
  }
  # 节点的socket终端数据
  type NodeInfoTerminal {
    mac: String
    port: Int
    ip: String
    jw: String
  }
  # 节点的运行状态
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
  # 用户
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
    timeStamp: String
    mac: String
    type: Int
    protocol: String
    content: String
  }
  # 设备常量
  type Constant{
    #air
    HeatChannelTemperature: String
    HeatChannelHumidity: String
    ColdChannelTemperature: String
    ColdChannelHumidity: String
    RefrigerationTemperature: String
    RefrigerationHumidity: String
    Speed: String
    HeatModel: String
    ColdModel: String
    Dehumidification: String
    Humidification: String
    Temperature: String
    Humidity: String
  }
  # 每个协议的设备常量和阀值，显示参数
  type DevConstant{
    Protocol: String
    ProtocolType: String
    Constant:Constant
    Threshold:JSON
    ShowTag:[String]
  }
  #Query
  type Query {
    #tool
    Node(IP: String, Name: String): Node
    Nodes: [Node]
    Protocol(Protocol: String): Protocol
    Protocols: [Protocol]
    DevType(DevModel: String): DevType
    DevTypes(Type:String): [DevType]
    # 查询注册终端设备的节点
    RegisterTerminal(DevMac:String):RegisterTerminal
    # 查询节点所属终端
    RegisterTerminals(NodeName:String):[RegisterTerminal]
    # 终端
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
    UartTerminalDatas(
      DevMac: String
      pid: Int
      datatime: String
    ): [UartTerminalData],
    # 获取协议常量
    getDevConstant(Protocol:String):DevConstant
  }

  #mutation
  type Mutation {
    #admin
    # 配置Node
    setNode(arg: String): result
    deleteNode(IP: String): result
    # 配置协议
    setProtocol(arg: JSON): result
    # 删除协议
    deleteProtocol(Protocol: String): result
    # 添加设备类型
    addDevType(arg: JSON): result
    # 删除设备类型
    deleteDevModel(DevModel: String): result
    # 添加注册终端
    addRegisterTerminal(DevMac:String,mountNode:String):result
    # 删除注册终端
    deleteRegisterTerminal(DevMac:String):result
    # 添加终端
    addTerminal(arg: JSON): result
    # 删除终端
    deleteTerminal(DevMac: String): result
    # 添加终端挂载设备
    addTerminalMountDev(arg: JSON): result
    # 删除终端挂载设备
    delTerminalMountDev( DevMac:String,mountDev:String,pid:Int):result
    # 修改终端挂载设备
    modifyTerminalMountDev( DevMac:String,pid:Int,arg:JSON):result
    #User
    addUser(arg: JSON): result
    #addUserTerminal
    addUserTerminal(type: String, id: String): result
    #添加设备协议常量配置
    addDevConstent(Protocol: String, ProtocolType: String,type:String arg: JSON): result
  }

  # Subscription
  type Subscription {
    postAdded: String
  }
`;

export default typeDefs