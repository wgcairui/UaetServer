const EventEmitter = require("events");
const config = require("../config");
const { NodeClient } = require("../mongoose/node");
class Event extends EventEmitter {
  constructor() {
    super();
    // 事件常量
    this.env = {
      addNodeClient: "addNodeClient",
      disNodeClient: "disNodeClient",
      connectNodeClient: "connectNodeClient"
    };
    // 节点IP->socketID
    this.nodeIPSocketIDMaps = new Map();
    // 节点登记信息
    this.nodeRegisterInfo = new Map();
    // 主查询hash
    this.QueryNode = new Map();
    this.start();
  }
  start() {
    // 挂载监听
    // 初始化数据填充
    this.on(this.env.addNodeClient, this.addNodeClient)
      .on(this.env.connectNodeClient, this._connectNodeClient)
      .on(this.env.disNodeClient, this._disNodeClient)
      .emit(this.env.addNodeClient);
  }
  _connectNodeClient({ IP, socket }) {
    this.nodeIPSocketIDMaps.set(IP, socket.id);
    socket.emit("registerSuccess", this.nodeRegisterInfo.get(IP));
    this.QueryNode.set(IP, function() {
      setInterval(() => {}, config.runArg.Query);
    });
  }
  _disNodeClient({ IP }) {
    this.nodeIPSocketIDMaps.delete(IP);
    this.QueryNode.delete(IP);
  }
  attach(app) {
    app.context.Event = this;
  }
  async addNodeClient(ip) {
    const node = await NodeClient.find();
    if (this.nodeIPSocketIDMaps.size === 0) {
      node.forEach((el) => {
        this.nodeIPSocketIDMaps.set(el.IP, null);
        this.nodeRegisterInfo.set(el.IP, el);
      });
      return;
    }
    node
      .filter((el) => el.IP === ip)
      .forEach((el) => {
        this.nodeIPSocketIDMaps.set(el.IP, null);
        this.nodeRegisterInfo.set(el.IP, el);
      });
  }
}

module.exports = new Event();
