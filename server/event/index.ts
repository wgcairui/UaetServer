import EventEmitter from "events";
import Cache from "./UartCache";
import ClientCache from "./ClientCache"
import { DefaultContext } from "koa";
import { Socket } from "socket.io";
export interface socketData {
  IP: string;
  socket: Socket;
  data: any;
}
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
}

export default new Event();
