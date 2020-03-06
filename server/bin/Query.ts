/* eslint-disable no-console */
/* 
数据执行器部分，加载协议，设备类型，终端，节点的缓存数据，发送终端查询指令指令
*/
import { DeviceProtocol, DevsType } from "../mongoose/DeviceAndProtocol";
import { Terminal } from "../mongoose/Terminal";
import { NodeClient } from "../mongoose/node";
import tool from "./tool";
import {
  protocol,
  DevsType as devsType,
  Terminal as terminal,
  NodeClient as nodeClient,
  queryObject
} from "../bin/interface";

export interface sendQuery {
  IP: string;
  Name?: string;
  socket: SocketIO.Socket;
}
export default class Query {
  // 协议缓存
  CacheProtocol: Map<string, protocol>;
  // 设备类型缓存
  CacheDevsType: Map<string, devsType>;
  // 透传终端缓存
  CacheTerminal: Map<string, terminal>;
  // Node节点=》终端缓存 
  CacheNodeTerminal: Map<string, Map<string, terminal>>;
  // Node节点缓存
  CacheNode: Map<string, nodeClient>;

  constructor() {
    // 缓存
    this.CacheProtocol = new Map();
    this.CacheDevsType = new Map();
    this.CacheTerminal = new Map();
    this.CacheNodeTerminal = new Map();
    this.CacheNode = new Map();
  }
  //
  async start(): Promise<void> {
    await this.RefreshCacheDevType();
    await this.RefreshCacheProtocol();
    await this.RefreshCacheTerminal();
    await this.RefreshCacheNode();
  }
  //
  async RefreshCacheProtocol() {
    const res: protocol[] = await DeviceProtocol.find().lean()
    console.log(`加载协议缓存......`);
    this.CacheProtocol = new Map(res.map(el => [el.Protocol, el]))
  }
  //
  async RefreshCacheDevType() {
    const res: devsType[] = await DevsType.find().lean()
    console.log(`加载设备型号缓存......`);
    this.CacheDevsType = new Map(res.map(el => [el.DevModel, el]))
  }
  //
  async RefreshCacheNode() {
    const res: nodeClient[] = await NodeClient.find().lean()
    console.log(`加载节点缓存......`);
    this.CacheNode = new Map(res.map(el => [el.IP, el]))
    this.CacheNodeTerminal = new Map(res.map(el => [el.Name, new Map()]))
  }
  //
  async RefreshCacheTerminal() {
    const res: terminal[] = await Terminal.find().lean()
    console.log(`加载4g终端缓存......`)
    console.log(this.CacheNodeTerminal);
    res.forEach(el => {
      this.CacheTerminal.set(el.DevMac, el)
      this.CacheNodeTerminal.get(el.mountNode)?.set(el.DevMac, el)
    })
    console.log(this.CacheNodeTerminal);

    /* .then((res: terminal[]) => {
      ;
      res.forEach((el) => {
        this.CacheTerminal.set(el.DevMac, el);
        if (this.CacheNodeTerminal.has(el.mountNode)) {
          let terminals = <terminal[]>this.CacheNodeTerminal.get(el.mountNode);
          terminals.push(el);
        } else this.CacheNodeTerminal.set(el.mountNode, [el]);
      });
    }); */
  }



  SendQuery(IP: string, socket: SocketIO.Socket) {
    // 获取节点名称
    const name = <string>this.CacheNode.get(IP)?.Name;
    // console.log(`检索 ${Name} 登记的设备，依次发生查询指令`);
    // 获取节点下所有的终端
    const clients = <Map<string, terminal>>this.CacheNodeTerminal.get(name);
    // 遍历所有终端
    clients.forEach((Terminal, key) => {
      // 遍历每个终端挂载设备
      Terminal.mountDevs.forEach(TerminalMountDevs => {
        // 每个设备一个时间戳,确保所有指令使用同一条
        const timeStamp = Date.now()
        // 获取设备协议
        const Protocol = <protocol>this.CacheProtocol.get(TerminalMountDevs.protocol)
        Protocol.instruct.forEach(ProtocolInstruct => {
          // 构建查询指令
          const content = tool.Crc16modbus(TerminalMountDevs.pid, ProtocolInstruct.name)
          // 构建查询对象
          const query: queryObject = {
            mac: Terminal.DevMac,
            type: TerminalMountDevs.Type,
            protocol: TerminalMountDevs.protocol,
            pid: TerminalMountDevs.pid,
            timeStamp,
            content
          }
          // 
          socket.emit("query", query);
        })
      })
    })
    /* for (const ({ DevMac, mountDevs }) of clients) {
      for (const { pid, protocol } of mountDevs) {
        const { Type, instruct } = <protocol>this.CacheProtocol.get(protocol);
        const 
        for (const { name } of instruct) {
          let query: queryObject = {
            mac: DevMac,
            type: Type as number,
            protocol,
            pid,
            timeStamp,
            content: tool.Crc16modbus(pid, name)
          }
          
        }
      } 
    } */
  }
}
