import { Server, ServerOptions, Socket } from "socket.io"
import http from "http";
import Event, { Event as event } from "../event/index";
import tool from "../util/tool";
import { ParseFunction } from "../util/func";
import { LogDtuBusy, LogInstructQuery } from "../mongoose";


/**
 * 管理node节点socket连接
 */
export default class NodeSocketIO {
    private Event: event;
    /**
     * 缓存查询指令 0300000001=>010300000001ba4c
     */
    CacheQueryIntruct: Map<string, string>
    /**
     * 缓存所有Socket连接,name=>socket
     */
    CacheSocket: Map<string, nodeClient>
    /**
     * DTU设备下线时间
     */
    DTUOfflineTime: Map<string, Date>
    /**
     *  DTU设备上线时间
     */
    DTUOnlineTime: Map<string, Date>
    io: Server;
    /**
     * 
     * @param server http
     * @param opt socket option
     */
    constructor(server: http.Server, opt: Partial<ServerOptions>) {
        this.io = new Server(server, opt)
        this.Event = Event
        //this.Cache = Event.Cache.QueryTerminal
        this.CacheQueryIntruct = new Map()
        this.CacheSocket = new Map()
        this.DTUOfflineTime = new Map()
        this.DTUOnlineTime = new Map()

        console.log(`节点Socket服务器已运行,正在监听节点事件`);
        this.io.on("connect", socket => {
            const ID = socket.id
            // ip由nginx代理后会变为nginx服务器的ip，重写文件头x-real-ip为远端ip
            const IP = socket.handshake.headers["x-real-ip"] || socket.conn.remoteAddress
            // 检查连接节点是否在系统登记
            const Node = this.Event.Cache.CacheNode.get(IP)
            if (Node) {
                const { Name } = Node
                const client = this.CacheSocket.get(Name)
                console.log(`new socket connect<id: ${ID},IP: ${IP},Name: ${Name}>`);
                // 检查节点是否在缓存中,在的话激活旧的socket,否则创建新的socket
                if (client) {
                    console.log(`${Name} 重新上线`);
                    client.socket = socket
                    // 重新注册socket事件监听
                    client.startlisten()
                    this.Event.savelog<Uart.logNodes>('node', { ID, IP, type: "重新上线", Name })
                }
                else {
                    this.CacheSocket.set(Name, new nodeClient(socket, this.Event, this.CacheQueryIntruct, Node))
                    this.Event.savelog<Uart.logNodes>('node', { ID, IP, type: "上线", Name })
                }
            } else {
                console.log(`有未登记或重复登记节点连接=>${IP}，断开连接`);
                socket.disconnect()
                // 添加日志
                this.Event.savelog<Uart.logNodes>('node', { ID, IP, type: "非法连接请求", Name: 'null' })
            }
        })

        // 监听设备超时恢复事件,发送超时恢复短信
        this.Event.on("timeOutRestore", (mac: string, pid: string) => {
            const terminal = this.Event.Cache.CacheTerminal.get(mac)
            if (terminal) {
                const node = this.CacheSocket.get(terminal.mountNode)
                if (node) {
                    const hash = mac + pid
                    const terEx = node.cache.get(hash)
                    if (terEx) {
                        // console.log({ mac, pid, mas: 'terminal恢复' }, this.TimeOutMonutDevSmsSend.has(hash));
                        // 如果短信发送记录为true,发送超时恢复短信提醒
                        if (node.TimeOutMonutDevSmsSend.has(hash)) {
                            // console.log({ mac, pid, mas: 'terminal恢复' });
                            this.Event.sendDevTimeOut2On({ mac, pid, devName: terEx.mountDev, event: '恢复' })
                            node.TimeOutMonutDevSmsSend.delete(hash)
                            this.Event.savelog<Uart.logTerminals>('terminal', { NodeIP: node.property.IP, NodeName: node.property.Name, TerminalMac: terminal.DevMac, type: "查询恢复" })
                        }
                    }
                }

            }

        })
    }
    /**
     * 发送程序变更指令
     * @param Query 指令对象
     */
    public InstructQuery(Query: Uart.instructQuery) {
        return new Promise<Partial<Uart.ApolloMongoResult>>((resolve) => {
            // 在在线设备中查找
            const terminal = this.Event.Cache.CacheTerminal.get(Query.DevMac)
            if (terminal) {
                const client = this.CacheSocket.get(terminal.mountNode)
                if (client && client.socket.connected) {
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
                        this.Event.savelog<Uart.logTerminals>('terminal', { NodeIP: client.property.IP, NodeName: client.property.Name, TerminalMac: Query.DevMac, type: "操作设备", query: Query, result })
                        resolve(result)
                    }).emit('instructQuery', Query)
                    // 设置定时器，超过30秒无响应则触发事件，避免事件堆积内存泄漏
                    setTimeout(() => {
                        resolve({ ok: 0, msg: 'Node节点无响应，请检查设备状态信息是否变更' })
                    }, 30000);
                } else {
                    resolve({ ok: 0, msg: '设备所在节点离线' })
                }
            } else {
                throw new Error('无此设备')
            }
        })
    }

    /**
     * 下发操作指令到DTU
     * @param Query 指令对象
     */
    public async OprateDTU(Query: Uart.DTUoprate) {
        return new Promise<Partial<Uart.ApolloMongoResult>>((resolve) => {
            // 在在线设备中查找
            const terminal = this.Event.Cache.CacheTerminal.get(Query.DevMac)
            if (terminal) {
                const client = this.CacheSocket.get(terminal.mountNode)
                if (client && client.socket.connected) {
                    // 创建一次性监听，监听来自Node节点指令查询操作结果            
                    client.socket.once(Query.events, result => {
                        this.Event.savelog<Uart.logTerminals>('terminal', { NodeIP: client.property.IP, NodeName: client.property.Name, TerminalMac: Query.DevMac, type: "DTU操作", query: Query, result })
                        resolve(result)
                    }).emit('DTUoprate', Query)
                    // 设置定时器，超过20秒无响应则触发事件，避免事件堆积内存泄漏
                    setTimeout(() => {
                        resolve({ ok: 0, msg: 'Node节点无响应，请检查设备状态信息是否变更' })
                    }, 60000);
                } else {
                    resolve({ ok: 0, msg: '设备所在节点离线' })
                }
            } else {
                throw new Error('无此设备')
            }
        })
    }
}

/**
 * node节点对象
 */
class nodeClient {
    socket: Socket;
    cache: Map<string, Uart.TerminalMountDevsEX>;
    private Event: event;
    /**
     * 缓存指令
     */
    private CacheQueryIntruct: Map<string, string>;
    /**
     * socketId
     */
    private ID: string;
    /**
     * 轮询发送查询指令的定时器
     */
    private interVal?: NodeJS.Timeout;
    /**
     * 查询超时告警发送模式 hash state
     */
    TimeOutMonutDevSmsSend: Set<string>
    private count: number;
    /**
     * 标识每个dtu的工作是否繁忙
     */
    private dtuWorkBusy: Set<string>
    /**
     * node节点属性
     */
    property: Uart.NodeClient;
    /**
     * 
     * @param socket node socket对象
     * @param event 事件总线
     * @param CacheQueryIntruct 指令组装缓存 
     * @param node node节点信息
     */
    constructor(socket: Socket, event: event, CacheQueryIntruct: Map<string, string>, node: Uart.NodeClient) {
        // console.log(socket);
        this.socket = socket
        this.cache = new Map()
        this.Event = event
        this.CacheQueryIntruct = CacheQueryIntruct
        this.ID = socket.id
        // j节点本身的信息
        this.property = node
        this.count = 0
        this.TimeOutMonutDevSmsSend = new Set()
        this.dtuWorkBusy = new Set()
        // 注册socket事件
        this.startlisten()
    }
    /**
     * 绑定socket事件
     */
    startlisten() {
        this.socket
            // 发送节点注册信息
            .on('register', _regster => this.socket.emit('registerSuccess', this.property))
            // 节点离线,清理缓存
            .on("disconnect", () => {
                if (this.socket) {
                    console.log(`${new Date().toLocaleTimeString()}## 节点：${this.property.Name}断开连接，清除定时操作`);
                    this.socket.disconnect();
                    console.log('socket disconnected Stat:', this.socket?.disconnected);

                    (this.socket as any) = null
                    const macs = [...this.Event.Cache.CacheTerminal].filter(([mac, term]) => term.mountNode === this.property.Name).map(el => el[0])
                    this.Event.ChangeTerminalStat(macs, false)
                    this.cache.clear()
                    if (this.interVal) clearInterval(this.interVal)
                    // 添加日志
                    this.Event.savelog<Uart.logNodes>('node', { type: "断开", ID: this.ID, IP: this.property.IP, Name: this.property.Name })
                    macs.forEach(mac => {
                        this.Event.savelog<Uart.logTerminals>('terminal', { NodeIP: this.property.IP, NodeName: this.property.Name, TerminalMac: mac, type: "节点断开" })
                    })

                }
            })
            // 节点启动失败
            .on('startError', (data) => {
                console.log(data);
                this.Event.savelog<any>('node', { type: "TcpServer启动失败", ID: this.ID, IP: this.property.IP, Name: this.property.Name })
            })
            // 触发报警事件
            .on('alarm', (data) => {
                console.log(data);
                this.Event.savelog<any>('node', { type: "告警", ID: this.ID, IP: this.property.IP, Name: this.property.Name })
            })
            // 节点终端设备上线
            .on('terminalOn', (data: string | string[], reline = false) => {
                const DTUOnlineTime = this.Event.uartSocket.DTUOnlineTime
                const date = new Date()
                if (!Array.isArray(data)) data = [data]
                this.Event.ChangeTerminalStat(data, true)
                // 迭代macs,从busy列表删除,写入日志,在线记录更新
                data.forEach(mac => {
                    this.dtuWorkBusy.delete(mac)
                    const terminal = this.Event.Cache.CacheTerminal.get(mac)
                    if (terminal) {
                        this.Event.savelog<Uart.logTerminals>('terminal', { NodeIP: this.property.IP, NodeName: this.property.Name, TerminalMac: data[0], type: reline ? "重新连接" : "连接" })
                    }
                    // 如果是重连，加入缓存
                    if (reline) DTUOnlineTime.set(mac, date)
                })
                console.info(`${date.toLocaleTimeString()}##${this.property.Name} DTU:/${data.join("|")}/ 已上线,模式:${reline},重连设备数：${DTUOnlineTime.size}`);
            })
            // 节点终端设备掉线
            .on('terminalOff', (mac: string, active: boolean) => {
                this.Event.ChangeTerminalStat(mac, false)
                console.error(`${new Date().toLocaleTimeString()}##${this.property.Name} DTU:${mac} 已${active ? '主动' : '被动'}离线`);
                this.dtuWorkBusy.delete(mac)
                // 添加日志
                const terminal = this.Event.Cache.CacheTerminal.get(mac)
                if (terminal) {
                    this.Event.savelog<Uart.logTerminals>('terminal', { NodeIP: this.property.IP, NodeName: this.property.Name, TerminalMac: mac, type: active ? "dtu主动断开" : "dtu断开" })
                }
            })
            // 设备查询指令有部分超时,把dtu查询间隔+500ms
            .on('instructTimeOut', (mac: string, pid: number, instructNum: number) => {
                console.log('部分指令超时', mac, pid, instructNum);
                this.Event.setClientDtuMountDevOnline(mac, pid, true)
                const EX = this.cache.get(mac + pid)
                if (EX) EX.Interval += 500 * instructNum

            })
            // 设备挂载节点查询超时,dtu所有查询指令超时
            .on('terminalMountDevTimeOut', async (mac: string, pid: number, timeOut: number) => {
                const hash = mac + pid
                const Query = this.cache.get(hash)
                if (Query) {
                    console.log('------全部指令超时', Query.mountDev, this.TimeOutMonutDevSmsSend, mac, pid, timeOut, Query.Interval);
                    // console.log(`${hash} 查询超时次数:${timeOut},查询间隔：${QueryTerminal.Interval}`);
                    // 如果查询间隔小于五分钟则每次查询间隔修改为+10000
                    // if (Query.Interval < 3e5) Query.Interval += 10000
                    // 如果超时次数>10和短信发送状态为false
                    if (timeOut > 20) {
                        this.Event.setClientDtuMountDevOnline(mac, pid, false)
                        // 把查询超时间隔修改为10分钟
                        Query.Interval = 6e5
                        console.log(`${hash} 查询超时次数:${timeOut},查询间隔：${Query.Interval}`);
                        if (!this.TimeOutMonutDevSmsSend.has(hash)) {
                            // 发送设备查询超时短信
                            this.Event.sendDevTimeOut2On({ mac: Query.TerminalMac, pid: Query.pid, devName: Query.mountDev, event: '超时' })
                            // await SmsDTUDevTimeOut(Query.TerminalMac, Query.pid, Query.mountDev, '超时')
                            // 添加短信发送记录
                            this.TimeOutMonutDevSmsSend.add(hash)

                            const terminal = this.Event.Cache.CacheTerminal.get(Query.TerminalMac)
                            if (terminal) { // 添加日志
                                this.Event.savelog<Uart.uartAlarmObject>('DataTransfinite', { mac: terminal.DevMac, devName: terminal.name, pid: 0, protocol: '', tag: '连接', msg: `${terminal.name}/${Query.pid}/${Query.mountDev} 查询超时`, timeStamp: Date.now() })
                                this.Event.savelog<Uart.logTerminals>('terminal', { NodeIP: this.property.IP, NodeName: this.property.Name, TerminalMac: terminal.DevMac, type: "查询超时", query: Query })
                            }
                        }
                    }
                }
            })
            // 接收dtu空闲状态变更,如果busy是true则把mac加入到繁忙设备列表
            .on("busy", (mac: string, busy: boolean, n: number) => {
                busy ? this.dtuWorkBusy.add(mac) : this.dtuWorkBusy.delete(mac)
                new LogDtuBusy({ mac, stat: busy, n, timeStamp: Date.now() }).save()
                // LogDtuBusy.updateOne({ mac, timeStamp: Date.now() }, { $set: { stat: busy, n } }, { upsert: true }).exec()
                // console.log(`### DTU:${mac} stat:${busy ? 'busy' : 'free'}`, this.dtuWorkBusy, n);
            })
            // 节点注册成功,初始化设备列表缓存
            .on('ready', () => {
                // 迭代所有设备,加入缓存
                this.Event.Cache.CacheTerminal.forEach(terminal => {
                    if (terminal.mountNode === this.property.Name && terminal.disable) {
                        terminal.mountDevs.forEach(mountDev => {
                            // 乐观估计所有设备都是在线的，
                            this.Event.setClientDtuMountDevOnline(terminal.DevMac, mountDev.pid, true)
                            const Interval = this.Event.getMountDevInterval(terminal.DevMac)
                            this.cache.set(terminal.DevMac + mountDev.pid, { ...mountDev, TerminalMac: terminal.DevMac, Interval })
                        })
                    }
                })
                // 设置定时器
                if (this.interVal) clearInterval(this.interVal)
                this.interVal = setInterval(async () => {
                    this.cache.forEach((mountDev) => {
                        // 判断轮询计算结果是否是正整数,是的话发送查询指令
                        if (Number.isInteger(this.count / mountDev.Interval)) {
                            this._SendQueryIntruct(mountDev)
                        }
                    })
                    this.count += 500
                    // 最大值为20day
                    if (this.count > 16e8) this.count = 0
                }, 500)
                console.log(`${new Date().toLocaleTimeString()}##节点: ${this.property.Name} 上线,载入设备缓存Size: ${this.cache.size},定时器:${this.interVal}`);
            })
    }

    // 删除超时

    /**
     * 发送查询指令
     * @param Query 
     */
    private _SendQueryIntruct(Query: Uart.TerminalMountDevsEX) {
        const mac = Query.TerminalMac
        // 判断挂载设备是否空闲和是否在线
        if (!this.dtuWorkBusy.has(mac) && this.Event.Cache.CacheTerminal.get(mac)?.online) {
            // console.log("send" + mac, Query.Interval, this.Event.getClientDtuMountDev(Query.TerminalMac, Query.pid));
            // 获取设备协议
            const Protocol = this.Event.Cache.CacheProtocol.get(Query.protocol)!
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
                    this.Event.Parse.setContentToInstructName(content, ProtocolInstruct.name)
                    return content
                }
            })
            const query: Uart.queryObject = {
                mac,
                type: Protocol.Type,
                mountDev: Query.mountDev,
                protocol: Query.protocol,
                pid: Query.pid,
                timeStamp: Date.now(),
                content,
                Interval: Query.Interval,
                useTime: 0
            }
            LogInstructQuery.updateOne({ mac: query.mac, pid: query.pid }, query, { upsert: true }).exec()
            this.socket.emit('query', query);
        } /* else {
            console.log({ msg: 'uart发送查询失败', mac, mountDev: Query.mountDev, busy: this.dtuWorkBusy.has(mac), online: this.Event.Cache.CacheTerminal.get(mac)?.online, interval: Query.Interval });
        } */
    }
}
