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
  BindDevice,
  userSetup,
  TerminalMountDevsEX
} from "uart";
import { Socket } from "socket.io";
import { DevConstant } from "../mongoose/DeviceParameterConstant";
import { UserBindDevice, UserAlarmSetup } from "../mongoose/user";
import { Event as event } from "./index";

export interface sendQuery {
  IP: string;
  Name?: string;
  socket: SocketIO.Socket;
}

type NodeName = string
type TerminalPid = string

export default class Cache {
  // 协议缓存protocol=>
  CacheProtocol: Map<string, protocol>;
  // 设备类型缓存devmodal=>
  CacheDevsType: Map<string, devsType>;
  // 透传终端缓存mac=>terminal
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
  // 缓存每个节点在线的设备ip->terminal
  CacheNodeTerminalOnline: Set<string>
  // 缓存节点查询终端设备超时的指令
  CacheTerminalQueryIntructTimeout: Map<string, Set<string>>
  // 缓存协议的常量设置,protocol=>Constant
  CacheConstant: Map<string, ProtocolConstantThreshold>
  // 缓存用户绑定
  CacheBind: Map<string, BindDevice>
  // 缓存绑定透传设备mac=>user
  CacheBindUart: Map<string, string>
  // 缓存绑定透传设备mac=>user
  CacheBindEt: Map<string, string>
  // 缓存告警参数次数 tag=>number
  CacheAlarmNum: Map<string, number>
  // 缓存用户配置 user=>setup
  CacheUserSetup: Map<string, userSetup>
  // 用户uart挂载终端缓存
  QueryTerminal: Map<NodeName, Map<TerminalPid, TerminalMountDevsEX>>
  // 设备的查询时间,mac+pid=>[1,2,3,8,4,...]
  QueryTerminaluseTime: Map<string, number[]>
  // 序列化参数单位解析
  CacheParseUnit: Map<string, { [x in number]: string }>
  // 序列化参数regx解析
  CacheParseRegx: Map<string,[number,number]>
  // 每个手机号发送告警的次数
  CacheAlarmSendNum: Map<string, number>
  // 设备超时列表
  TimeOutMonutDev: Set<string>
  // DTU设备下线时间
  DTUOfflineTime:Map<string,Date>
  // DTU下挂载的设备指令超时, mac[instruct,num]
  TimeOutMonutDevINstruct:Map<string,Map<string,number>>
  // DTU下挂载的设备指令超时Set
  TimeOutMonutDevINstructSet:Set<string>
  private Events: event;
  constructor(Events: event) {
    this.Events = Events
    // 缓存
    this.CacheProtocol = new Map();
    this.CacheDevsType = new Map();
    this.CacheTerminal = new Map();
    this.CacheNodeTerminal = new Map();
    this.CacheNode = new Map();
    this.CacheNodeName = new Map()
    this.CacheSocket = new Map()
    //this.CacheQueryNode = new Map()
    this.CacheNodeTerminalOnline = new Set()
    this.CacheConstant = new Map()
    this.CacheTerminalQueryIntructTimeout = new Map()
    this.CacheBind = new Map()
    this.CacheBindUart = new Map()
    this.CacheBindEt = new Map()
    this.CacheAlarmNum = new Map()
    this.CacheUserSetup = new Map()
    this.QueryTerminal = new Map()
    this.QueryTerminaluseTime = new Map()
    this.TimeOutMonutDev = new Set()
    this.CacheParseUnit = new Map()
    this.CacheParseRegx = new Map()
    this.CacheAlarmSendNum = new Map()
    this.DTUOfflineTime = new Map()
    this.TimeOutMonutDevINstruct = new Map()
    this.TimeOutMonutDevINstructSet = new Set()
  }
  //
  async start(): Promise<void> {
    await this.RefreshCacheDevType();
    await this.RefreshCacheProtocol();
    await this.RefreshCacheNode();
    await this.RefreshCacheTerminal();
    await this.RefreshCacheConstant();
    await this.RefreshCacheBind();
    await this.RefreshCacheUserSetup()
  }

  // 
  async RefreshCacheProtocol() {
    const res: protocol[] = await DeviceProtocol.find().lean()
    console.log(`加载协议缓存......`);
    const res1 = res.map(el=>{
      el.instruct = el.instruct.filter(el1=>el1.isUse)
      return el
    })
    this.CacheProtocol = new Map(res1.map(el => [el.Protocol, el]))
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
  }
  //
  async RefreshCacheTerminal(DevMac?: string) {
    // 如果有Mac参数,更新超时指令查询
    if (DevMac) {
      const terminal = await Terminal.findOne({ DevMac }).lean<terminal>() as terminal
      // 更新terminalCache
      if (!terminal.mountDevs) terminal.mountDevs = []
      this.CacheTerminal.set(terminal.DevMac, terminal)
      this.CacheNodeTerminal.get(terminal.mountNode)?.set(terminal.DevMac, terminal)
      // 如果超时指令包含devmac,删除
      if (this.CacheTerminalQueryIntructTimeout.has(terminal.mountNode)) {
        const CacheTerminalQueryIntructTimeout = this.CacheTerminalQueryIntructTimeout.get(terminal.mountNode)
        CacheTerminalQueryIntructTimeout?.forEach(el => {
          const Reg = new RegExp(`^${DevMac}`)
          if (Reg.test(el)) CacheTerminalQueryIntructTimeout.delete(el)
        })
      }
      // 触发终端更新事件
      this.Events.Emit("UpdateTerminal", this.CacheTerminal.get(terminal.DevMac) as terminal)
      //
      terminal.mountDevs.forEach(el => {
        this.QueryTerminaluseTime.set(terminal.DevMac + el.pid, [])
      })

    } else {
      const res: terminal[] = await Terminal.find().lean()
      console.log(`加载4g终端缓存......`)
      res.forEach(el => {
        if (!el.mountDevs) el.mountDevs = []
        this.CacheTerminal.set(el.DevMac, el)
        this.CacheNodeTerminal.get(el.mountNode)?.set(el.DevMac, el)
        el.mountDevs.forEach(el2 => {
          this.QueryTerminaluseTime.set(el.DevMac + el2.pid, [])
        })
      })
    }
  }
  //
  async RefreshCacheConstant() {
    const res = await DevConstant.find().lean<ProtocolConstantThreshold>()
    console.log(`加载协议常量缓存......`);
    this.CacheConstant = new Map(res.map(el => [el.Protocol, el]))
  }
  //
  async RefreshCacheBind(user?:string) {
    const res = await UserBindDevice.find(user?{user}:{}).lean<BindDevice>()
    console.log(`加载绑定设备缓存......`);
    res.forEach(el => {
      this.CacheBind.set(el.user, el)
      el?.UTs.forEach(els => {
        this.CacheBindUart.set(els as string, el.user)
      })
    })
  }
  //
  async RefreshCacheUserSetup() {
    const res = await UserAlarmSetup.find().lean<userSetup>()
    console.log(`加载用户个性化配置......`);
    this.CacheUserSetup = new Map(res.map(el => {
      // 如果用户没有自定义告警阀值,生成空map   
      el.ProtocolSetupMap = new Map()
      el.ThresholdMap = new Map()
      el.AlarmStateMap = new Map()
      //
      el.ProtocolSetup.forEach(els=>{
        el.ProtocolSetupMap.set(els.Protocol,els)
        el.ThresholdMap.set(els.Protocol,els.Threshold?new Map(els.Threshold.map(ela => [ela.name, ela])):new Map())
        el.AlarmStateMap.set(els.Protocol,els.AlarmStat?new Map(els.AlarmStat.map(ela=>[ela.name,ela])):new Map())
      })        
      
      return [el.user, el]
    }))
  }
}
