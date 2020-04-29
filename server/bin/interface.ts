import { ParameterizedContext } from "koa";
import { Event } from "../event/index"
import NodeSocketIO from "server/socket/uart";
/* protocol */
export type communicationType = 232 | 485;
export type protocolType = "ups" | "air" | "em" | "th";
export type characterType = "utf8" | "hex" | "float" | "short" | "int";
// apollo server result
export interface ApolloMongoResult {
  msg: string
  ok: number
  n: number
  nModified: number
  upserted: any
}
// koa ctx
export interface KoaCtx extends ParameterizedContext {
  $Event: Event
  $SocketUart: NodeSocketIO
}

// apollo ctx
export interface ApolloCtx extends UserInfo {
  loggedIn: boolean
  $Event: Event
  $SocketUart: NodeSocketIO
}

// 协议指令解析格式化
export interface protocolInstructFormrize {
  name: string;
  enName?: string;
  regx: string | null;
  bl: number;
  unit: string | null;
  isState: boolean;
}
// 协议指令
export interface protocolInstruct {
  name: string; // 指令名称--GQS
  resultType: characterType;
  shift: boolean;
  shiftNum: number;
  pop: boolean;
  popNum: number;
  resize: string;
  formResize: protocolInstructFormrize[];
}
// 协议
export interface protocol {
  Type: communicationType;
  Protocol: string;
  ProtocolType: protocolType;
  instruct: protocolInstruct[];
}
// 设备类型
export interface DevsType {
  Type: string;
  DevModel: string;
  Protocols: {
    Type: communicationType;
    Protocol: string;
  }[];
}
// 登记注册终端
export interface RegisterTerminal {
  DevMac: string;
  mountNode: string;
}
// 终端挂载设备
export interface TerminalMountDevs {
  Type: number
  mountDev: string;
  protocol: string;
  pid: number;
}
// 终端
export interface Terminal extends RegisterTerminal {
  name: string;
  ip?: string
  prto?: number
  jw?: string;
  uptime?: string
  mountDevs: TerminalMountDevs[];
}
// Node节点
export interface NodeClient {
  Name: string;
  IP: string;
  Port: number;
  MaxConnections: number;
}
// 用户绑定设备
export interface BindDevice {
  user: string
  ECs: string[]
  UTs: (string | Terminal)[]
}

// Node节点硬件top
export interface SocketRegisterInfo {
  hostname: string;
  totalmem: string;
  freemem: string;
  loadavg: number[];
  type: string;
  uptime: string;
  userInfo: {
    uid: number,
    gid: number,
    username: string,
    homedir: string,
    shell: string
  }
}
// 对节点发出的协议查询指令
export interface queryObject {
  mac: string;
  type: number;
  protocol: string;
  pid: number;
  timeStamp: number;
  content: string | string[];
}
// 协议查询结果解析存储结构
export interface queryResultArgument {
  name: string;
  value: any;
  unit: string | null;
  issimulate?: boolean
}
//协议查询结果
export interface queryResult extends queryObject {
  contents: IntructQueryResult[]
  parse?: { [x: string]: number | string }
  result?: queryResultArgument[];
  time?: string;
}
export interface IntructQueryResult {
  content: string
  buffer: {
    data: number[];
    type: string;
  };
}
//
export interface timelog {
  content: string,
  num: number
}

// UartData数据
export interface uartData extends NodeClient {
  data: queryResult[]
}

// 透传 api 数据 
export interface socketNetInfo {
  ip: string;
  port: number;
  mac: string;
  jw: string;
}
// 节点websocket透传信息
export interface WebSocketInfo {
  NodeName: string;
  Connections: number | Error;
  SocketMaps: socketNetInfo[];
}
// 节点上传信息
export interface nodeInfo {
  hostname: string;
  totalmem: string;
  freemem: string;
  loadavg: number[];
  networkInterfaces: any;
  type: string;
  uptime: string;
  userInfo: any;
}

/* 用户信息 */
export interface UserInfo {
  name?: string;
  user?: string;
  userGroup?: string;
  passwd?: string;
  mail?: string;
  company?: string;
  tel?: number;
  creatTime?: Date;
  modifyTime?: Date;
  address?: string;
  status?: boolean;
}

export interface KoaSocketOpts {
  namespace?: string | null;
  hidden?: boolean;
  ioOptions?: SocketIO.ServerOptions;
}

// 设备协议参数-常量
// 空调
export interface DevConstant_Air {
  //热通道温度
  HeatChannelTemperature: any;
  HeatChannelHumidity: any;
  //冷通道湿度
  ColdChannelTemperature: any;
  ColdChannelHumidity: any;
  //制冷温度
  RefrigerationTemperature: any;
  RefrigerationHumidity: any;
  // 风速
  Speed: any;
  //制热模式
  HeatModel: any;
  ColdModel: any;
  //除湿
  Dehumidification: any;
  // 加湿
  Humidification: any;
}
// EM
export interface DevConstant_EM { }
export interface DevConstant_Ups {
  UPSModels: string
  BatteryTemperature: string
  ResidualCapacity: string
  BatteryVoltage: string
  OutputFrequency: string
  OutputLoad: string
}
export interface DevConstant_TH {
  Temperature: string;
  Humidity: string;
}
export interface DevConstant extends DevConstant_Air, DevConstant_EM, DevConstant_TH, DevConstant_Ups { }
// 协议参数阀值
export interface Threshold {
  name: string
  min: number
  max: number
}
// 协议操作指令
export interface OprateInstruct{
  name:string
  value:string
  readme:string
}
// 协议参数-常量参数阀值
export interface ProtocolConstantThreshold {
  Protocol: string,
  ProtocolType: string,
  Constant: DevConstant
  Threshold: Threshold[]
  ShowTag: string[]
  OprateInstruct:OprateInstruct[]
}
// 协议解析结果集
export interface queryResultSave {
  mac: string
  pid: number
  timeStamp: number
  result: queryResultArgument[]
  parse: { [x: string]: queryResultArgument }
}
export type ConstantThresholdType = "Threshold" | "Constant" | "ShowTag"|"Oprate"
// 操作指令查询对象
export interface instructQueryArg extends queryResultArgument {
  DevMac: string
  pid: number,
  mountDev: string
  protocol: string
}
// 操作指令请求对象
export interface instructQuery {
  DevMac: string
  pid: number
  type: number
  events: string
  content: string
  result?: Buffer
}