import { ParameterizedContext } from "koa";
import { Event } from "../event/index"
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
}

// apollo ctx
export interface ApolloCtx extends UserInfo {
  loggedIn: boolean
  $Event: Event
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
  Jw: string;
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
  totalmem: number;
  freemem: number;
  loadavg: number[];
  type: string;
  uptime: number;
}
// 对节点发出的协议查询指令
export interface queryObject {
  mac: string;
  type: number;
  protocol: string;
  pid: number;
  timeStamp: number;
  content: string;
}
// 协议查询结果解析存储结构
export interface queryResultArgument {
  name: string;
  value: any;
  unit: string | null;
}
//协议查询结果
export interface queryResult extends queryObject {
  buffer: {
    data: number[];
    type: string;
  };
  stat: string;
  result?: queryResultArgument[];
  time?: string;
}

// 透传 api 数据 
export interface socketNetInfo {
  ip: string;
  port: number;
  mac: string;
  jw: string;
}
// 节点websocket透传信息
export interface allSocketInfo {
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
export interface DevConstant_Ups { }
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
// 协议参数-常量参数阀值
export interface ProtocolConstantThreshold {
  Protocol: string,
  ProtocolType: string,
  Constant: DevConstant
  Threshold: Threshold[]
  ShowTag: string[]
}

export type ConstantThresholdType = "Threshold" | "Constant" | "ShowTag"

