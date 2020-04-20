import IO, { ServerOptions, Socket } from "socket.io"
import { Server } from "http";
import Event, { Event as event } from "../event/index";
import { SocketRegisterInfo, NodeClient, Terminal, protocol, queryObject } from "../bin/interface";
import config from "../config";
import tool from "../bin/tool";

export interface socketArgument {
    ID: string
    IP: string
    socket: Socket

}

export default class NodeSocketIO {
    io: IO.Server;
    Event: event;
    constructor(server: Server, opt: ServerOptions) {
        this.io = IO(server, opt)
        this.Event = Event
    }
    start() {
        this.io.on("connect", socket => {
            const Node: socketArgument = {
                ID: socket.id,
                IP: socket.conn.remoteAddress,
                socket
            }
            console.log(`new socket<id:${Node.ID},IP:${Node.IP}>`);
            // 注册socket事件
            socket.on("register", (data) => this.onRegister(data, Node))
                .on("ready", () => this.ready(Node))
                .on("terminalOn", data => this.terminalOn(data, Node))
                .on("terminalOff", data => this.terminalOff(data, Node))
                .on("startError", (data) => this.startError(data, Node))
                .on("Alarm", (data) => this.Alarm(data, Node)) // 节点报警
                .on("disconnect", () => this.delDisconnect(Node)); // 节点离线
        })
    }
    // jied终端设备上线
    private terminalOn(data: string, Node: socketArgument) {
        this.Event.Cache.CacheNodeTerminalOnline.get(Node.IP)?.add(data)
    }
    // 节点终端设备掉线
    private terminalOff(data: string, Node: socketArgument) {
        this.Event.Cache.CacheNodeTerminalOnline.get(Node.IP)?.delete(data)
    }

    // Node节点注册事件
    private onRegister(data: SocketRegisterInfo, Node: socketArgument) {
        // 如果节点IP未注册，断开连接
        if (!Event.Cache.CacheNode.has(Node.IP)) {
            Node.socket.disconnect()
            console.log(`有未登记节点连接，节点注册信息`);
            // console.log(data);
        } else {
            // 缓存socket
            this.Event.Cache.CacheSocket.set(Node.IP, Node.socket)
            // 根据节点IP获取节点登记信息，节点将根据登记运行程序
            const Info = <NodeClient>Event.Cache.CacheNode.get(Node.IP);
            // 发送节点注册信息
            Node.socket.emit("registerSuccess", Info);
            // 
            const { hostname, totalmem, freemem, loadavg, type, uptime } = data;
            /* console.log(`节点注册：${Info.Name}==${Node.IP}\n
                        注册时间:${new Date().toLocaleString()}\n
                        id<${Node.ID}>已连接\n
                        节点名称：<${hostname}>\n
                        内存总量：<${parseFloat(totalmem).toFixed(0)}>\n
                        已使用:<${parseFloat(freemem).toFixed(0)}>\n
                        平均负载(/1/5/15min)：<${loadavg.map(el => el.toFixed(2) + '%')}>\n
                        已运行时间:<${uptime}>\n
                        系统类型:<${type}>`); */
        }
    }
    // 节点注册成功,发送定时查询数据
    private ready(Node: socketArgument) {        
        // 获取节点名称
        const name = <string>this.Event.Cache.CacheNode.get(Node.IP)?.Name;
        // console.log({name,Node});
        // 创建查询指令定时器,缓存定时器
        const QueryInterval = setInterval(() => {
            this.SendQuery(name, Node);
        }, config.runArg.Query.Inteltime)

        this.Event.Cache.CacheQueryNode.set(Node.IP, QueryInterval)
    }
    // 节点启动失败
    private startError(error: any, Node: socketArgument) { console.log(error) }
    // 触发报警事件
    private Alarm(data: any, Node: socketArgument) {
        console.log(data);
    }
    // 触发节点断开事件
    private delDisconnect(Node: socketArgument) {
        console.log(`节点：${Node.ID}断开连接，清除定时操作`);
        // 清除查询指令定时器
        clearInterval(<NodeJS.Timeout>this.Event.Cache.CacheQueryNode.get(Node.IP));
        //清除缓存
        this.Event.Cache.CacheQueryNode.delete(Node.IP)
    }

    private SendQuery(name: string, Node: socketArgument) {
        // 获取节点下所有的终端
        const clients = <Map<string, Terminal>>this.Event.Cache.CacheNodeTerminal.get(name)
        // 遍历所有终端
        clients.forEach((Terminal, key) => {
            // console.log(key);
            // 如果在线设备缓存内没有此设备，跳过查询
            if (!this.Event.Cache.CacheNodeTerminalOnline.get(Node.IP)?.has(key)) return
            // 遍历每个终端挂载设备
            Terminal.mountDevs.forEach(TerminalMountDevs => {
                // 每个设备一个时间戳,确保所有指令使用同一条
                const timeStamp = Date.now()
                // 获取设备协议
                const Protocol = <protocol>this.Event.Cache.CacheProtocol.get(TerminalMountDevs.protocol)
                // console.log({Terminal,TerminalMountDevs,Protocol});
                Protocol.instruct.forEach(ProtocolInstruct => {
                    // 构建查询指令
                    const content = tool.Crc16modbus(TerminalMountDevs.pid, ProtocolInstruct.name)
                    // 构建查询对象
                    const query: queryObject = {
                        mac: Terminal.DevMac,
                        type: Protocol.Type,
                        protocol: TerminalMountDevs.protocol,
                        pid: TerminalMountDevs.pid,
                        timeStamp,
                        content
                    }
                    // console.log(query);
                    Node.socket.emit("query", query);
                })
            })
        })
    }
}