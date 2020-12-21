import EventEmitter from "events";
import Cache from "./UartCache";
import ClientCache from "./ClientCache"
import { DefaultContext } from "koa";
import { Server } from "http";
import { LogUartTerminalDataTransfinite, LogTerminals, LogUserRequst, LogNodes, LogUserLogins } from "../mongoose/Log";
import NodeSocketIO from "../socket/uart";
import webClientSocketIO from "../socket/webClient";
import Wxws from "../socket/wx";
import wxUtil from "../util/wxUtil";
import { Uart } from "typing";
import { Terminal } from "../mongoose";
import { getDtuInfo, getUserBindDev, parseTime } from "../util/util";
// Cron
import * as Cron from "../cron/index";
import ProtocolPares from "./bin/ProtocolPares";
import { SmsDTU, SmsDTUDevTimeOut } from "../util/SMS";
import Tool from "../util/tool";
import { Send } from "../util/Mail";
import Check from "./bin/CheckUart";
import { JwtVerify } from "../util/Secret";

type eventsName = 'terminal' | 'node' | 'login' | 'request' | 'DataTransfinite'
type RemoveNonFunctionProps<T> = { [K in keyof T]: T[K] extends Function ? K : never }[keyof T]
type CacheFuns = RemoveNonFunctionProps<Cache>
type CacheMap = keyof Omit<Cache, CacheFuns>

type ElementOf<T> = T extends Array<infer P> ? P : never

interface timeOut {
  mac: string,
  pid: string | number,
  devName: string,
  event: '超时' | '恢复'
}

interface On2Off {
  mac: string,
  event: '恢复上线' | '离线'
}

export class Event extends EventEmitter.EventEmitter {
  Cache: Cache;
  ClientCache: ClientCache
  uartSocket!: NodeSocketIO
  clientSocket!: webClientSocketIO
  wxSocket!: Wxws
  private timeOut: number;
  Parse: ProtocolPares;
  Check: Check;
  constructor() {
    super();
    this.timeOut = 60000 * 5
    // Node节点,透传协议，设备...缓存
    this.Cache = new Cache(this);
    // 协议解析methons
    this.Parse = new ProtocolPares(this)
    // 
    this.Check = new Check(this)
    // web客户端socket缓存
    this.ClientCache = new ClientCache()
    // start Query,加载数据缓存
    this.Cache.start()
    this.setMaxListeners(29)
      .on("error", console.error);
    //
    wxUtil.get_AccessToken()
    Cron.start()
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
              // 判断设备是否在线，不在线则不重置查询间隔
              const isOnline = this.getClientDtuMountDev(terEX.TerminalMac, terEX.pid).online
              if (isOnline) {
                // 获取设备查询设备查询使用时间
                const maxTime = this.Parse.getQueryuseTime(terEX.TerminalMac, terEX.pid)
                // 获取设备间隔值
                const interval = this.getMountDevInterval(terEX.TerminalMac)
                // 如果查询最大值大于5秒,查询间隔调整为最近60次查询耗时中的最大值步进500ms
                terEX.Interval = maxTime < interval ? interval : (maxTime + 1000) - (maxTime % 500)
                this.Parse.clearQueryuseTime(terEX.TerminalMac, terEX.pid)
              }
              if (terEX.Interval === 0) {
                console.log(terEX);
                terEX.Interval = 1000
              }
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
            this.sendDevTimeOut2On({ mac, event: '离线' })
            DTUOfflineTime.delete(mac)
          }
        })

        DTUOnlineTime.forEach(async (time, mac) => {
          if (date - time.getTime() > this.timeOut) {
            this.sendDevTimeOut2On({ mac, event: '恢复上线' })
            DTUOnlineTime.delete(mac)
          }
        })
      }

      // 校正左右设备状态设备
      {
        this.Cache.CacheTerminal.forEach(terminal => {
          if (!terminal.online && terminal.mountDevs) {
            terminal.mountDevs.forEach(el => {
              this.setClientDtuMountDevOnline(terminal.DevMac, el.pid, false)
            })
          }
        })
      }
      // 清理所有qr缓存
      {
        // 迭代每个键，判断键的创建时间，超过规定时间删除键，避免缓存过大
        const now = Date.now()
        this.ClientCache.CacheQR.forEach(async (Qr, key) => {
          const { timeStamp } = await JwtVerify(key).catch(() => false)
          if (!timeStamp || now - timeStamp > this.timeOut) {
            this.ClientCache.CacheQR.delete(key)
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

  /* // 获取Cache入口
  public GetCacheMap<T extends CacheMap>(tag: string, cacheName: T, key: Parameters<Cache[T]['get']>[0]): ReturnType<Cache[T]['get']> {
    console.log(`GetCacheMap ;; tag:${tag}`);
    return this.Cache[cacheName].get(key) as any
  }

  // 获取Cache入口
  public DelCacheMap<T extends CacheMap>(tag: string, cacheName: T, key: Parameters<Cache[T]['get']>[0]) {
    console.log(`DelCacheMap ;; tag:${tag}`);
    return this.Cache[cacheName].delete(key)
  }

  // 获取Cache入口
  public GetCacheMaps<T extends CacheMap>(tag: string, cacheName: T): ReturnType<Cache[T]['values']> {
    console.log(`GetCacheMaps ;; tag:${tag}`);
    return this.Cache[cacheName].values() as any
  }
  // 
  public GetCacheFun<T extends CacheFuns>(tag: string, fun: T, c?: ElementOf<Parameters<Cache[T]>>): ReturnType<Cache[T]> {
    console.log(`GetCacheFun ;; tag:${tag}`);
    return this.Cache[fun](c) as any
  } */
  // 获取用户绑定设备
  public getUserBindDev(user: string) {
    //this.GetCacheFun('ss', 'RefreshCacheProtocol')
    return getUserBindDev(user)
  }


  // 发送设备操作指令查询
  DTU_OprateInstruct(Query: Uart.instructQuery) {
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
    const MountDevLens = new Map(terminal.mountDevs.map(el => {
      // 如果设备在线则统计所有指令条数，不在线则记为1
      const instructLen = el.online ? this.Cache.CacheProtocol.get(el.protocol)!.instruct.length : 0
      return [el.pid, instructLen]
    }))
    // 基数
    const baseNum = terminal.ICCID ? 1000 : 500
    // 指令合计数量
    const LensCount = [...MountDevLens.values()].reduce((pre, cu) => pre + cu)
    /* // 此PID设备协议指令数量
    const PidProtocolInstructNum = MountDevLens.get(Pid)!
    // 
    return (PidProtocolInstructNum * baseNum) + ((LensCount * baseNum) * (PidProtocolInstructNum / LensCount)) */
    return (LensCount || 1) * baseNum
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
      if (online && !terminal.online) this.ChangeTerminalStat(mac, true)
      const mountDev = this.getClientDtuMountDev(mac, pid)
      // console.log({ mac, pid, online, mountDev });
      if (mountDev.online !== online) {
        mountDev.online = online
        Terminal.updateOne({ DevMac: mac, "MountDevs.pid": pid }, { $set: { "MountDevs.$.online": online } }).then(_el => {
          if (online) {
            this.emit("timeOutRestore", mac, pid)
          }
        })
      }
    }
  }

  // 发送设备超时，恢复，上线，下线信息
  sendDevTimeOut2On(arg: timeOut | On2Off) {
    switch (arg.event) {
      case "恢复":
      case "超时":
        SmsDTUDevTimeOut(arg.mac, arg.pid, arg.devName, arg.event)
        this.sendMailAlarm(arg.mac, arg.pid, arg.event)
        break;

      case "恢复上线":
      case "离线":
        SmsDTU(arg.mac, arg.event)
        this.sendMailAlarm(arg.mac, null, arg.event)
        break
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

  // 发送邮件
  private sendMailAlarm(mac: string, pid: number | string | null, event: string) {
    const info = getDtuInfo(mac)
    const mails = (info.userInfo?.mails || []).filter(mail => Tool.RegexMail(mail))
    if (mails.length > 0) {
      const mountDev = pid ? '挂载的 ' + this.getClientDtuMountDev(mac, pid).mountDev : ''

      const body = `<p><strong>尊敬的${info.user.name}</strong></p>
      <hr />
      <p><strong>您的DTU <em>${info.terminalInfo.name}</em> ${mountDev} 告警</strong></p>
      <p><strong>告警时间:&nbsp; </strong>${parseTime(Date.now())}</p>
      <p><strong>告警事件:</strong>&nbsp; ${event}</p>
      <p>您可登录 <a title="透传服务平台" href="https://uart.ladishb.com" target="_blank" rel="noopener">LADS透传服务平台</a> 查看处理(右键选择在新标签页中打开)</p>
      <hr />
      <p>&nbsp;</p>
      <p>扫码使用微信小程序查看</p>
      <p><img src="https://uart.ladishb.com/_nuxt/img/LADS_Uart.0851912.png" alt="weapp" width="430" height="430" /></p>
      <p>&nbsp;</p>`
      return Send(mails.join(","), "Ladis透传平台", "设备告警", body)
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
