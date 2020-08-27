import IO, { ServerOptions, Socket } from "socket.io"
import { Server } from "http";
import Event, { Event as event } from "../event/index";
import { UserInfo, uartAlarmObject, logUserLogins } from "uart";
import { JwtVerify } from "../util/Secret";
import { parseToken } from "../util/util";
import { LogUserLogins } from "../mongoose/Log";

interface socketArgument {
    IP: string
    ID: string
    User: string
    socket: Socket

}

export default class webClientSocketIO {
    io: IO.Server;
    Event: event;
    CacheSocketidUser: Map<string, string>;
    CacheUserSocketids: Map<string, Set<string>>;
    constructor(server: Server, opt: ServerOptions) {
        this.io = IO(server, opt)
        this.Event = Event
        this.CacheUserSocketids = this.Event.ClientCache.CacheUserSocketids
        this.CacheSocketidUser = this.Event.ClientCache.CacheSocketidUser
    }
    start() {
        // middleware
        // 每个socket连接会有query.token,检查token是否合法
        this.io.use((socket, next) => {
            const token = parseToken(socket.handshake.query.token)
            JwtVerify(token)
                .then(() => next())
                .catch((err) => {
                    socket.disconnect()
                    next(new Error('socket no find token'))
                })
        });
        // 监听所有连接事件
        this.io.on("connect", async socket => {
            const token = parseToken(socket.handshake.query.token)
            const { user }: UserInfo = await JwtVerify(token)
            const id = socket.id
            const ip = socket.conn.remoteAddress
            const Node: socketArgument = { User: user as string, ID: id, socket, IP: ip }
            this._connect(Node)
            //为每个socket注册事件
            socket.on("disconnect", () => this._disconnect(Node))
        })
        // 监听Event事件
        Event.On("UartTerminalDataTransfinite", (data) => {
            const Obj = data[0] as uartAlarmObject
            const user = Event.Cache.CacheBindUart.get(Obj.mac) as string
            this.io.to(user).emit("UartTerminalDataTransfinite", Obj.msg)
        })
    }
    // 缓存socket
    private _connect(Node: socketArgument) {
        // this.io.to(Node.User).emit('data')
        // 缓存id
        this.CacheSocketidUser.set(Node.ID, Node.User)
        // 加入房间
        Node.socket.join(Node.User)
        // 判断是否多端登录
        const isUser = this.CacheUserSocketids.has(Node.User)
        if (isUser) {
            const socketIds = <Set<string>>this.CacheUserSocketids.get(Node.User)
            socketIds.add(Node.ID)
            // room 发送登录信息
            Node.socket.to(Node.User).emit("login", { ID: Node.ID, IP: Node.IP })
            console.log(`user:${Node.User}@设备多端登录, 已登录id${Array.from(socketIds).join("---")}`);
        } else {
            this.CacheUserSocketids.set(Node.User, new Set([Node.ID]))
            console.log(`user:${Node.User}@单点登录,登录ID：%${Node.ID}`);
        }
        // 发送效验成功事件        
        Node.socket.to(Node.User).emit("valdationSuccess", { user: Node.User })
    }
    // 断开socket，清除缓存
    private _disconnect(Node: socketArgument) {
        // 离开房间user
        Node.socket.leave(Node.User)
        Node.socket.disconnect()
        this.CacheSocketidUser.delete(Node.ID)
        // 获取用户数组列表
        const userSocketids = <Set<string>>this.CacheUserSocketids.get(Node.User)
        const size = userSocketids.size
        if (size < 2) {
            this.CacheUserSocketids.delete(Node.User)
            console.log(`用户@${Node.User} 单端登录已离线，`);
        } else {
            userSocketids.delete(Node.ID)
            // room 发送离线信息
            Node.socket.to(Node.User).emit("logout", { ID: Node.ID, IP: Node.IP })
            console.log(`用户@${Node.User} 多端登录已1离线，在线数:${size - 1}`);
        }
    }
}