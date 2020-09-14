import IO, { ServerOptions, Socket } from "socket.io"
import { Server } from "http";
import Event, { Event as event } from "../event/index";
import { NodeClient, Terminal, protocol, queryObject, queryResult, TerminalMountDevsEX, instructQuery, ApolloMongoResult, logNodes, logTerminals, DTUoprate, uartAlarmObject } from "uart";

import tool from "../util/tool";
import { SmsDTUDevTimeOut } from "../util/SMS";

import config from "../config";
import { ParseFunction } from "../util/func";

export default class NodeSocketIO {
    private io: IO.Server;
    private Event: event;
    // 缓存查询指令 0300000001=>010300000001ba4c
    CacheQueryIntruct: Map<string, string>
    // 缓存所有Socket连接,name=>socket
    CacheSocket: Map<string, nodeClient>
    constructor(server: Server, opt: ServerOptions) {
        this.io = IO(server, opt)
        this.Event = Event
        //this.Cache = Event.Cache.QueryTerminal
        this.CacheQueryIntruct = new Map()
        this.CacheSocket = new Map()

        console.log(`节点Socket服务器已运行,正在监听节点事件`);
        this.io.on("connect", socket => {
            const ID = socket.id
            const IP = socket.conn.remoteAddress
            if (this.Event.Cache.CacheNode.has(IP) || !this.CacheSocket.has(IP)) {
                const Name = this.Event.Cache.CacheNode.get(IP)?.Name as string
                const client = this.CacheSocket.get(Name)
                console.log(`new socket connect<id: ${ID},IP: ${IP},Name: ${Name}>`);
                if (client) {
                    console.log(`${Name} 重新上线`);
                    client.socket = socket
                    client.startlisten()
                }
                else this.CacheSocket.set(Name, new nodeClient(socket, this.Event, this.CacheQueryIntruct))
            } else {
                console.log(`有未登记或重复登记节点连接=>${IP}，断开连接`);
                socket.disconnect()
                // 添加日志
                this.Event.savelog<logNodes>('node', { ID, IP, type: "非法连接请求", Name: 'null' })
            }
        })
    }
    // 发送程序变更指令，公开
    public InstructQuery(Query: instructQuery) {
        return new Promise<Partial<ApolloMongoResult>>((resolve) => {
            // 在在线设备中查找
            const terminal = this.Event.Cache.CacheTerminal.get(Query.DevMac) as Terminal
            if (!terminal) return resolve({ ok: 0, msg: '无此设备' })
            const client = this.CacheSocket.get(terminal.mountNode)
            if (!client) return resolve({ ok: 0, msg: '设备所在节点未上线' })
            if (client.socket.disconnected) return resolve({ ok: 0, msg: '设备所在节点离线' })
            // 取出查询间隔
            Query.Interval = client.cache.get(Query.DevMac + Query.pid)?.Interval || 20000
            // 构建指令
            if (Query.type === 485) {
                const instructs = this.Event.Cache.CacheProtocol.get(Query.protocol)?.instruct
                // 如果包含非标协议,取第一个协议指令的前处理脚本处理指令内容
                if (instructs && instructs[0].noStandard && instructs[0].scriptStart) {
                    const Fun = ParseFunction(instructs[0].scriptStart)
                    Query.content = Fun(Query.pid, Query.content)
                } else {
                    Query.content = tool.Crc16modbus(Query.pid, Query.content)
                }
            }
            // 创建一次性监听，监听来自Node节点指令查询操作结果            
            client.socket.once(Query.events, result => {
                this.Event.savelog<logTerminals>('terminal', { NodeIP: client.IP, NodeName: client.Name, TerminalMac: Query.DevMac, type: "操作设备", query: Query, result })
                resolve(result)
            }).emit('instructQuery', Query)
            // 设置定时器，超过20秒无响应则触发事件，避免事件堆积内存泄漏
            setTimeout(() => {
                resolve({ ok: 0, msg: 'Node节点无响应，请检查设备状态信息是否变更' })
            }, 60000);
        })
    }

    // 下发操作指令到DTU
    public async OprateDTU(Query: DTUoprate) {
        return new Promise<Partial<ApolloMongoResult>>((resolve) => {
            // 在在线设备中查找
            const terminal = this.Event.Cache.CacheTerminal.get(Query.DevMac) as Terminal
            if (!terminal) return resolve({ ok: 0, msg: '无此设备' })
            const client = this.CacheSocket.get(terminal.mountNode)
            if (!client) return resolve({ ok: 0, msg: '设备所在节点未上线' })
            if (client.socket.disconnected) return resolve({ ok: 0, msg: '设备所在节点离线' })
            // 创建一次性监听，监听来自Node节点指令查询操作结果            
            client.socket.once(Query.events, result => {
                this.Event.savelog<logTerminals>('terminal', { NodeIP: client.IP, NodeName: client.Name, TerminalMac: Query.DevMac, type: "DTU操作", query: Query, result })
                resolve(result)
            }).emit('DTUoprate', Query)
            // 设置定时器，超过20秒无响应则触发事件，避免事件堆积内存泄漏
            setTimeout(() => {
                resolve({ ok: 0, msg: 'Node节点无响应，请检查设备状态信息是否变更' })
            }, 60000);
        })
    }
}

class nodeClient {
    socket: Socket;
    cache: Map<string, TerminalMountDevsEX>;
    Event: event;
    CacheQueryIntruct: Map<string, string>;
    ID: string;
    IP: string;
    Name: string;
    interVal: NodeJS.Timeout;
    count: number;
    constructor(socket: Socket, event: event, CacheQueryIntruct: Map<string, string>) {
        this.socket = socket
        this.cache = new Map()
        this.Event = event
        this.CacheQueryIntruct = CacheQueryIntruct
        this.ID = socket.id
        this.IP = socket.conn.remoteAddress
        this.Name = this.Event.Cache.CacheNode.get(this.IP)?.Name as string
        this.count = 0
        // 注册socket事件
        this.interVal = setInterval(async () => {
            this.cache.forEach((mountDev) => {
                // 判断轮询计算结果是否是正整数,是的话发送查询指令
                if (Number.isInteger(this.count / mountDev.Interval)) {
                    this._SendQueryIntruct(mountDev)
                }
            })
            this.count += 500
            // 最大值为20day
            if (this.count > 1600000000) this.count = 0
        }, 500)
        this.startlisten()
    }

    // 
    startlisten() {
        this.socket
            .on('register', regster => {
                // 根据节点IP获取节点登记信息，节点将根据登记运行程序
                const Info = <NodeClient>this.Event.Cache.CacheNode.get(this.IP);
                // 发送节点注册信息
                this.socket.emit('registerSuccess', Info)
            })
            // 节点离线
            .on("disconnect", () => {
                console.log(`${new Date().toLocaleTimeString()}## 节点：${this.Name}断开连接，清除定时操作`);
                //this.cache.delete(Node.Name)
                //this.Event.Cache.CacheSocket.delete(Node.IP)
                this.Event.Cache.CacheNodeTerminal.get(this.Name)?.forEach((val, key) => {
                    this.Event.Cache.CacheNodeTerminalOnline.delete(key)
                })
                this.cache.clear()
                //clearInterval(this.interVal)
                // 添加日志
                this.Event.savelog<logNodes>('node', { type: "断开", ID: this.ID, IP: this.IP, Name: this.Name })
            })
            // 节点启动失败
            .on('startError', (data) => {
                console.log(data);
                this.Event.savelog<any>('node', { type: "TcpServer启动失败", ID: this.ID, IP: this.IP, Name: this.Name })
            })
            // 触发报警事件
            .on('alarm', (data) => {
                console.log(data);
                this.Event.savelog<any>('node', { type: "告警", ID: this.ID, IP: this.IP, Name: this.Name })
            })
            // 节点终端设备上线
            .on('terminalOn', (data, reline) => {
                const date = new Date()
                if (!Array.isArray(data)) {
                    data = [data]
                    const terminal = this.Event.Cache.CacheTerminal.get(data[0])
                    if (terminal) {
                        this.Event.savelog<uartAlarmObject>('DataTransfinite', { mac: data[0], devName: terminal.name, pid: 0, protocol: '', tag: '连接', msg: `${terminal.name}已上线`, timeStamp: Date.now() })
                        this.Event.savelog<logTerminals>('terminal', { NodeIP: this.IP, NodeName: this.Name, TerminalMac: data[0], type: "连接" })
                    }
                }

                data.forEach(el => {
                    this.Event.Cache.CacheNodeTerminalOnline.add(el)
                    this.Event.Cache.DTUOfflineTime.delete(el)
                })

                // 如果是重连，加入缓存
                if (reline) {
                    this.Event.Cache.DTUOnlineTime.set(data[0], date)
                }
                console.info(`${date.toLocaleTimeString()}##${this.Name} DTU:/${data.join("|")}/ 已上线`);
            })
            // 节点终端设备掉线
            .on('terminalOff', (mac, active) => {
                this.Event.Cache.CacheNodeTerminalOnline.delete(mac)
                const date = new Date()
                this.Event.Cache.DTUOnlineTime.delete(mac)
                this.Event.Cache.DTUOfflineTime.set(mac, date)
                console.error(`${date.toLocaleTimeString()}##${this.Name} DTU:${mac} 已${active ? '主动' : '被动'}离线`);
                // 添加日志
                const terminal = this.Event.Cache.CacheTerminal.get(mac)
                if (terminal) {
                    this.Event.savelog<uartAlarmObject>('DataTransfinite', { mac, devName: terminal.name, pid: 0, protocol: '', tag: '连接', msg: `${terminal.name}已${active ? '主动' : '被动'}离线`, timeStamp: Date.now() })
                    this.Event.savelog<logTerminals>('terminal', { NodeIP: this.IP, NodeName: this.Name, TerminalMac: mac, type: "断开" })
                }
            })
            // 设备查询指令有部分超时,
            .on('instructTimeOut', (Query, instruct) => {
                console.log({ type: 'instructTimeOut', Query, instruct });
                const EX = this.cache.get(Query.mac + Query.pid)
                if (EX) Query.Interval += 500

            })
            // 设备挂载节点查询超时
            .on('terminalMountDevTimeOut', (Query: queryResult, timeOut: number) => {
                const hash = Query.mac + Query.pid
                const QueryTerminal = this.cache.get(hash)
                if (QueryTerminal) {
                    this.Event.Cache.TimeOutMonutDev.add(hash)
                    console.log(`${hash} 查询超时次数:${timeOut},查询间隔：${QueryTerminal.Interval}`);
                    QueryTerminal.Interval += 500
                    // 如果超时次数>10和短信发送状态为false
                    console.log({ timeOut, SmsSend: this.Event.Cache.TimeOutMonutDevSmsSend.get(hash) });
                    if (timeOut > 10 && !this.Event.Cache.TimeOutMonutDevSmsSend.get(hash)) {
                        this.Event.Cache.TimeOutMonutDevSmsSend.set(hash, true)
                        SmsDTUDevTimeOut(Query, '超时')
                        console.log({ msg: '查询超时', timeOut, SmsSend: this.Event.Cache.TimeOutMonutDevSmsSend.get(hash) });
                        const terminal = this.Event.Cache.CacheTerminal.get(Query.mac)
                        if (terminal) {
                            // 添加日志
                            this.Event.savelog<uartAlarmObject>('DataTransfinite', { mac: Query.mac, devName: terminal.name, pid: 0, protocol: '', tag: '连接', msg: `${terminal.name}/${Query.pid}/${Query.mountDev} 查询超时`, timeStamp: Date.now() })
                            this.Event.savelog<logTerminals>('terminal', { NodeIP: this.IP, NodeName: this.Name, TerminalMac: Query.mac, type: "查询超时", query: Query })
                        }
                    }
                }
            })
            // 节点注册成功,初始化设备列表缓存
            .on('ready', () => {
                // 迭代所有设备,加入缓存
                this.Event.Cache.CacheNodeTerminal.get(this.Name)?.forEach((Terminal, DevMac) => {
                    Terminal.mountDevs.forEach(mountDev => {
                        this.cache.set(Terminal.DevMac + mountDev.pid, { ...mountDev, TerminalMac: DevMac, Interval: config.runArg.Query.Interval })
                    })
                })
                console.log(`${new Date().toLocaleTimeString()}##节点: ${this.Name} 上线,载入设备缓存Size: ${this.cache.size}`);
            })
    }

    // 发送查询指令
    private _SendQueryIntruct(Query: TerminalMountDevsEX) {
        // 判断挂载设备是否在线
        if (this.Event.Cache.CacheNodeTerminalOnline.has(Query.TerminalMac)) {
            // 生成时间戳
            const timeStamp = Date.now()
            // 获取设备协议
            const Protocol = <protocol>this.Event.Cache.CacheProtocol.get(Query.protocol)
            // 获取协议指令生成缓存
            const CacheQueryIntruct = this.CacheQueryIntruct
            // 迭代设备协议获取多条查询数据
            const content = Protocol.instruct.map(ProtocolInstruct => {
                // 缓存查询指令
                const IntructName = Query.pid + ProtocolInstruct.name
                if (CacheQueryIntruct.has(IntructName)) return CacheQueryIntruct.get(IntructName) as string
                else {
                    let content = ""
                    switch (ProtocolInstruct.resultType) {
                        case "utf8":
                            content = ProtocolInstruct.name
                            break
                        /* case "HX":
                            content = tool.HX(Query.pid, ProtocolInstruct.name)
                            break; */
                        default:
                            // 如果是非标协议,且包含前处理脚本
                            if (ProtocolInstruct.noStandard && ProtocolInstruct.scriptStart) {
                                // 转换脚本字符串为Fun函数,此处不保证字符串为规定的格式,请在添加协议的时候手工校验
                                const Fun = ParseFunction(ProtocolInstruct.scriptStart)
                                content = Fun(Query.pid, ProtocolInstruct.name)
                            } else {
                                content = tool.Crc16modbus(Query.pid, ProtocolInstruct.name)
                            }
                            break;
                    }
                    CacheQueryIntruct.set(IntructName, content)
                    this.Event.Cache.CacheInstructContents.set(content, ProtocolInstruct.name)
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
                Interval: Query.Interval,
                useTime: 0
            }
            // console.log({query,ins:Protocol.instruct});        
            this.socket.emit('query', query);
        }
    }

}