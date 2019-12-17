/* eslint-disable no-console */
const IO = require("koa-socket-2");
const Event = require("../event/index");

class Socket extends IO {
  // 挂载
  attach(app) {
    super.attach(app);
    this.start();
  }

  start() {
    this.on("register", this._onRegister) // 节点注册效验
      .on("Alarm", this._Alarm) // 节点报警
      .on("disconnect", this._delDisconnect); // 节点离线
  }

  _onRegister({ socket, data }) {
    const IP = socket.conn.remoteAddress;
    if (!Event.nodeIPSocketIDMaps.has(IP))
      console.log(`有未登记节点连接，节点注册信息：${{ data, IP }}`);
    else {
      //
      const Info = Event.nodeRegisterInfo.get(IP);
      Event.emit(Event.env.connectNodeClient, { IP, socket });

      const { hostname, totalmem, freemem, loadavg, type, uptime } = data;

      console.log(`节点注册：${Info.Name}==${IP}，注册时间:${new Date()}`);
      console.log(`id<${socket.id}>已连接,\n节点名称：<${hostname}>`);
      console.log(`内存总量：<${parseInt(totalmem / 1024 / 1024 / 1024)}GB>`);
      console.log(`已使用:<${parseInt(freemem / (totalmem / 100))}%>`);
      console.log(`平均负载(/1/5/15min)：<${loadavg.join("/")}>`);
      console.log(`已运行时间:<${parseInt(uptime / 60 / 60)}h>`);
      console.log(`系统类型:<${type}>`);
    }
  }

  _Alarm({ socket, data }) {
    const IP = socket.conn.remoteAddress;
    console.log(data);
    console.log(IP);
  }

  _delDisconnect({ socket }) {
    const IP = socket.conn.remoteAddress;
    Event.emit(Event.env.disNodeClient, { IP, socket });
  }
}

module.exports = Socket;
