import IO, { ServerOptions, Socket } from "socket.io"
import { Server } from "http";
import Event, { Event as event } from "../event/index";
import { NodeClient, Terminal, protocol, queryObject, timelog, queryResult, TerminalMountDevs, TerminalMountDevsEX, instructQuery, ApolloMongoResult, logNodes, logTerminals } from "../bin/interface";

import tool from "../util/tool";
import { DefaultContext } from "koa";
import { LogNodes, LogTerminals } from "../mongoose/Log";

export interface socketArgument {
    ID: string
    IP: string
    Name: string
    socket: Socket
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

export class NodeSocketIO {
    private io: IO.Server;
    private Event: event;

    // 缓存查询指令
    private CacheQueryIntruct: Map<string, string>
    Cache: Map<string, Map<string, TerminalMountDevsEX>>;
    constructor(server: Server, opt: ServerOptions) {
        this.io = IO(server, opt)
        this.Event = Event
        this.Cache = Event.Cache.QueryTerminal
        this.CacheQueryIntruct = new Map()
    }
    start(app: DefaultContext) {
        app.context.$SocketUart = this;
        this._OnEvent()
        this._Interval()
        this._updateQueryInterval()
    }
    // 每10分钟更新每个设备查询间隔
    private _updateQueryInterval() {
        setInterval(() => {
            this.Cache.forEach(el => {
                el.forEach((terEX, hash) => {
                    const useTimeArray = this.Event.Cache.QueryTerminaluseTime.get(hash) as number[]
                    const len = useTimeArray.length
                    const yxuseTimeArray = len > 60 ? useTimeArray.slice(len - 60, len) : useTimeArray
                    const maxTime = Math.max(...yxuseTimeArray)
                    // 如果查询最大值大于1秒,查询间隔调整为最近60次查询耗时中的最大值步进500ms
                    if (maxTime && maxTime < 1001) {
                        terEX.Interval = 1000
                    } else {
                        const maxTimeString = String(maxTime)
                        const han = maxTimeString.slice(maxTimeString.length - 3, maxTimeString.length)
                        terEX.Interval = Number(han) > 500 ? Number(maxTimeString.replace(han, '500')) : Number(maxTimeString.replace(han, '000'))
                    }
                })
            })
            console.log(`更新Query查询缓存间隔时间`);
            // 清空查询计数数组
            this.Event.Cache.QueryTerminaluseTime.forEach(el => el = [])
        }, 60000 * 10)
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
                return
            }
            const Name = this.Event.Cache.CacheNode.get(IP)?.Name as string
            const Node = { ID, IP, Name, socket } as socketArgument
            // 检测节点是否重复注册socket
            if (this.Event.Cache.CacheSocket.has(Node.IP)) {
                console.log(`节点##${Node.Name} 重复请求连接socket,断开连接`);
                Node.socket.disconnect()
                return
            }
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
                    this.Event.Cache.CacheNodeTerminalOnline.delete(Node.IP)
                    // 添加日志
                    new LogNodes(Object.assign<socketArgument, Partial<logNodes>>(Node, { type: "断开" })).save()
                })
                // Node节点注册事件
                .on(EVENT_SOCKET.register, (_data) => {
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
                .on(EVENT_TCP.terminalOn, (data: string | string[]) => {
                    if (Array.isArray(data)) {
                        data.forEach(el => this.Event.Cache.CacheNodeTerminalOnline.add(el))
                        console.info(`${new Date().toLocaleTimeString()}##模块:/${data.join("|")}/ 已上线`);
                    } else {
                        this.Event.Cache.CacheNodeTerminalOnline.add(data)
                        console.info(`${new Date().toLocaleTimeString()}##模块:${data} 已上线`);
                        // 添加日志
                        new LogTerminals({ NodeIP: Node.IP, NodeName: Node.Name, TerminalMac: data, type: "连接" } as logTerminals).save()
                    }
                })
                // 节点终端设备掉线
                .on(EVENT_TCP.terminalOff, data => {
                    this.Event.Cache.CacheNodeTerminalOnline.delete(data)
                    console.error(`${new Date().toLocaleTimeString()}##模块:${data} 已离线`);
                    // 添加日志
                    new LogTerminals({ NodeIP: Node.IP, NodeName: Node.Name, TerminalMac: data, type: "断开" } as logTerminals).save()
                    // console.log({Node,stat:'offline',cache:this.Event.Cache.CacheNodeTerminalOnline});
                })
                // 设备挂载节点查询超时
                .on(EVENT_TCP.terminalMountDevTimeOut, (Query: queryResult, timeOut: number) => {
                    const hash = Query.mac + Query.pid
                    // 查询间隔大于30s,加入到离线列表
                    // 如果超时次数>=10,加500ms
                    if (timeOut >= 10) {
                        console.log(`${hash} 查询超时:${timeOut}`);
                        const QueryTerminal = this.Cache.get(Node.Name)?.get(hash) as TerminalMountDevsEX
                        // 查询间隔大于30s,加入到离线列表
                        if (QueryTerminal) {
                            if (QueryTerminal.Interval >= 1000 * 10) {
                                this.Event.Cache.TimeOutMonutDev.add(hash)
                            } else {
                                QueryTerminal.Interval = QueryTerminal?.Interval ? QueryTerminal.Interval + 500 : 1000
                            }
                        }
                    }
                    // 添加日志
                    new LogTerminals({ NodeIP: Node.IP, NodeName: Node.Name, TerminalMac: Query.mac, type: "查询超时", query: Query } as logTerminals).save()
                })
        })
        // 监听Event事件
        this.Event.On("UpdateTerminal", ([ter]) => this._UpdateCache(ter)) //更新terminalhuancun
            .On("QueryIntervalLow", ([R]) => this._AddQueryInterval(R)) // 增加查询间隔
    }
    // 初始化缓存
    private _InitCache(Node: socketArgument) {
        // 获取节点挂载的设备s
        const Terminals = this.Event.Cache.CacheNodeTerminal.get(Node.Name) as Map<string, Terminal>
        // 构建Map
        const TerminalMountDev: Map<string, TerminalMountDevsEX> = new Map()
        // console.log({ Terminals });

        // 迭代所有设备,加入缓存
        Terminals.forEach(Terminal => {
            Terminal.mountDevs.forEach(mountDev => {
                const mount = Object.assign<Partial<TerminalMountDevsEX>, TerminalMountDevs>
                    ({ NodeName: Node.Name, NodeIP: Node.IP, TerminalMac: Terminal.DevMac, Interval: 1000 }, mountDev) as Required<TerminalMountDevsEX>
                TerminalMountDev.set(Terminal.DevMac + mountDev.pid, mount)
            })
        })
        this.Cache.set(Node.Name, TerminalMountDev)
        console.log(`${new Date().toLocaleTimeString()}##节点: ${Node.Name} 上线,载入设备缓存Size: ${TerminalMountDev.size}`);
    }
    // 更新缓存
    private _UpdateCache(terminal: Terminal) {
        console.log(`socket:更新Cache=${terminal.DevMac}终端缓存`);
        // 获取设备绑定节点的map
        const nodeTerminals = this.Cache.get(terminal.mountNode) as Map<string, TerminalMountDevsEX>
        if (!nodeTerminals) return
        // 
        const Regexs = new RegExp("^" + terminal.DevMac)
        const terEnts = Array.from(nodeTerminals?.entries()).filter(([key]) => Regexs.test(key))
        // 比较缓存和terminal,terminal没有则从缓存清除
        const terminalMountdevsKey = terminal.mountDevs.map(el => terminal.DevMac + el.pid)
        terEnts.forEach(([key]) => {
            if (!terminalMountdevsKey.includes(key)) nodeTerminals.delete(key)
        })
        // 迭代terminal挂载设备,更新缓存
        terminal.mountDevs.forEach(el => {
            const hash = terminal.DevMac + el.pid
            if (nodeTerminals.has(hash)) {
                Object.assign(nodeTerminals.get(hash) as TerminalMountDevsEX, el)
            } else {
                const mount = Object.assign<Partial<TerminalMountDevsEX>, TerminalMountDevs>
                    ({ NodeName: terminal.mountNode, NodeIP: this.Event.Cache.CacheNodeName.get(terminal.mountNode)?.IP, TerminalMac: terminal.DevMac, Interval: 1000 }, el) as Required<TerminalMountDevsEX>
                nodeTerminals.set(hash, mount)
            }
        })
        //console.log({ a: Array.from(nodeTerminals?.entries()).filter(([key]) => Regexs.test(key)) });
    }
    // 增加设备查询间隔
    private _AddQueryInterval(R: queryResult) {
        const terminal = this.Event.Cache.CacheTerminal.get(R.mac) as Terminal
        const hash = R.mac + R.pid
        const QueryList = this.Cache.get(terminal.mountNode)
        const Query = QueryList?.get(hash) as TerminalMountDevsEX
        if (!Query) return
        const Interval = Query.Interval
        if (Interval <= 10000) {
            Query.Interval = Query.Interval + 500
        } else {

        }
        // console.log({ time: new Date().toLocaleTimeString(), R: R.contents, Interval: Query.Interval });
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
        if (this.Event.Cache.TimeOutMonutDev.has(Query.TerminalMac + Query.pid)) return
        // 判断挂载设备是否在线
        if (!this.Event.Cache.CacheNodeTerminalOnline.has(Query.TerminalMac)) {
            console.log(`终端设备${Query.TerminalMac} 不在线,取消查询指令`);
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
            /* if (ProtocolInstruct.resultType == 'utf8') {
                return ProtocolInstruct.name
            } else { */
            // 缓存查询指令
            const IntructName = Query.pid + ProtocolInstruct.name
            if (CacheQueryIntruct.has(IntructName)) return CacheQueryIntruct.get(IntructName) as string
            else {
                let content = ""
                switch (ProtocolInstruct.resultType) {
                    case "utf8":
                        content = ProtocolInstruct.name
                        break
                    case "HX":
                        content = tool.HX(Query.pid, ProtocolInstruct.name)
                        break;
                    default:
                        content = tool.Crc16modbus(Query.pid, ProtocolInstruct.name)
                        break;
                }
                CacheQueryIntruct.set(IntructName, content)
                return content
            }
        })
        const query: queryObject = {
            mac: Query.TerminalMac,
            type: Protocol.Type,
            mountDev: Query.mountDev,
            protocol: Query.protocol,
            pid: Query.pid,
            timeStamp,
            content,
            // 
            Interval: Query.Interval,
            useTime: 0
        }
        //console.log({query,ins:Protocol.instruct});        
        // 获取节点Socket实例
        const NodeSocket = this.Event.Cache.CacheSocket.get(Query.NodeIP) as IO.Socket
        NodeSocket.emit(EVENT_SOCKET.query, query);
    }
    // 发送程序变更指令，公开
    public async InstructQuery(Query: instructQuery) {
        // 在在线设备中查找
        const terminal = this.Event.Cache.CacheTerminal.get(Query.DevMac) as Terminal
        const NodeIP = this.Event.Cache.CacheNodeName.get(terminal.mountNode)?.IP as string
        // console.log({ map: this.Event.Cache.CacheNodeTerminalOnline, NodeIP, Query });
        const result = await new Promise<Partial<ApolloMongoResult>>((resolve) => {
            // 不在线则跳出
            if (!NodeIP) resolve({ ok: 0, msg: '设备不在线' })
            // 取出查询间隔
            Query.Interval = this.Cache.get(terminal.mountNode)?.get(Query.DevMac + Query.pid)?.Interval || 20000
            // 取出socket
            const Socket = this.Event.Cache.CacheSocket.get(NodeIP) as IO.Socket
            if (!Socket) resolve({ ok: 0, msg: '设备不在线' })
            // 构建指令
            if (Query.type === 485) {
                if (/(^HX.*)/.test(Query.protocol)) {
                    Query.content = tool.HX(Query.pid, Query.content)
                } else {
                    Query.content = tool.Crc16modbus(Query.pid, Query.content)
                }
            }
            // 创建一次性监听，监听来自Node节点指令查询操作结果            
            Socket.once(Query.events, resolve).emit(EVENT_SERVER.instructQuery, Query)
            // 设置定时器，超过20秒无响应则触发事件，避免事件堆积内存泄漏
            setTimeout(() => {
                resolve({ ok: 0, msg: 'Node节点无响应，请检查设备状态信息是否变更' })
            }, Query.Interval * 3);
        })
        // 添加日志
        new LogTerminals({ NodeIP: NodeIP, TerminalMac: Query.DevMac, type: "操作设备", query: Query, result } as logTerminals).save()
        return result
    }
}

export default NodeSocketIO