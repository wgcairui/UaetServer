import EventEmitter from "events";
import config from "../config";
import Query from "../bin/Query";
import { DefaultContext } from "koa";
import { Socket } from "socket.io";
export interface socketData {
  IP: string;
  socket: Socket;
  data: any;
}
export class Event extends EventEmitter.EventEmitter {
  env: {
    addNodeClient: string;
    disNodeClient: string;
    connectNodeClient: string;
  };
  Query: Query;
  // ip,timeInterl
  QueryNode: Map<string, NodeJS.Timeout>;
  constructor() {
    super();
    // 事件常量
    this.env = {
      addNodeClient: "addNodeClient",
      disNodeClient: "disNodeClient",
      connectNodeClient: "connectNodeClient"
    };
    // 
    this.Query = new Query();
    this.QueryNode = new Map();
    //
    this.start();
  }
  // start Query,加载数据缓存
  // 开始监听事件
  // 触发addNodeClient
  async start() {
    // 等待缓存加载
    await this.Query.start();
    // 挂载监听
    this.on(this.env.connectNodeClient, this._connectNodeClient)
      .on(this.env.disNodeClient, this._disNodeClient)
  }
  // 挂载监听到koa ctx
  attach(app: DefaultContext) {
    app.context.$Event = this;
  }
  // socket监听有新的Node节点连接启动完成触发
  _connectNodeClient(data: socketData) {
    const { IP, socket } = data    
    // 创建查询指令定时器,缓存定时器
    this.QueryNode.set(
      IP,
      setInterval(() => {
        this.Query.SendQuery(IP, socket);
      }, config.runArg.Query.Inteltime)
    );
  }
  // 监听节点断开事件
  _disNodeClient({ IP }: socketData) {
    // 清除查询指令定时器
    clearInterval(<NodeJS.Timeout>this.QueryNode.get(IP));
    //清除缓存
    this.QueryNode.delete(IP);
  }
}

export default new Event();
