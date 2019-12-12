/* eslint-disable no-console */
const socket = require("koa-socket-2");
const $store = require("../store");

class Socket extends socket {
  attach(app) {
    super.attach(app);
    this.start();
  }
  start() {
    this.on("register", this._onRegister).on("disconnect", this._delDisconnect);
  }
  _onRegister({ socket, data }) {
    const { hostname, totalmem, freemem, loadavg, type, uptime } = data;
    console.log(
      `id<${socket.id}>已连接,\n节点名称：<${hostname}>,\n内存总量：<${parseInt(
        totalmem / 1024 / 1024 / 1024
      )}GB>,\n已使用:<${parseInt(
        freemem / (totalmem / 100)
      )}%>,\n平均负载(/1/5/15min)：<${loadavg.join(
        "/"
      )}>,\n系统类型:<${type}>,\n已运行时间:<${parseInt(uptime / 60 / 60)}h>\n,`
    );
    socket.emit("registerSuccess");
    // save socket
    $store.nodeSocketIDMaps.set(hostname, socket.id);
    socket.on("UartData", (data) => {
      console.log(data);
    });
    socket.on("RunData", () => {});
  }
  _delDisconnect({ socket }) {
    for (const [key, val] of $store.nodeSocketIDMaps) {
      if (val === socket.id) {
        $store.nodeSocketIDMaps.delete(key);
        continue;
      }
    }
  }
}

module.exports = Socket;
