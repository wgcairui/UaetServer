import ws from "ws";
import { Server } from "http";
import { JwtVerify } from "../util/Secret";
import { getDtuInfo } from "../util/util";

/**
 * 微信小程序使用wss服务端
 */
class WXws {
    private ws: ws.Server;
    clients: Map<string, client>
    constructor(server: Server, path: string = '/ws') {
        this.ws = new ws.Server({ server, path })
        this.clients = new Map()
        this.start()
    }

    private start() {
        this.ws.on("connection", socket => {
            socket.on("message", data => {
                if (/^{.*}$/.test(data.toString())) {
                    const ObjData = JSON.parse(data.toString())
                    if (ObjData?.token) {
                        JwtVerify(ObjData.token).then((user: Uart.UserInfo) => {
                            this.clients.set(user.user, new client(socket))
                            socket.on("close", () => this.clean(user.user)).on("error", () => this.clean(user.user))
                        }).catch(() => {
                            socket.close()
                        })
                    }
                }
            })
        })
    }

    /**
     * 清除缓存
     * @param user 
     */
    clean(user: string) {
        this.clients.delete(user)
    }

    /**
     * 发送告警信息
     * @param alarm 
     */
    SendAlarm(alarm: { mac: string, msg: string }) {
        const { user } = getDtuInfo(alarm.mac)
        if (user && user.user && this.clients.has(user.user)) {
            this.clients.get(user.user)?.ws.send(alarm.msg)
            // this.io.to(user.user).emit("UartTerminalDataTransfinite", alarm.msg)
        }
    }
    /**
     *  发送提醒信息
     * @param user 
     * @param msg 
     */
    SendInfo(user: string, msg: string) {
        if (this.clients.has(user)) {
            this.clients.get(user)?.ws.send(msg)
        }
    }
}

class client {
    ws: ws;
    constructor(ws: ws) {
        this.ws = ws
    }
}

export default WXws