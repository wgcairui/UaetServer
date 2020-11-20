import EventEmitter from "events";
import Cache from "./UartCache";
import ClientCache from "./ClientCache"
import { DefaultContext } from "koa";
import { Server } from "http";
import { LogUartTerminalDataTransfinite, LogTerminals, LogUserRequst, LogNodes, LogUserLogins } from "../mongoose/Log";
import { SmsDTU } from "../util/SMS";
import NodeSocketIO from "../socket/uart";
import webClientSocketIO from "../socket/webClient";
import Wxws from "../socket/wx";
import wxUtil from "../util/wxUtil";
import { Uart } from "typing";
import { Terminal } from "../mongoose";

type eventsName = 'terminal' | 'node' | 'login' | 'request' | 'DataTransfinite'

type RemoveNonFunctionProps<T> = { [K in keyof T]: T[K] extends Function ? K : never }[keyof T]
type CacheFuns = RemoveNonFunctionProps<Cache>
type CacheMap = keyof Omit<Cache, CacheFuns>

export class Event extends EventEmitter.EventEmitter {
  Cache: Cache;
  ClientCache: ClientCache
  uartSocket!: NodeSocketIO
  clientSocket!: webClientSocketIO
  wxSocket!: Wxws
  private timeOut: number;
  constructor() {
    super();
    this.timeOut = 60000 * 5
    // Node节点,透传协议，设备...缓存
    this.Cache = new Cache(this);
    // web客户端socket缓存
    this.ClientCache = new ClientCache()
    // start Query,加载数据缓存
    this.Cache.start()
    this.setMaxListeners(29)
      .on("error", console.error);
    //
    wxUtil.get_AccessToken()

  }
  // 挂载监听到koa ctx
  attach(app: DefaultContext) {
    app.context.$Event = this;
    setInterval(() => {
      {
        if (this.uartSocket) {
          // 迭代查询缓存，检查每个挂载设备的指令耗时数组(往后60个采样)，采用其最大值+500ms,
          this.uartSocket.CacheSocket.forEach(node => {
            node.cache.forEach((terEX, hash) => {
              // if (this.Cache.TimeOutMonutDev.has(hash)) return
              const useTimeArray = this.Cache.QueryTerminaluseTime.get(hash) as number[]
              const len = useTimeArray.length
              const yxuseTimeArray = len > 60 ? useTimeArray.slice(len - 60, len) : useTimeArray
              const maxTime = Math.max(...yxuseTimeArray) || 4000
              // 获取设备间隔值
              const interval = this.getMountDevInterval(terEX.TerminalMac)
              // 如果查询最大值大于5秒,查询间隔调整为最近60次查询耗时中的最大值步进500ms
              terEX.Interval = maxTime < interval ? interval : (maxTime + 1000) - (maxTime % 500)
              this.Cache.QueryTerminaluseTime.set(hash, [])
            })
          })
        }
      }
      // 迭代所有掉线设备记录，如果掉线时长超过10min，触发短信告警
      {
        const { DTUOfflineTime, DTUOnlineTime } = this.uartSocket
        const date = Date.now() // 当前时间
        DTUOfflineTime.forEach(async (time, mac) => {
          if (date - time.getTime() > this.timeOut) {
            await SmsDTU(mac, '离线')
            DTUOfflineTime.delete(mac)
          }
        })

        DTUOnlineTime.forEach(async (time, mac) => {
          if (date - time.getTime() > this.timeOut) {
            await SmsDTU(mac, '恢复上线')
            DTUOnlineTime.delete(mac)
          }
        })
      }
    }, this.timeOut)
  }

  // 初始化socket监听
  CreateSocketServer(Http: Server) {
    // Node_Socket节点挂载
    this.uartSocket = new NodeSocketIO(Http, { path: "/Node" })
    console.info(`Socket Server(namespace:/Node) runing`)
    //WebClient_SocketServer挂载
    this.clientSocket = new webClientSocketIO(Http, { path: "/WebClient" })
    console.info(`Socket Server(namespace:/WebClient) runing`)
    // wxws服务端监听
    this.wxSocket = new Wxws(Http, "/wx")
    console.info(`WS Server(namespace:/wx) runing`)
  }

  // 获取Cache入口
  public GetCacheMaps(cacheName: CacheMap, key: string) {
    const Map = this.Cache[cacheName].get(key)
    return Map

  }

  // 
  public GetCacheFun(fun: CacheFuns, ...c: Parameters<Cache[CacheFuns]>) {

  }
  

  // 发送设备操作指令查询
  DTU_OprateInstruct(Query: Uart.instructQuery) {
    this.GetCacheFun("RefreshCacheTerminal",)
    const a = this.GetCacheMaps("CacheAlarmSendNum", 'a')
    if (this.uartSocket) {
      return this.uartSocket.InstructQuery(Query)
    } else {
      return new Promise<Partial<Uart.ApolloMongoResult>>(resolve => {
        resolve({ ok: 0, msg: '节点Socket服务器未运行' })
      })
    }
  }

  // 发送设备DTU AT查询指令
  DTU_ATInstruct(Query: Uart.DTUoprate) {
    if (this.uartSocket) {
      return this.uartSocket.OprateDTU(Query)
    } else {
      return new Promise<Partial<Uart.ApolloMongoResult>>(resolve => {
        resolve({ ok: 0, msg: '节点Socket服务器未运行' })
      })
    }
  }

  // 获取每个dtu下的设备预估耗时（查询间隔）时间
  // 计算方式为4G模块时间为设备指令条数*1000,其它为*500
  // 结果为基数x合计指令数量
  getMountDevInterval(mac: string) {
    const terminal = this.Cache.CacheTerminal.get(mac)!
    // 统计挂载的设备协议指令数量
    const MountDevLens = new Map(terminal.mountDevs.map(el => [el.pid, this.Cache.CacheProtocol.get(el.protocol)!.instruct.length]))
    // 基数
    const baseNum = terminal.ICCID ? 1000 : 500
    // 指令合计数量
    const LensCount = [...MountDevLens.values()].reduce((pre, cu) => pre + cu)
    /* // 此PID设备协议指令数量
    const PidProtocolInstructNum = MountDevLens.get(Pid)!
    // 
    return (PidProtocolInstructNum * baseNum) + ((LensCount * baseNum) * (PidProtocolInstructNum / LensCount)) */
    return LensCount * baseNum
  }

  // 更新terminal在线状态
  ChangeTerminalStat(macs: string | string[], online: boolean = true) {
    const { DTUOfflineTime, DTUOnlineTime } = this.uartSocket
    if (Array.isArray(macs)) {
      Terminal.updateMany({ DevMac: { $in: macs } }, { $set: { online } }).then(_el => {
        macs.forEach(mac => this.Cache.RefreshCacheTerminal(mac))
      })
      //macs.forEach(mac => this.Cache.CacheTerminal.get(mac)!.online = online)
      if (online) {
        macs.forEach(mac => DTUOfflineTime.delete(mac))
      } else {
        macs.forEach(mac => {
          DTUOfflineTime.set(mac, new Date())
          DTUOnlineTime.delete(mac)
        })
      }
    } else {
      Terminal.updateOne({ DevMac: macs }, { $set: { online } }).then(_el => {
        this.Cache.RefreshCacheTerminal(macs)
      })
      // this.Cache.CacheTerminal.get(macs)!.online = online
      if (online) {
        DTUOfflineTime.delete(macs)
      } else {
        DTUOfflineTime.set(macs, new Date())
        DTUOnlineTime.delete(macs)
      }
    }
  }

  // 更新设备查询日志
  UpdateTerminal(mac: string) {
    const terminal = this.Cache.CacheTerminal.get(mac)
    if (terminal) {
      // console.log(`socket:更新Cache=${terminal.DevMac}终端缓存`);
      // 获取设备绑定节点的map
      const nodeTerminals = this.uartSocket?.CacheSocket.get(terminal.mountNode)
      if (nodeTerminals) {
        terminal.mountDevs.forEach(mountDev => {
          const mount = Object.assign<Partial<Uart.TerminalMountDevsEX>, Uart.TerminalMountDevs>
            ({ TerminalMac: terminal.DevMac, Interval: this.getMountDevInterval(terminal.DevMac) }, mountDev) as Required<Uart.TerminalMountDevsEX>
          nodeTerminals.cache.set(terminal.DevMac + mountDev.pid, mount)
        })
        // 如果cache下面有同mac不同pid的话此种情况无法清理
        // 遍历所有DTU,当DTU存在与terminal相同的mac但不存在的pid时,清理此DTU
        const pidKeys = terminal.mountDevs.map(el => el.pid)
        nodeTerminals.cache.forEach((DTU, hash) => {
          if (DTU.TerminalMac === mac && !pidKeys.includes(DTU.pid)) nodeTerminals.cache.delete(hash)
        })
      }
    } else {
      // 如果缓存没有这个终端，遍历所有，删除匹配的缓存
      if (this.uartSocket) {
        this.uartSocket.CacheSocket.forEach(client => {
          client.cache.forEach((DTU, key) => {
            if (DTU.TerminalMac === mac) client.cache.delete(key)
          })
        })
      }
    }
  }

  // 重置设备超时查询
  ResetTimeOutMonutDev(mac: string, pid: number) {
    const terminal = this.Cache.CacheTerminal.get(mac)
    if (terminal && this.uartSocket) {
      const mountDev = this.uartSocket.CacheSocket.get(terminal.mountNode)?.cache.get(mac + pid)
      if (mountDev) {
        mountDev.Interval = this.getMountDevInterval(mac)
      }
    }
  }

  // 重置协议指令处理缓存
  ResetUartSocketQueryIntruct() {
    if (this.uartSocket) {
      this.uartSocket.CacheQueryIntruct.clear()
    }
  }

  // 设置透传节点下dtu对象下挂载节点上线
  setClientDtuMountDevOnline(mac: string, pid: string | number, online: boolean) {
    const terminal = this.Cache.CacheTerminal.get(mac)
    if (terminal) {
      Terminal.updateOne({ DevMac: mac, "MountDevs.pid": pid }, { $set: { "MountDevs.$.online": online } }).then(_el => {
        this.getClientDtuMountDev(mac, pid).online = online
        if (online) {
          this.emit("timeOutRestore", mac, pid)
        }
      })
    }
  }

  // 获取透传节点下client对象
  getClientDtuMountDev(mac: string, pid: string | number) {
    const terminal = this.Cache.CacheTerminal.get(mac)!
    return terminal.mountDevs.find(el => el.pid == pid)!
  }

  // 获取uart实例下client对象
  getUartClient(mac: string) {
    const terminal = this.Cache.CacheTerminal.get(mac)!
    return this.uartSocket.CacheSocket.get(terminal.mountNode)!
  }

  // 触发客户端告警提醒事件
  SendUserAlarm(alarm: { mac: string, msg: string }) {
    if (this.clientSocket) {
      this.clientSocket.SendUserAlarm(alarm)
    }
    if (this.wxSocket) {
      this.wxSocket.SendAlarm(alarm)
    }
  }

  // 触发客户端告警提醒事件
  SendUserSocketInfo(user: string, msg: string) {
    if (this.clientSocket) {
      this.clientSocket.SendUserInfo(user, msg)
    }
    if (this.wxSocket) {
      this.wxSocket.SendInfo(user, msg)
    }
  }

  // 保存日志
  savelog<T extends Uart.uartAlarmObject | Uart.logLogins | Uart.logNodes | Uart.logTerminals | Uart.logUserRequst>(event: eventsName, body: T) {
    switch (event) {
      case 'DataTransfinite':
        this.SendUserAlarm(<Uart.uartAlarmObject>body)
        new LogUartTerminalDataTransfinite(body).save()
        break
      case 'terminal':
        // this.SendUserAlarm({ mac: (<logTerminals>body).TerminalMac, msg: (<logTerminals>body).type })
        // const {} = <logNodes>body
        new LogTerminals(body).save()
        break
      case 'request':
        new LogUserRequst(body).save()
        break
      case "node":
        new LogNodes(body).save()
        break
      case "login":
        new LogUserLogins(body).save()
        break
    }
  }
}

export default new Event();
