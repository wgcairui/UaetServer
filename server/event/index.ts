import EventEmitter from "events";
import Cache from "./UartCache";
import ClientCache from "./ClientCache"
import { DefaultContext } from "koa";
import { Server } from "http";
import { LogUartTerminalDataTransfinite, LogTerminals, LogUserRequst, LogNodes, LogUserLogins } from "../mongoose/Log";
import { TerminalMountDevsEX, TerminalMountDevs, queryResult, uartAlarmObject, logLogins, logNodes, logTerminals, logUserRequst, ApolloMongoResult, instructQuery, DTUoprate } from "uart";
import config from "../config";
import { SmsDTUDevTimeOut, SmsDTU } from "../util/SMS";
import NodeSocketIO from "../socket/uart";
import webClientSocketIO from "../socket/webClient";
import Wxws from "../socket/wx";
import wxUtil from "../util/wxUtil";

type eventsName = 'terminal' | 'node' | 'login' | 'request' | 'DataTransfinite'

export class Event extends EventEmitter.EventEmitter {
  Cache: Cache;
  ClientCache: ClientCache
  uartSocket?: NodeSocketIO
  clientSocket?: webClientSocketIO
  wxSocket?: Wxws
  constructor() {
    super();
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
              if (this.Cache.TimeOutMonutDev.has(hash)) return
              const useTimeArray = this.Cache.QueryTerminaluseTime.get(hash) as number[]
              const len = useTimeArray.length
              const yxuseTimeArray = len > 60 ? useTimeArray.slice(len - 60, len) : useTimeArray
              const maxTime = Math.max(...yxuseTimeArray) || 4000
              // 如果查询最大值大于5秒,查询间隔调整为最近60次查询耗时中的最大值步进500ms
              /* if (maxTime < config.runArg.Query.Interval) 
              else {
                // const round = Math.round(maxTime / 1000) * 1000
                // terEX.Interval = round - maxTime > 500 ? round + 500 : round
                // 最大数加500 - 最大值%500的余数
                terEX.Interval = (maxTime + 500) - (maxTime % 500)

              } */
              terEX.Interval = maxTime < config.runArg.Query.Interval ? config.runArg.Query.Interval : (maxTime + 500) - (maxTime % 500)
            })
          })
          // console.log(`${new Date().toLocaleString()}## 更新Query查询缓存间隔时间`);
          // 清空查询计数数组
          this.Cache.QueryTerminaluseTime.forEach(el => el = [])
        }
      }
      // 迭代所有掉线设备记录，如果掉线时长超过10min，触发短信告警
      {
        const DTUOfflineTime = this.Cache.DTUOfflineTime
        const date = Date.now() // 当前时间
        DTUOfflineTime.forEach(async (time, mac) => {
          if (date - time.getTime() > 60000 * 5) {
            await SmsDTU(mac, '离线')
            DTUOfflineTime.delete(mac)
          }
        })
        // console.log(`${new Date().toLocaleString()}## 更新DTU离线超时时间,离线设备数${DTUOfflineTime.size}`);
      }
      {
        const DTUOnlineTime = this.Cache.DTUOnlineTime
        const date = Date.now() // 当前时间
        DTUOnlineTime.forEach(async (time, mac) => {
          if (date - time.getTime() > 60000 * 5) {
            await SmsDTU(mac, '恢复上线')
            DTUOnlineTime.delete(mac)
          }
        })
        // console.log(`${new Date().toLocaleString()}## 更新DTU恢复上线时间,在线设备数${DTUOnlineTime.size}`);
      }
    }, 60000 * 5)
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

  // 发送设备操作指令查询
  DTU_OprateInstruct(Query: instructQuery) {
    if (this.uartSocket) {
      return this.uartSocket.InstructQuery(Query)
    } else {
      return new Promise<Partial<ApolloMongoResult>>(resolve => {
        resolve({ ok: 0, msg: '节点Socket服务器未运行' })
      })
    }
  }

  // 发送设备DTU AT查询指令
  DTU_ATInstruct(Query: DTUoprate) {
    if (this.uartSocket) {
      return this.uartSocket.OprateDTU(Query)
    } else {
      return new Promise<Partial<ApolloMongoResult>>(resolve => {
        resolve({ ok: 0, msg: '节点Socket服务器未运行' })
      })
    }
  }

  // 单位缓存
  GetUnit(unit: string) {
    const Cache = this.Cache.CacheParseUnit
    const unitCache = Cache.get(unit)
    if (unitCache) return unitCache
    else {
      const arr = unit
        .replace(/(\{|\}| )/g, "")
        .split(",")
        .map(el => el.split(":"))
        .map(el => ({ [el[0]]: el[1] }));
      Cache.set(unit, Object.assign({}, ...arr))
      return Cache.get(unit) as { [x in string]: string }
    }
  }

  // 更新设备查询日志
  UpdateTerminal(mac: string) {
    const terminal = this.Cache.CacheTerminal.get(mac)
    if (terminal) {
      console.log(`socket:更新Cache=${terminal.DevMac}终端缓存`);
      // 获取设备绑定节点的map
      const nodeTerminals = this.uartSocket?.CacheSocket.get(terminal.mountNode)
      if (nodeTerminals) {
        terminal.mountDevs.forEach(mountDev => {
          const mount = Object.assign<Partial<TerminalMountDevsEX>, TerminalMountDevs>
            ({ TerminalMac: terminal.DevMac, Interval: config.runArg.Query.Interval }, mountDev) as Required<TerminalMountDevsEX>
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
        mountDev.Interval = config.runArg.Query.Interval
      }
    }
  }

  // 重置协议指令处理缓存
  ResetUartSocketQueryIntruct() {
    if (this.uartSocket) {
      this.uartSocket.CacheQueryIntruct.clear()
    }
  }

  // 解析设备请求结果,检查设备是否是超时设备,是的话取消超时,发送短信提醒 send ProtocolPares
  QuerySuccess(Query: queryResult) {
    const hash = Query.mac + Query.pid
    if (this.Cache.TimeOutMonutDev.has(hash)) {
      this.Cache.TimeOutMonutDev.delete(hash)
      // 如果短信发送记录为true,发送超时恢复短信提醒
      if (this.Cache.TimeOutMonutDevSmsSend.get(hash)) {
        console.log({ Query, mas: 'terminal恢复' });
        SmsDTUDevTimeOut(Query, '恢复')
        this.Cache.TimeOutMonutDevSmsSend.set(hash, false)
      }
    }
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
  savelog<T extends uartAlarmObject | logLogins | logNodes | logTerminals | logUserRequst>(event: eventsName, body: T) {
    switch (event) {
      case 'DataTransfinite':
        this.SendUserAlarm(<uartAlarmObject>body)
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
