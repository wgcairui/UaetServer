import EventEmitter from "events";
import Cache from "./UartCache";
import ClientCache from "./ClientCache"
import { DefaultContext } from "koa";
import { Socket } from "socket.io";
import { LogUartTerminalDataTransfinite } from "../mongoose/Log";
export interface socketData {
  IP: string;
  socket: Socket;
  data: any;
}
export type eventsName = 'UartTerminalOnline' | 'UartTerminalOff' | 'UartTerminalDataTransfinite' | 'UartTerminalDataTransfiniteReset'
export class Event extends EventEmitter.EventEmitter {
  Cache: Cache;
  ClientCache: ClientCache
  constructor() {
    super();
    // Node节点,透传协议，设备...缓存
    this.Cache = new Cache();
    // web客户端socket缓存
    this.ClientCache = new ClientCache()
    // start Query,加载数据缓存
    this.Cache.start()
    this.listen()
    this.writelog()

  }
  // 挂载监听到koa ctx
  attach(app: DefaultContext) {
    app.context.$Event = this;
  }

  // 监听事件
  private listen() {
    this.setMaxListeners(29)
      .on("event", () => { })
      .on("error", console.error)
  }
  // 创建自定义触发事件
  Emit(event: eventsName, ...args: any[]) {
    super.emit(event, args)
  }
  // 创建自定义触发事件
  On(event: eventsName, listener: (...args: any[]) => void) {
    return super.on(event, listener)
  }
  // 监听事件,记录为日志
  writelog() {
    // 设备参数超限
    this.On("UartTerminalDataTransfinite", ([data]) => {
      new LogUartTerminalDataTransfinite(data).save()
    })
      // 设备上下线
      .On("UartTerminalOff", data => {

      })
      .On("UartTerminalOnline", data => {

      })
  }
}

export default new Event();
