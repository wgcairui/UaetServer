/* eslint-disable no-console */
import { DeviceProtocol, DevsType } from "../mongoose/DeviceAndProtocol";
import { Terminal } from "../mongoose/Terminal";
import { NodeClient } from "../mongoose/node";
import tool from "./tool";
import {
  protocol,
  DevsType as devsType,
  Terminal as terminal,
  NodeClient as nodeClient
} from "../bin/interface";

export default class Query {
  CacheProtocol: Map<string, protocol>;
  CacheDevsType: Map<string, devsType>;
  CacheTerminal: Map<string, terminal>;
  CacheNodeTerminal: Map<string, terminal[]>;
  CacheNode: Map<string, nodeClient>;
  constructor() {
    // 缓存
    this.CacheProtocol = new Map();
    this.CacheDevsType = new Map();
    this.CacheTerminal = new Map();
    this.CacheNodeTerminal = new Map();
    this.CacheNode = new Map();
  }
  async start(): Promise<void> {
    await this.RefreshCacheDevType();
    await this.RefreshCacheProtocol();
    await this.RefreshCacheTerminal();
    await this.RefreshCacheNode();
  }
  async RefreshCacheProtocol() {
    await DeviceProtocol.find().lean().then((res: protocol[]) => {
      console.log(`加载协议缓存......`);
      res.forEach((el) => this.CacheProtocol.set(el.Protocol, el));
    });
  }
  async RefreshCacheDevType() {
    await DevsType.find().lean().then((res: devsType[]) => {
      console.log(`加载设备型号缓存......`);
      res.forEach((el) => this.CacheDevsType.set(el.DevModel, el));
    });
  }
  async RefreshCacheTerminal() {
    await Terminal.find().lean().then((res: terminal[]) => {
      console.log(`加载4g终端缓存......`);
      res.forEach((el) => {
        this.CacheTerminal.set(el.DevMac, el);
        if (this.CacheNodeTerminal.has(el.mountNode)) {
          let terminals = <terminal[]>this.CacheNodeTerminal.get(el.mountNode);
          terminals.push(el);
        } else this.CacheNodeTerminal.set(el.mountNode, [el]);
      });
    });
  }
  async RefreshCacheNode() {
    await NodeClient.find().lean().then((res: nodeClient[]) => {
      console.log(`加载节点缓存......`);
      res.forEach((el) => this.CacheNode.set(el.IP, el));
    });
  }

  SendQuery({
    IP,
    Name,
    socket
  }: {
    IP: string;
    Name?: string;
    socket: SocketIO.Socket;
  }) {
    if (!IP || (!Name && !socket)) return false;
    Name = Name || (<nodeClient>this.CacheNode.get(IP)).Name;
    // console.log(`检索 ${Name} 登记的设备，依次发生查询指令`);

    const clients = <terminal[]>this.CacheNodeTerminal.get(Name);
    for (const { DevMac, mountDevs } of clients) {
      for (const { pid, protocol } of mountDevs) {
        const { Type, instruct } = <protocol>this.CacheProtocol.get(protocol);
        for (const { name } of instruct) {
          socket.emit("query", {
            mac: DevMac,
            type: Type,
            protocol,
            pid,
            content: tool.Crc16modbus(pid, name)
          });
        }
      }
    }
  }
}
