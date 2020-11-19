/* eslint-disable no-console */
/* 
数据执行器部分，更新协议，设备类型，终端，节点的缓存数据，发送终端查询指令指令
*/
import { DeviceProtocol, DevsType } from "../mongoose/DeviceAndProtocol";
import { Terminal } from "../mongoose/Terminal";
import { NodeClient } from "../mongoose/node";
import { DevConstant } from "../mongoose/DeviceParameterConstant";
import { UserBindDevice, UserAlarmSetup, Users } from "../mongoose/user";
import { Event as event } from "./index";
import { Uart } from "typing";

export interface sendQuery {
  IP: string;
  Name?: string;
  socket: SocketIO.Socket;
}

export default class Cache {
  // 协议缓存protocol=>
  CacheProtocol: Map<string, Uart.protocol>;
  // 设备类型缓存devmodal=>
  CacheDevsType: Map<string, Uart.DevsType>;
  // 透传终端缓存mac=>terminal
  CacheTerminal: Map<string, Uart.Terminal>;
  // Node节点=》终端缓存
  // CacheNodeTerminal: Map<string, Map<string, Uart.Terminal>>;
  // Node节点缓存ip=>nodeclient
  CacheNode: Map<string, Uart.NodeClient>;
  // Node节点缓存name=>nodeclient
  CacheNodeName: Map<string, Uart.NodeClient>;
  // 缓存每个节点的查询定时器缓存 ip,timeInterl
  //CacheQueryNode: Map<string, NodeJS.Timeout>;
  // 缓存每个节点在线的设备ip->terminal
  // CacheNodeTerminalOnline: Set<string>
  // 缓存节点查询终端设备超时的指令
  // CacheTerminalQueryIntructTimeout: Map<string, Set<string>>
  // 缓存协议的常量设置,protocol=>Constant
  CacheConstant: Map<string, Uart.ProtocolConstantThreshold>
  // 缓存用户绑定
  CacheBind: Map<string, Uart.BindDevice>
  // 缓存绑定透传设备mac=>user
  CacheBindUart: Map<string, string>
  // 缓存绑定透传设备mac=>user
  CacheBindEt: Map<string, string>

  // 缓存用户 user=》user
  CacheUser: Map<string, Uart.UserInfo>
  // 缓存用户配置 user=>setup
  CacheUserSetup: Map<string, Uart.userSetup>
  // 用户uart挂载终端缓存
  // QueryTerminal: Map<NodeName, Map<TerminalPid, TerminalMountDevsEX>>
  // 设备的查询时间,mac+pid=>[1,2,3,8,4,...]
  QueryTerminaluseTime: Map<string, number[]>
  // 每个手机号发送告警的次数tel=>number
  CacheAlarmSendNum: Map<string, number>
  // DTU下挂载的设备指令超时, mac[instruct,num]
  // TimeOutMonutDevINstruct: Map<string, Map<string, number>>
  // DTU下挂载的设备指令超时Set
  // TimeOutMonutDevINstructSet: Set<string>
  // 缓存协议指令转换关系 010300010009abcd => 0300010009
  CacheInstructContents: Map<string, string>
  private Events: event;
  // CacheSocket: any;
  constructor(Events: event) {
    this.Events = Events
    // 缓存
    this.CacheProtocol = new Map();
    this.CacheDevsType = new Map();
    this.CacheTerminal = new Map();
    // this.CacheNodeTerminal = new Map();
    this.CacheNode = new Map();
    this.CacheNodeName = new Map()
    // this.CacheQueryNode = new Map()
    // this.CacheNodeTerminalOnline = new Set()
    this.CacheConstant = new Map()
    // this.CacheTerminalQueryIntructTimeout = new Map()
    this.CacheBind = new Map()
    this.CacheBindUart = new Map()
    this.CacheBindEt = new Map()
    this.CacheUser = new Map()
    this.CacheUserSetup = new Map()
    // this.QueryTerminal = new Map()
    this.QueryTerminaluseTime = new Map()
    this.CacheAlarmSendNum = new Map()

    // this.TimeOutMonutDevINstruct = new Map()
    // this.TimeOutMonutDevINstructSet = new Set()
    // 对应解析指令0103000000013a4a => 0300000001
    this.CacheInstructContents = new Map()
  }
  //
  async start(): Promise<void> {
    await this.resetTerminalStat()
    await this.RefreshCacheDevType();
    await this.RefreshCacheProtocol();
    await this.RefreshCacheNode();
    await this.RefreshCacheTerminal();
    await this.RefreshCacheConstant();
    await this.RefreshCacheBind();
    await this.RefreshCacheUserSetup()
    await this.RefreshCacheUser()
  }

  // 重置terminal终端设备在线状态
  private async resetTerminalStat() {
    await Terminal.updateMany({}, { $set: { onlien: false } })
  }

  // 
  async RefreshCacheProtocol(protocol?: string) {
    const res: Uart.protocol[] = await DeviceProtocol.find(protocol ? { Protocol: protocol } : {}).lean()
    console.log(`更新协议缓存......`);
    res.map(el => {
      el.instruct = el.instruct.filter(el1 => el1.isUse)
      return el
    }).forEach(el => {
      this.CacheProtocol.set(el.Protocol, el)
      this.Events.emit("updateProtocol", el.Protocol)
    })
    if (res.length === 0 && protocol) {
      this.CacheProtocol.delete(protocol)
    }
    this.Events.ResetUartSocketQueryIntruct()
  }
  //
  async RefreshCacheDevType(DevModel?: string) {
    const res: Uart.DevsType[] = await DevsType.find(DevModel ? { DevModel } : {}).lean()
    console.log(`更新设备型号缓存......`);
    res.forEach(el => {
      this.CacheDevsType.set(el.DevModel, el)
    })
  }
  //
  async RefreshCacheNode() {
    const res: Uart.NodeClient[] = await NodeClient.find().lean()
    console.log(`更新节点缓存......`);
    this.CacheNode = new Map(res.map(el => [el.IP, el]))
    this.CacheNodeName = new Map(res.map(el => [el.Name, el]))
    // this.CacheNodeTerminal = new Map(res.map(el => [el.Name, new Map()]))
  }
  //
  async RefreshCacheTerminal(DevMac?: string) {
    const res: Uart.Terminal[] = await Terminal.find(DevMac ? { DevMac } : {}).lean()
    // console.log(`更新4g终端缓存......`)
    res.forEach(el => {
      if (!el.mountDevs) el.mountDevs = []
      this.CacheTerminal.set(el.DevMac, el)
      this.Events.emit("updateTerminal", el.DevMac)
      // this.CacheNodeTerminal.get(el.mountNode)?.set(el.DevMac, el)
      el.mountDevs.forEach(el2 => {
        this.QueryTerminaluseTime.set(el.DevMac + el2.pid, [])
      })
    })
    if (res.length == 0 && DevMac) {
      this.CacheTerminal.delete(DevMac)
    }
    // 如果有Mac参数,更新超时指令查询
    if (DevMac) {
      // 触发终端更新事件
      this.Events.UpdateTerminal(DevMac)
    }
  }
  //
  async RefreshCacheConstant(protocol?: string) {
    const res = await DevConstant.find(protocol ? { Protocol: protocol } : {}).lean<Uart.ProtocolConstantThreshold>()
    console.log(`更新协议常量缓存......`);
    res.forEach(el => {
      this.CacheConstant.set(el.Protocol, el)
      this.Events.emit("updateSysSetup", el.Protocol)
    })
    if (res.length === 0 && protocol) {
      this.CacheConstant.delete(protocol)
    }
  }
  //
  async RefreshCacheBind(user?: string) {
    const res = await UserBindDevice.find(user ? { user } : {}).lean<Uart.BindDevice>()
    console.log(`更新绑定设备缓存......`);
    res.forEach(el => {
      this.CacheBind.set(el.user, el)
      el?.UTs.forEach(els => {
        this.CacheBindUart.set(els as string, el.user)
      })
    })
  }
  //
  async RefreshCacheUser(user?: string) {
    console.log(`更新用户信息缓存......`);
    const users = await Users.find(user ? { user } : {}).lean<Uart.UserInfo>()
    users.forEach(u => {
      this.CacheUser.set(u.user, u)
    })
  }
  //
  async RefreshCacheUserSetup(user?: string) {
    const res = await UserAlarmSetup.find(user ? { user } : {}).lean<Uart.userSetup>()
    console.log(`更新用户个性化配置......`);
    res.forEach(el => {
      // 如果用户没有自定义告警阀值,生成空map   
      el.ProtocolSetupMap = new Map()
      el.ThresholdMap = new Map()
      el.AlarmStateMap = new Map()
      el.ShowTagMap = new Map()
      //
      if (el.ProtocolSetup) {
        el.ProtocolSetup.forEach(els => {
          el.ProtocolSetupMap.set(els.Protocol, els)
          el.ShowTagMap.set(els.Protocol, els.ShowTag ? new Set(els.ShowTag) : new Set())
          el.ThresholdMap.set(els.Protocol, els.Threshold ? new Map(els.Threshold.map(ela => [ela.name, ela])) : new Map())
          el.AlarmStateMap.set(els.Protocol, els.AlarmStat ? new Map(els.AlarmStat.map(ela => [ela.name, ela])) : new Map())
          this.Events.emit("updateUserSetup", el.user, els.Protocol)
        })
      }
      this.CacheUserSetup.set(el.user, el)
    })

  }
}
