/* eslint-disable no-console */
import koa_socket_2 from "koa-socket-2";
import Event from "../event/index";
import { Socket } from "socket.io";
import { NodeClient, SocketRegisterInfo, KoaSocketOpts } from "../bin/interface";

export default class IO extends koa_socket_2 {
  constructor(arg: KoaSocketOpts) {
    super(arg);
  }
  // 挂载

  attach(app: any) {
    super.attach(app);
    this.start();
  }
  // 开始监听socket事件
  private start() {
    this.on("register", this._onRegister) // 节点注册效验
      .on("ready", this._ready)
      .on("startError", this._startError)
      .on("Alarm", this._Alarm) // 节点报警
      .on("disconnect", this._delDisconnect); // 节点离线
  }
  // Node节点注册事件
  private _onRegister({ socket, data }: { socket: Socket; data: SocketRegisterInfo }) {
    const IP = socket.conn.remoteAddress;
    if (!Event.Query.CacheNode.has(IP)) {
      console.log(`有未登记节点连接，节点注册信息`);
      console.log(IP);
    } else {
      // 根据节点IP获取节点登记信息，节点将根据登记运行程序
      const Info = <NodeClient>Event.Query.CacheNode.get(IP);
      // 主监听触发节点连接事件
      // 获取Node节点登记信息
      const registerInfo = Event.Query.CacheNode.get(IP);
      // 发送节点注册信息
      socket.emit("registerSuccess", registerInfo);
      // 
      const { hostname, totalmem, freemem, loadavg, type, uptime } = data;
      console.log(data);
      console.log(`节点注册：${Info.Name}==${IP}`);
      console.log(`注册时间:${new Date()}`);
      console.log(`id<${socket.id}>已连接,\n节点名称：<${hostname}>`);
      console.log(`内存总量：<${totalmem}>`);
      console.log(`已使用:<${freemem}>`);
      console.log(`平均负载(/1/5/15min)：<${loadavg}>`);
      console.log(`已运行时间:<${uptime}>`);
      console.log(`系统类型:<${type}>`);
    }
  }
  // 节点注册成功
  private _ready({ socket }: { socket: Socket }) {
    const IP = socket.conn.remoteAddress;
    Event.emit(Event.env.connectNodeClient, { IP, socket });
  }
  // 节点启动失败
  private _startError(error: any) { console.log(error) }
  // 触发报警事件
  private _Alarm({ socket, data }: { socket: Socket; data: any }) {
    const IP = socket.conn.remoteAddress;
    console.log(data);
    console.log(IP);
  }
  // 触发节点断开事件
  private _delDisconnect({ socket }: { socket: Socket }) {
    const IP = socket.conn.remoteAddress;
    console.log(`节点：${Event.Query.CacheNode.get(IP)?.Name}断开连接，清除定时操作`);
    Event.emit(Event.env.disNodeClient, { IP, socket });
  }
}
