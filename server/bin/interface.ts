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
export interface TerminalMountDevs{
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
/* result */
export interface queryResult {
  buffer: {
    data: number[];
    type: string;
  };
  protocol: string;
  content: string;
  type: number;
  stat: string;
  pid: number;
  result: {
    name: string;
    value: number;
    unit: string|null;
  }[];
  mac: string;
  time?: string;
}

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
