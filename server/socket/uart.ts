import IO, { ServerOptions, Socket } from "socket.io"
import { Server } from "http";
import Event, { Event as event } from "../event/index";
import { NodeClient, Terminal, protocol, queryObject, timelog, queryResult, TerminalMountDevs, instructQuery, ApolloMongoResult, logNodes, logTerminals } from "../bin/interface";

import tool from "../util/tool";
import { DefaultContext } from "koa";
import { LogNodes, LogTerminals } from "../mongoose/Log";

export interface socketArgument {
    ID: string
    IP: string
    Name: string
    socket: Socket
}

interface TerminalMountDevsEX extends TerminalMountDevs {
    NodeIP: string
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

const EVENT_SERVER = {
    'instructQuery': 'instructQuery', // 操作设备状态指令
}

type NodeName = string
type TerminalPid = string

export class NodeSocketIO {
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
    start(app: DefaultContext) {
        app.context.$SocketUart = this;
        this._OnEvent()
        this._Interval()
    }

    // 触发IO监听处理事件
    private _OnEvent() {
        console.log(`节点Socket服务器已运行,正在监听节点事件`);
        this.io.on("connect", socket => {
            const ID = socket.id
            const IP = socket.conn.remoteAddress
            // 如果节点未注册
            if (!this.Event.Cache.CacheNode.has(IP)) {
                console.log(`有未登记节点连接=>${IP}，断开连接`);
                socket.disconnect()
                // 添加日志
                new LogNodes({ ID, IP, type: "非法连接请求" } as logNodes).save()
                //
                return
            }
            //
            const Name = this.Event.Cache.CacheNode.get(IP)?.Name as string
            const Node = { ID, IP, Name, socket } as socketArgument
            console.log(`new socket connect<id: ${Node.ID},IP: ${Node.IP},Name: ${Name}>`);
            // 添加日志
            new LogNodes(Object.assign<socketArgument, Partial<logNodes>>(Node, { type: "连接" })).save()
            // 注册socket事件
            Node.socket
                // 节点离线
                .on("disconnect", () => {
                    console.log(`${new Date().toLocaleTimeString()}## 节点：${Node.Name}断开连接，清除定时操作`);
                    this.Cache.delete(Node.Name)
                    this.Event.Cache.CacheSocket.delete(Node.IP)
                    // 添加日志
                    new LogNodes(Object.assign<socketArgument, Partial<logNodes>>(Node, { type: "断开" })).save()
                })
                // Node节点注册事件
                .on(EVENT_SOCKET.register, (data) => {
                    // 缓存socket
                    this.Event.Cache.CacheSocket.set(Node.IP, Node.socket)
                    // 根据节点IP获取节点登记信息，节点将根据登记运行程序
                    const Info = <NodeClient>this.Event.Cache.CacheNode.get(Node.IP);
                    // 发送节点注册信息
                    Node.socket.emit(EVENT_SOCKET.registerSuccess, Info);

                })
                // 节点注册成功,初始化设备列表缓存
                .on(EVENT_SOCKET.ready, () => {
                    this._InitCache(Node)
                })
                // 节点启动失败
                .on(EVENT_SOCKET.startError, (data) => {
                    console.log(data);
                    // 添加日志
                    new LogNodes(Object.assign<socketArgument, Partial<logNodes>>(Node, { type: "TcpServer启动失败" })).save()
                })
                // 触发报警事件
                .on(EVENT_SOCKET.alarm, (data) => {
                    console.log(data);
                    // 添加日志
                    new LogNodes(Object.assign<socketArgument, Partial<logNodes>>(Node, { type: "告警" })).save()
                })
                // 节点终端设备上线
                .on(EVENT_TCP.terminalOn, data => {
                    this.Event.Cache.CacheNodeTerminalOnline.get(Node.IP)?.add(data)
                    // 添加日志
                    new LogTerminals({ NodeIP: Node.IP, NodeName: Node.Name, TerminalMac: data, type: "连接" } as logTerminals).save()
                })
                // 节点终端设备掉线
                .on(EVENT_TCP.terminalOff, data => {
                    this.Event.Cache.CacheNodeTerminalOnline.get(Node.IP)?.delete(data)
                    // 添加日志
                    new LogTerminals({ NodeIP: Node.IP, NodeName: Node.Name, TerminalMac: data, type: "断开" } as logTerminals).save()
                })
                // 设备挂载节点查询超时
                .on(EVENT_TCP.terminalMountDevTimeOut, (Query: queryResult) => {
                    const intruct = Query.mac + Query.pid
                    const Timeout = this.Event.Cache.CacheTerminalQueryIntructTimeout
                    // 如果节点已存在超时指令记录则添加,
                    if (Timeout.has(Node.IP)) {
                        Timeout.get(Node.IP)?.add(intruct)
                    } else {
                        Timeout.set(Node.IP, new Set([intruct]))
                    }
                    // 添加日志
                    new LogTerminals({ NodeIP: Node.IP, NodeName: Node.Name, TerminalMac: Query.mac, type: "查询超时", query: Query } as logTerminals).save()
                })
                // 设备挂载节点查询超时恢复,
                .on(EVENT_TCP.terminalMountDevTimeOutRestore, (Query: queryResult) => {
                    const intruct = Query.mac + Query.pid
                    const Timeout = this.Event.Cache.CacheTerminalQueryIntructTimeout
                    Timeout.get(Node.IP)?.delete(intruct)
                    // 添加日志
                    new LogTerminals({ NodeIP: Node.IP, NodeName: Node.Name, TerminalMac: Query.mac, type: "查询恢复", query: Query } as logTerminals).save()
                })

        })
    }
    // 初始化缓存
    private _InitCache(Node: socketArgument) {
        // 获取节点挂载的设备s
        const Terminals = this.Event.Cache.CacheNodeTerminal.get(Node.Name) as Map<string, Terminal>
        // 构建Map
        const TerminalMountDev: Map<TerminalPid, TerminalMountDevsEX> = new Map()
        // 迭代所有设备,加入缓存
        Terminals.forEach(Terminal => {
            Terminal.mountDevs.forEach(mountDevs => {
                const mount = Object.assign<Partial<TerminalMountDevsEX>, TerminalMountDevs>
                    ({ NodeName: Node.Name, NodeIP: Node.IP, TerminalMac: Terminal.DevMac, Interval: 1000 }, mountDevs) as Required<TerminalMountDevsEX>
                TerminalMountDev.set(Terminal.DevMac + mountDevs.pid, mount)
            })
        })
        this.Cache.set(Node.Name, TerminalMountDev)
        console.log(`${new Date().toLocaleTimeString()}##节点: ${Node.Name} 上线,载入设备缓存Size: ${TerminalMountDev.size}`);
    }
    // 定时器总线,粒度控制在500毫秒
    private _Interval() {
        let cont = 0
        setInterval(async () => {
            this.Cache.forEach((Terminals) => {
                Terminals.forEach((mountDev) => {
                    // 判断轮询计算结果是否是正整数,是的话发送查询指令
                    if (Number.isInteger(cont / mountDev.Interval)) {
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
        // 判断挂载设备是否包含在超时列表中
        if (this.Event.Cache.CacheTerminalQueryIntructTimeout.get(Query.NodeIP)?.has(Query.TerminalMac + Query.pid)) {
            //console.log('指令包含在超时列表中');
            return
        }
        // 生成时间戳
        const timeStamp = Date.now()
        // 获取设备协议
        const Protocol = <protocol>this.Event.Cache.CacheProtocol.get(Query.protocol)
        // 获取协议指令生成缓存
        const CacheQueryIntruct = this.CacheQueryIntruct
        // 迭代设备协议获取多条查询数据
        const content = Protocol.instruct.map(ProtocolInstruct => {
            // 如果指令是utf8类型,直接使用指令,否则添加地址码和校验码
            if (ProtocolInstruct.resultType == 'utf8') {
                return ProtocolInstruct.name
            } else {
                // 缓存查询指令
                const IntructName = Query.pid + ProtocolInstruct.name
                if (CacheQueryIntruct.has(IntructName)) {
                    return CacheQueryIntruct.get(IntructName) as string
                } else {
                    const content = tool.Crc16modbus(Query.pid, ProtocolInstruct.name)
                    CacheQueryIntruct.set(IntructName, content)
                    return CacheQueryIntruct.get(IntructName) as string
                }
            }
        })
        const query: queryObject = {
            mac: Query.TerminalMac,
            type: Protocol.Type,
            mountDev: Query.mountDev,
            protocol: Query.protocol,
            pid: Query.pid,
            timeStamp,
            content
        }

        // 获取节点Socket实例
        const NodeSocket = this.Event.Cache.CacheSocket.get(Query.NodeIP) as IO.Socket
        NodeSocket.emit(EVENT_SOCKET.query, query);

    }
    // 发送程序变更指令，公开
    public async InstructQuery(Query: instructQuery) {
        // 在在线设备中查找
        let NodeIP = ''
        for (let [IP, DevSet] of this.Event.Cache.CacheNodeTerminalOnline) {
            if (DevSet.has(Query.DevMac)) {
                NodeIP = IP
                break
            }
        }
        const result = await new Promise<Partial<ApolloMongoResult>>((resolve) => {
            // 不在线则跳出
            if (!NodeIP) resolve({ ok: 0, msg: '设备不在线' })
            // 构建指令
            Query.content = Query.type === 485 ? tool.Crc16modbus(Query.pid, Query.content) : Query.content
            // 取出socket
            const Socket = this.Event.Cache.CacheSocket.get(NodeIP) as IO.Socket
            if(!Socket)  resolve({ ok: 0, msg: '设备不在线' })
            // 创建一次性监听，监听来自Node节点指令查询操作结果
            Socket.once(Query.events, resolve).emit(EVENT_SERVER.instructQuery, Query)
            // 设置定时器，超过20秒无响应则触发事件，避免事件堆积内存泄漏
            setTimeout(() => {
                resolve({ ok: 0, msg: 'Node节点无响应，请检查设备状态信息是否变更' })
            }, 20000);
        })
        // 添加日志
        new LogTerminals({ NodeIP: NodeIP, TerminalMac: Query.DevMac, type: "操作设备", query: Query, result } as logTerminals).save()
        return result
    }
}

export default NodeSocketIO