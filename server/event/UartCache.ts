/* eslint-disable no-console */
/* 
数据执行器部分，加载协议，设备类型，终端，节点的缓存数据，发送终端查询指令指令
*/
import { DeviceProtocol, DevsType } from "../mongoose/DeviceAndProtocol";
import { Terminal } from "../mongoose/Terminal";
import { NodeClient } from "../mongoose/node";

import {
  protocol,
  DevsType as devsType,
  Terminal as terminal,
  NodeClient as nodeClient,
  ProtocolConstantThreshold,
  BindDevice
} from "../bin/interface";
import { Socket } from "socket.io";
import { DevConstant } from "../mongoose/DeviceParameterConstant";
import { UserBindDevice } from "../mongoose/user";

export interface sendQuery {
  IP: string;
  Name?: string;
  socket: SocketIO.Socket;
}
export default class Cache {
  // 协议缓存
  CacheProtocol: Map<string, protocol>;
  // 设备类型缓存
  CacheDevsType: Map<string, devsType>;
  // 透传终端缓存
  CacheTerminal: Map<string, terminal>;
  // Node节点=》终端缓存 
  CacheNodeTerminal: Map<string, Map<string, terminal>>;
  // Node节点缓存ip=>nodeclient
  CacheNode: Map<string, nodeClient>;
  // Node节点缓存name=>nodeclient
  CacheNodeName: Map<string, nodeClient>;
  // 缓存所有Socket连接,IP=>socket
  CacheSocket: Map<string, Socket>
  // 缓存每个节点的查询定时器缓存 ip,timeInterl
  //CacheQueryNode: Map<string, NodeJS.Timeout>;
  // 缓存每个节点在线的设备
  CacheNodeTerminalOnline: Map<string, Set<string>>
  // 缓存节点查询终端设备超时的指令
  CacheTerminalQueryIntructTimeout: Map<string, Set<string>>
  // 缓存协议的常量设置,protocol=>Constant
  CacheConstant: Map<string, ProtocolConstantThreshold>
  // 缓存绑定透传设备mac=>user
  CacheBindUart: Map<string, string>
  // 缓存绑定透传设备mac=>user
  CacheBindEt: Map<string, string>
  // 缓存告警参数次数 tag=>number
  CacheAlarmNum: Map<string, number>
  constructor() {
    // 缓存
    this.CacheProtocol = new Map();
    this.CacheDevsType = new Map();
    this.CacheTerminal = new Map();
    this.CacheNodeTerminal = new Map();
    this.CacheNode = new Map();
    this.CacheNodeName = new Map()
    this.CacheSocket = new Map()
    //this.CacheQueryNode = new Map()
    this.CacheNodeTerminalOnline = new Map()
    this.CacheConstant = new Map()
    this.CacheTerminalQueryIntructTimeout = new Map()
    this.CacheBindUart = new Map()
    this.CacheBindEt = new Map()
    this.CacheAlarmNum = new Map()
  }
  //
  async start(): Promise<void> {
    await this.RefreshCacheDevType();
    await this.RefreshCacheProtocol();
    await this.RefreshCacheNode();
    await this.RefreshCacheTerminal();
    await this.RefreshCacheConstant();
    await this.RefreshCacheBind()
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
    this.CacheNodeName = new Map(res.map(el => [el.Name, el]))
    this.CacheNodeTerminal = new Map(res.map(el => [el.Name, new Map()]))
    this.CacheNodeTerminalOnline = new Map(res.map(el => [el.IP, new Set()]))
  }
  //
  async RefreshCacheTerminal(DevMac?: string) {
    const res: terminal[] = await Terminal.find().lean()
    console.log(`加载4g终端缓存......`)
    res.forEach(el => {
      this.CacheTerminal.set(el.DevMac, el)
      this.CacheNodeTerminal.get(el.mountNode)?.set(el.DevMac, el)
    })
    // 如果有Mac参数,更新超时指令查询
    if (DevMac) {
      const Terminal = this.CacheTerminal.get(DevMac) as terminal
      if (this.CacheTerminalQueryIntructTimeout.has(Terminal.mountNode)) {
        const CacheTerminalQueryIntructTimeout = this.CacheTerminalQueryIntructTimeout.get(Terminal.mountNode)
        CacheTerminalQueryIntructTimeout?.forEach(el => {
          const Reg = new RegExp(`^${DevMac}`)
          if (Reg.test(el)) CacheTerminalQueryIntructTimeout.delete(el)
        })
      }
    }
  }
  //
  async RefreshCacheConstant() {
    const res = await DevConstant.find().lean<ProtocolConstantThreshold>()
    console.log(`加载协议常量缓存......`);
    this.CacheConstant = new Map(res.map(el => [el.Protocol, el]))
  }
  //
  async RefreshCacheBind() {
    const res = await UserBindDevice.find().lean<BindDevice>()
    console.log(`加载绑定设备缓存......`);
    res.forEach(el => {
      el?.UTs.forEach(els => {
        this.CacheBindUart.set(els as string, el.user)
      })
    })
  }
}
