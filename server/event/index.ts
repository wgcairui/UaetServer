import EventEmitter from "events";
import config from "../config";
import Query from "../bin/Query";
import { NodeClient } from "../mongoose/node";
import { DefaultContext } from "koa";
import { Socket } from "socket.io";
import { NodeClient as nodeClient } from "../bin/interface";
class Event extends EventEmitter {
  env: {
    addNodeClient: string;
    disNodeClient: string;
    connectNodeClient: string;
  };
  Query: Query;
  nodeIPSocketIDMaps: Map<string, string>;
  nodeRegisterInfo: Map<string, nodeClient>;
  QueryNode: Map<any, any>;
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
    // 节点IP->socketID
    this.nodeIPSocketIDMaps = new Map();
    // 节点登记信息
    this.nodeRegisterInfo = new Map();
    // 主查询hash
    this.QueryNode = new Map();
    this.start();
  }

  async start() {
    //
    await this.Query.start();
    // 挂载监听
    // 初始化数据填充
    this.on(this.env.addNodeClient, this.addNodeClient)
      .on(this.env.connectNodeClient, this._connectNodeClient)
      .on(this.env.disNodeClient, this._disNodeClient)
      .emit(this.env.addNodeClient);
  }
  attach(app: DefaultContext) {
    app.context.$Event = this;
  }
  _connectNodeClient({
    IP,
    socket,
    data
  }: {
    IP: string;
    socket: Socket;
    data: any;
  }) {
    this.nodeIPSocketIDMaps.set(IP, socket.id);
    const registerInfo = this.nodeRegisterInfo.get(IP);

    socket.emit("registerSuccess", registerInfo);
    this.QueryNode.set(
      IP,
      setInterval(() => {
        this.Query.SendQuery({ IP, socket });
      }, config.runArg.Query.Inteltime)
    );
  }
  _disNodeClient({ IP }: { IP: string }) {
    // this.nodeIPSocketIDMaps.set(IP,null);
    clearInterval(this.QueryNode.get(IP));
    // this.QueryNode.delete(IP);
  }

  async addNodeClient(ip: string) {
    const node: nodeClient[] = await NodeClient.find().lean();
    if (this.nodeIPSocketIDMaps.size === 0) {
      node.forEach((el) => {
        this.nodeIPSocketIDMaps.set(el.IP, "");
        this.nodeRegisterInfo.set(el.IP, el);
      });
      return;
    }
    node
      .filter((el) => el.IP === ip)
      .forEach((el) => {
        this.nodeIPSocketIDMaps.set(el.IP, "");
        this.nodeRegisterInfo.set(el.IP, el);
      });
  }
}

export default new Event();
