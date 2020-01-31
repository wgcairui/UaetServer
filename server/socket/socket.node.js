"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable no-console */
const koa_socket_2_1 = __importDefault(require("koa-socket-2"));
const index_1 = __importDefault(require("../event/index"));
class socket extends koa_socket_2_1.default {
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
        if (!index_1.default.nodeIPSocketIDMaps.has(IP)) {
            console.log(`有未登记节点连接，节点注册信息`);
            console.log(IP);
        }
        else {
            //
            const Info = index_1.default.nodeRegisterInfo.get(IP);
            index_1.default.emit(index_1.default.env.connectNodeClient, { IP, socket, data });
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
    _Alarm({ socket, data }) {
        const IP = socket.conn.remoteAddress;
        console.log(data);
        console.log(IP);
    }
    _delDisconnect({ socket }) {
        const IP = socket.conn.remoteAddress;
        console.log(`节点：${index_1.default.nodeRegisterInfo.get(IP).Name}断开连接，清除定时操作`);
        index_1.default.emit(index_1.default.env.disNodeClient, { IP, socket });
    }
}
exports.default = socket;
