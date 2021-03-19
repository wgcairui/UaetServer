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
    arg:JSON
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
    isUse: Boolean
    isSplit: Boolean
    noStandard: Boolean
    scriptStart: String
    scriptEnd: String
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
    online: Boolean
    mountDev: String
    protocol: String
    pid: Int
  }
  # 聚合设备
  type aggregationDev {
    DevMac: String
    name: String
    Type:String
    mountDev: String
    protocol: String
    pid: Int
  }
  type aggregation {
    user: String
    id: String
    name: String
    aggregations:[aggregationDev]
    devs:JSON
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
    ip:String
    port:Int

    AT: Boolean
    jw: String
    uart: String
    PID: String
    ver: String
    Gver: String
    iotStat: String
    ICCID: String

    uptime: String
    online: Boolean
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
    updateTime: String
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
    avanter: String
    name: String
    user: String
    userGroup: String
    mail: String
    company: String
    tel: String
    creatTime: Date
    modifyTime: Date
    address: String
    status: Boolean
    messageId: String 
    rgtype: String
  }
  # 用户绑定的设备
  type BindDevice {
    user: String
    UTs: [Terminal]
    ECs: [ECterminal]
    AGG: [aggregation]
  }
  # terminalData
  type terminalData {
    name: String
    value: String
    unit: String
    alarm: Boolean
    alias: String
  }
  # 透传设备数据
  type UartTerminalData {
    stat: String
    pid: Int
    time: Date
    timeStamp: String
    mac: String
    type: Int
    protocol: String
    content: String
    result: [terminalData]
    Interval: Int
    useTime: Int
  }
  # 设备常量
  type Constant{
    WorkMode: String
    Switch: String
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
    # th and air
    Temperature: String
    Humidity: String
    # ups
    
    UpsStat: [String]
    BettyStat: [String]
    InputStat: [String]
    OutStat: [String]
    # EM
    battery: String,
    voltage: [String],
    current: [String],
    factor: [String],
    # io
    di:[String]
    do:[String]
  }
 # 操作指令
 type OprateInstruct{
    name:String
    value:String
    bl:String
    tag: String
    readme:String
  }
  # 协议告警状态
  type AlarmStat{
    name: String
    value: String
    unit: String
    alarmStat:[String]
  }
  # 每个协议的设备常量和阀值，显示参数
  type DevConstant{
    Protocol: String
    ProtocolType: String
    Constant:Constant
    Threshold:JSON
    AlarmStat: [AlarmStat]
    ShowTag:[String]
    OprateInstruct:[OprateInstruct]
  }
  # 用户自定义配置
  type UserSetup{
    user:String
    tels:[String]
    mails:[String]
    ProtocolSetup:[DevConstant]
  }
  # 日志
  type LogTerminal{
    NodeIP: String
    NodeName: String
    TerminalMac: String
    type: String
    msg: String
    query: JSON
    result: JSON
    createdAt:Date
  }

  # 、、
  type LayoutBind{
        mac: String
        pid: Int
        name: String
      }

  # 聚合设备布局配置
  type Layout{
      x: Float
      y: Float
      id: String
      name: String
      color: String
      bind: LayoutBind
  }
  # 用户聚合设备
  type UserLayout{
    user: String
    type: String
    id: String
    bg: String
    Layout: [Layout]
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
    TerminalOnline(DevMac: String): Terminal
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
    BindDevices:JSON #[BindDevice]
    #获取用户组
    userGroup: String
    #获取透传设备数据
    UartTerminalData(DevMac: String, pid: Int): UartTerminalData
    UartTerminalDatas(
      DevMac: String
      name:String
      pid: Int
      datatime: String
    ): [UartTerminalData],
    # 获取协议常量
    getDevConstant(Protocol:String):DevConstant
    # 获取设备在线状态
    getDevState(mac:String,node:String):Boolean
    # 获取用户自定义配置
    getUserSetup:UserSetup
    getUserSetups:[UserSetup]
    # 获取用户协议常量
    getUserDevConstant(Protocol:String):DevConstant
    # 获取用户设备日志
    getLogTerminal:[LogTerminal]
    # 获取用户tel
    getUserTel:String
    # 获取socket node状态
    getSocketNode:JSON
    # 获取socket user状态
    getUserNode:JSON
    # 获取节点日志
    lognodes(start:Date,end:Date):JSON
    # 获取终端日志
    logterminals(start:Date,end:Date):JSON
    # 获取短信日志
    logsmssends(start:Date,end:Date):JSON
    # 获取邮件日志
    logmailsends(start:Date,end:Date):JSON
    # 获取设备告警日志
    loguartterminaldatatransfinites(start:Date,end:Date):JSON
    # 获取终端日志
    loguserlogins(start:Date,end:Date):JSON
    # 获取终端日志
    loguserrequsts(start:Date,end:Date):JSON
    # 获取定时清理日志
    logdataclean(start:Date,end:Date):JSON
    # 获取设备使用流量
    logterminaluseBtyes(mac:String):JSON
    # 获取dtu繁忙状态记录
    logDtuBusy(mac:String,start:Date,end:Date):JSON
    # 获取dtu发送指令记录
    logInstructQuery(mac:String):JSON
    # 获取在线节点指令缓存
    getNodeInstructQuery:JSON
    # 获取聚合设备
    Aggregation(id:String):JSON
    Aggregations:JSON
    # 获取后台运行状态
    runingState:JSON
    # 用户获取终端上下线数据
    # 获取终端日志
    userlogterminals(start:Date,end:Date,mac:String):[LogTerminal]
    # 检查挂载设备是否在超时列表
    checkDevTimeOut(mac:String,pid:String):String
    # 获取设备设备别名
    getAlias(mac:String,pid:String,protocol:String):JSON
    # 获取用户布局配置
    getUserLayout(id:String):UserLayout
    # 获取iot设备远程调试地址
    iotRemoteUrl(mac:String):String
    # 数据池
    ClientResults(start:Date,end:Date):JSON
    ClientResult(start:Date,end:Date):JSON
    ClientResultSingle:JSON
  }

  #mutation
  type Mutation {
    #admin
    # 配置Node
    setNode(arg: String): result
    deleteNode(IP: String): result
    # 配置协议
    setProtocol(arg: JSON): result
    TestScriptStart(arg: JSON): result
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
    # 修改终端
    modifyTerminal(DevMac:String,arg: JSON): result
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
    # 修改用户信息
    modifyUserInfo(arg: JSON):result
    # 获取验证码重置用户密码
    resetUserPasswd(user:String):result
    # 校验用户验证码
    resetValidationCode(user:String,code:String):result
    # 重置用户密码
    setUserPasswd(hash:String,passwd:String):result
    # addUserTerminal
    addUserTerminal(type: String, id: String): result
    delUserTerminal(type: String, id: String): result
    #添加设备协议常量配置
    addDevConstent(Protocol: String, ProtocolType: String,type:String arg: JSON): result
    # 自定义发送设备操作指令
    SendProcotolInstruct(arg:JSON,value:[Int]):result
    #
    Send_DTU_AT_InstructSet(DevMac:String,content:String):result
    # 固定发送设备操作指令
    SendProcotolInstructSet(query:JSON,item:JSON):result
    # 设置用户自定义设置(联系方式)
    setUserSetupContact(tels:[String],mails:[String]):result
    # 设置用户自定义设置(协议配置)
    setUserSetupProtocol(Protocol: String, ProtocolType: String,type:String arg: JSON):result
    # 发送校验码短信
    sendValidationSms:result
    # 校验验证码,校验通过缓存授权
    ValidationCode(code:String):result
    #添加聚合设备
    addAggregation(name:String,aggs:JSON):result
    deleteAggregation(id:String):result
    # 重置挂在设备超时状态
    refreshDevTimeOut(mac:String,pid:String):result
    # 确认用户告警
    confrimAlarm(id:String):result
    # 发送用户socket信息
    sendSocketInfo(user:String,msg:String):result
    #删除用户配置
    deleteUsersetup(user:String):result
    # 设备设备别名
    setAlias(mac:String,pid:String,protocol:String,name:String,alias:String):result
    #删除用户
    deleteUser(user:String,hash:String):result
    # 设置用户聚合设备
    setUserLayout(id:String,type:String,bg:String,Layout:JSON):result
  }

  # Subscription
  type Subscription {
    postAdded: String
  }
`;

export default typeDefs