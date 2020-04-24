import IO, { ServerOptions, Socket } from "socket.io"
import { Server } from "http";
import Event, { Event as event } from "../event/index";
import { SocketRegisterInfo, NodeClient, Terminal, protocol, queryObject, timelog, queryResult, TerminalMountDevs } from "../bin/interface";
import config from "../config";
import tool from "../bin/tool";

export interface socketArgument {
    ID: string
    IP: string
    socket: Socket
}

interface TerminalMountDevsEX extends TerminalMountDevs {
    NodeName: string
    TerminalMac: string
    Interval: number
}

const EVENT_TCP = {
    terminalOn: 'terminalOn', // 终端设备上线
    terminalOff: 'terminalOff', // 终端设备下线
    terminalMountDevTimeOut: 'terminalMountDevTimeOut', // 设备挂载节点查询超时
    terminalMountDevTimeOutRestore: 'terminalMountDevTimeOutRestore', // 设备挂载节点查询超时

}
const EVENT_SOCKET = {
    register: 'register', // 节点注册
    registerSuccess: 'registerSuccess', // 节点注册成功
    query: 'query', // 服务器查询请求
    ready: 'ready', // 启动Tcp服务成功
    startError: 'startError', // 启动Tcp服务出错
    alarm: 'alarm', // 节点告警事件
}

type NodeName = string
type TerminalPid = string

export default class NodeSocketIO {
    private io: IO.Server;
    private Event: event;
    // Cache
    private Cache: Map<NodeName, Map<TerminalPid, TerminalMountDevsEX>>
    // 缓存查询指令
    private CacheQueryIntruct: Map<string, string>
    constructor(server: Server, opt: ServerOptions) {
        this.io = IO(server, opt)
        this.Event = Event
        this.Cache = new Map()
        this.CacheQueryIntruct = new Map()
    }
    start() {
        this._OnEvent()
        this._Interval()
    }

    // 触发IO监听处理事件
    private _OnEvent() {
        console.log(`节点Socket服务器已运行,正在监听节点事件`);
        this.io.on("connect", socket => {
            const Node: socketArgument = {
                ID: socket.id,
                IP: socket.conn.remoteAddress,
                socket
            }
            console.log(`new socket connect<id:${Node.ID},IP:${Node.IP}>`);
            // 注册socket事件
            Node.socket
                // 节点离线
                .on("disconnect", () => {
                    console.log(`节点：${Node.ID}断开连接，清除定时操作`);
                    // 清除查询指令定时器
                    //clearInterval(<NodeJS.Timeout>this.Event.Cache.CacheQueryNode.get(Node.IP));
                    //清除缓存
                    //this.Event.Cache.CacheQueryNode.delete(Node.IP)
                    // 获取节点名称
                    const name = <string>this.Event.Cache.CacheNode.get(Node.IP)?.Name;
                    this.Cache.delete(name)
                })
                // Node节点注册事件
                .on(EVENT_SOCKET.register, (data) => {
                    // 如果节点IP未注册，断开连接
                    if (!this.Event.Cache.CacheNode.has(Node.IP)) {
                        Node.socket.disconnect()
                        console.log(`有未登记节点连接=>${Node.IP}，断开连接`);
                    } else {
                        // 缓存socket
                        this.Event.Cache.CacheSocket.set(Node.IP, Node.socket)
                        // 根据节点IP获取节点登记信息，节点将根据登记运行程序
                        const Info = <NodeClient>this.Event.Cache.CacheNode.get(Node.IP);
                        // 发送节点注册信息
                        Node.socket.emit(EVENT_SOCKET.registerSuccess, Info);
                    }
                })
                // 节点注册成功,发送定时查询数据
                .on(EVENT_SOCKET.ready, () => {
                    // 获取节点名称
                    const name = <string>this.Event.Cache.CacheNode.get(Node.IP)?.Name;
                    this._InitCache(name)
                    /* // 创建查询指令定时器,缓存定时器
                    const QueryInterval = setInterval(() => {
                        this.GenerateQueryIntruct(name, Node);
                    }, config.runArg.Query.Inteltime)
                    this.Event.Cache.CacheQueryNode.set(Node.IP, QueryInterval) */
                })
                // 节点终端设备上线
                .on(EVENT_TCP.terminalOn, data => {
                    this.Event.Cache.CacheNodeTerminalOnline.get(Node.IP)?.add(data)
                })
                // 节点终端设备掉线
                .on(EVENT_TCP.terminalOff, data => {
                    this.Event.Cache.CacheNodeTerminalOnline.get(Node.IP)?.delete(data)
                })
                // 节点启动失败
                .on(EVENT_SOCKET.startError, (data) => {
                    console.log(data);
                })
                // 触发报警事件
                .on(EVENT_SOCKET.alarm, (data) => {
                    console.log(data);
                })
                // 设备挂载节点查询超时
                .on(EVENT_TCP.terminalMountDevTimeOut, (data: { query: queryResult, PidObj: timelog }) => {
                    const intruct = this.compoundTntruct(data.query)
                    const Timeout = this.Event.Cache.CacheTerminalQueryIntructTimeout
                    // 如果节点已存在超时指令记录则添加,
                    if (Timeout.has(Node.IP)) {
                        Timeout.get(Node.IP)?.add(intruct)
                    } else {
                        Timeout.set(Node.IP, new Set([intruct]))
                    }
                })
                // 设备挂载节点查询超时恢复,
                .on(EVENT_TCP.terminalMountDevTimeOutRestore, (data: { query: queryResult }) => {
                    const intruct = this.compoundTntruct(data.query)
                    const Timeout = this.Event.Cache.CacheTerminalQueryIntructTimeout
                    Timeout.get(Node.IP)?.delete(intruct)
                })

        })
    }
    // 初始化缓存
    private _InitCache(NodeName: string) {
        console.log(`${new Date().toLocaleTimeString()}##节点:${NodeName} 上线,载入设备缓存`);
        // 获取节点挂载的设备s
        const Terminals = this.Event.Cache.CacheNodeTerminal.get(NodeName) as Map<string, Terminal>
        // 构建Map
        const TerminalMountDev: Map<TerminalPid, TerminalMountDevsEX> = new Map()
        // 迭代所有设备,加入缓存
        Terminals.forEach(Terminal => {
            Terminal.mountDevs.forEach(mountDevs => {
                const mount = Object.assign<Partial<TerminalMountDevsEX>, TerminalMountDevs>
                    ({ NodeName: NodeName, TerminalMac: Terminal.DevMac, Interval: 1000 }, mountDevs) as Required<TerminalMountDevsEX>
                TerminalMountDev.set(Terminal.DevMac + mountDevs.pid, mount)
            })
        })
        this.Cache.set(NodeName, TerminalMountDev)
    }
    // 定时器总线,粒度控制在500毫秒
    private _Interval() {
        let cont = 0
        setInterval(async () => {
            this.Cache.forEach((Terminals) => {
                Terminals.forEach((mountDev) => {
                    // 判断轮询计算结果是否是正整数,是的话发送查询指令
                    if (Number.isInteger(cont/mountDev.Interval)){
                        this._SendQueryIntruct(mountDev)
                    }
                })
            })
            cont += 500
            if (cont > 360000) cont = 0
        }, 500)
    }
    // 发送查询指令
    private _SendQueryIntruct(Query: TerminalMountDevsEX) {
        // 生成时间戳
        const timeStamp = Date.now()
        // 获取设备协议
        const Protocol = <protocol>this.Event.Cache.CacheProtocol.get(Query.protocol)
        // 迭代设备协议获取多条查询数据
        const content = Protocol.instruct.map(ProtocolInstruct => {
            // 缓存查询指令
            const IntructName = Query.pid + ProtocolInstruct.name
            if (this.CacheQueryIntruct.has(IntructName)) {
                return this.CacheQueryIntruct.get(IntructName) as string
            } else {
                const content = tool.Crc16modbus(Query.pid, ProtocolInstruct.name)
                this.CacheQueryIntruct.set(IntructName, content)
                return this.CacheQueryIntruct.get(IntructName) as string
            }
        })
        const query: queryObject = {
            mac: Query.TerminalMac,
            type: Protocol.Type,
            protocol: Query.protocol,
            pid: Query.pid,
            timeStamp,
            content
        }
        // 获取节点IP
        const NodeIP = this.Event.Cache.CacheNodeName.get(Query.NodeName)?.IP as string
        // 获取节点Socket实例
        const NodeSocket = this.Event.Cache.CacheSocket.get(NodeIP) as IO.Socket
        NodeSocket.emit(EVENT_SOCKET.query, query);
    }
    private compoundTntruct(query: queryResult | queryObject) {
        return query.mac + query.content
    }
    /* 
    // 生成查询指令
    private GenerateQueryIntruct(name: string, Node: socketArgument) {
        // 获取节点下所有的终端
        const clients = <Map<string, Terminal>>this.Event.Cache.CacheNodeTerminal.get(name)
        // 遍历所有终端
        clients.forEach((Terminal, key) => {
            // console.log({key,t:Terminal.mountDevs});
            // 如果在线设备缓存内没有此设备，跳过查询
            if (!this.Event.Cache.CacheNodeTerminalOnline.get(Node.IP)?.has(key)) return
            // 遍历每个终端挂载设备
            Terminal.mountDevs.forEach(TerminalMountDevs => {
                // 每个挂载设备一个时间戳,确保所有指令使用同一条
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

                    Node.socket.emit(EVENT_SOCKET.query, query);
                })
            })
        })
    } */
}