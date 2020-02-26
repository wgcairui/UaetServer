import { Socket } from "net";
import { EventEmitter } from "events";

/* protocol */
type communicationType = 232 | 485;
type protocolType = "ups" | "air" | "em" | "th";
type characterType = "utf8" | "hex" | "float" | "short" | "int";

export interface protocolInstructFormrize {
  name: string;
  enName?: string;
  regx: string | null;
  bl: number;
  unit: string | null;
  isState: boolean;
}
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

export interface protocol {
  Type: communicationType;
  Protocol: string;
  ProtocolType: protocolType;
  instruct: protocolInstruct[];
}
/* DevsType */
export interface DevsType {
  Type: string;
  DevModel: string;
  Protocols: {
    Type: communicationType;
    Protocol: string;
  }[];
}
export interface TerminalMountDevs {
  mountDev: string;
  protocol: string;
  pid: number;
}
/* Terminal */
export interface Terminal {
  DevMac: string;
  name: string;
  Jw: string;
  mountNode: string;
  mountDevs: TerminalMountDevs[];
}
/* NodeClient */
export interface NodeClient {
  Name: string;
  IP: string;
  Port: number;
  MaxConnections: number;
}

export interface SocketRegisterInfo {
  hostname: string;
  totalmem: number;
  freemem: number;
  loadavg: number[];
  type: string;
  uptime: number;
}
/* query */
export interface queryObject {
  mac: string;
  type: number;
  protocol: string,
  pid: number,
  timeStamp: number
  content: string
}
/* result-Argement */
export interface queryResultArgument {
  name: string;
  value: any;
  unit: string | null;
}
/* result */
export interface queryResult extends queryObject {
  buffer: {
    data: number[];
    type: string;
  };
  stat: string;
  result?: queryResultArgument[];
  time?: string;
}

/*透传 api 数据 */
export interface socketNetInfo {
  ip: string;
  port: number;
  mac: string;
  jw: string;
}

export interface allSocketInfo {
  NodeName: string;
  Connections: number | Error;
  SocketMaps: socketNetInfo[];
}

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
