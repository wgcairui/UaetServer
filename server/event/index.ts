import EventEmitter from "events";
import Cache from "./UartCache";
import { DefaultContext } from "koa";
import { Socket } from "socket.io";
export interface socketData {
  IP: string;
  socket: Socket;
  data: any;
}
export class Event extends EventEmitter.EventEmitter {
  Cache: Cache;
  constructor() {
    super();
    this.Cache = new Cache();
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
    this.on("event", () => { })
  }
}

export default new Event();
