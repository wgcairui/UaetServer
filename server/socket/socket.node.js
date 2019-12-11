/* eslint-disable no-console */
const socket = require("koa-socket-2");

class Socket extends socket {
  onRegister() {
    switch (this.opts.namespace) {
      case "Node":
        console.log(this.opts);

        break;
      case "User":
        break;
    }
  }
}

module.exports = Socket;
