import { mongoose, Schema } from "./index";


// 发送短信记录
const SchemaSmsSend = new Schema({
    tels: [String],
    sendParams: {
        SignName: String,
        TemplateCode: String,
        TemplateParam: String
    },
    Success: {
        Message: String,
        RequestId: String,
        BizId: String,
        Code: String,
    },
    Error: { type: "Mixed" }

}, { timestamps: true })

const SchemaMailSend = new Schema({
    mails: [String],
    sendParams: {
        from: String,
        to: String,
        subject: String,
        html: String
    },
    Success: { type: "Mixed" },
    Error: { type: "Mixed" }

}, { timestamps: true })
// 设备参数超限记录
const SchemaUartTerminalDataTransfinite = new Schema({
    parentId: String,
    type: String,
    mac: String,
    devName: String,
    pid: Number,
    protocol: String,
    timeStamp: Number,
    tag: String,
    msg: String,
    isOk: { type: Boolean, default: false }
}, { timestamps: true })
// 记录用户的所有操作
const SchemaUserRequst = new Schema({
    user: String,
    userGroup: String,
    type: String,
    argument: { type: "Mixed" }
}, { timestamps: true })
// 记录用户登陆注册相关
const SchemaUserLogins = new Schema({
    user: String,
    type: String,
    address: String,
    msg: String
}, { timestamps: true })
// 节点事件
const SchemaNodes = new Schema({
    ID: String,
    IP: String,
    Name: String,
    type: String
}, { timestamps: true })

// 终端事件
const SchemaTerminals = new Schema({
    NodeIP: String,
    NodeName: String,
    TerminalMac: String,
    type: String,
    msg: String,
    query: { type: "Mixed" },
    result: { type: "Mixed" }
}, { timestamps: true })
// 数据清洗
const SchemaDataClean = new Schema({
    NumUartterminaldatatransfinites: String,
    NumUserRequst: String,
    NumClientresults: String,
    NumClientresultcolltion: String,
    CleanClientresultsTimeOut: String,
    lastDate: Date
}, { timestamps: true })

// 流量每日使用量
const SchemaUseBytes = new Schema({
    mac: String,
    date: String,
    useBytes: Number
})
// dtu繁忙状态变更记录
const SchemaDtuBusy = new Schema({
    mac: String,
    stat: Boolean,
    n: Number,
    timeStamp: Number
})

// dtu发送指令记录
const SchemaInstructQuery = new Schema({
    mac: String,
    type: Number,
    mountDev: String,
    protocol: String,
    pid: Number,
    timeStamp: Number,
    content: [String],
    Interval: Number,
})

/**
 * 记录微信推送事件
 */
const SchemaWXEvent = new Schema({
    /**
                 * 开发者 微信号
                 */
    ToUserName: String,
    /**
     * 发送方帐号（一个OpenID）
     */
    FromUserName: String,
    /**
     * 消息创建时间 （整型）
     */
    CreateTime: String,
    /**
     * 消息类型，event
     */
    MsgType: String,
    /**
     * 事件类型，VIEW
     */
    Event: String,
    /**
     * 事件KEY值，设置的跳转URL
     */
    EventKey: String,
    /**
     * 文本消息内容
     */
    Content: String,
    /**
     * 指菜单ID，如果是个性化菜单，则可以通过这个字段，知道是哪个规则的菜单被点击了
     */

    MenuID: String,
    /**
     * 扫描信息
     */
    ScanCodeInfo: String,
    /**
     * 扫描类型，一般是qrcode
     */
    ScanType: String,
    /**
     * 扫描结果，即二维码对应的字符串信息
     */
    ScanResult: String,
    /**
     * 发送的图片信息
     */
    SendPicsInfo: "Mixed",
    /**
     * 发送的图片数量
     */
    Count: Number,
    /**
     * 图片列表
     */
    PicList: ["MIxed"],
    /**
     * 图片的MD5值，开发者若需要，可用于验证接收到图片
     */
    PicMd5Sum: String,
    /**
     * 二维码ticket
     */
    Ticket: String
}, { timestamps: true })
export const LogSmsSend = mongoose.model<mongoose.Document & Uart.logMailSend>("Log.SmsSend", SchemaSmsSend)
export const LogMailSend = mongoose.model<mongoose.Document & Uart.logMailSend>("Log.MailSend", SchemaMailSend)
export const LogUartTerminalDataTransfinite = mongoose.model<mongoose.Document & Uart.uartAlarmObject>("Log.UartTerminalDataTransfinite", SchemaUartTerminalDataTransfinite)
export const LogUserRequst = mongoose.model<mongoose.Document & Uart.logUserRequst>("Log.UserRequst", SchemaUserRequst)
export const LogUserLogins = mongoose.model<mongoose.Document & Uart.logUserLogins>("Log.UserLogin", SchemaUserLogins)
export const LogNodes = mongoose.model<mongoose.Document & Uart.logNodes>("Log.Node", SchemaNodes)
export const LogTerminals = mongoose.model<mongoose.Document & Uart.logTerminals>("Log.Terminal", SchemaTerminals)

export const LogDataClean = mongoose.model<mongoose.Document & any>("Log.DataClean", SchemaDataClean)

export const LogUseBytes = mongoose.model<mongoose.Document & any>("Log.useBytes", SchemaUseBytes)

export const LogDtuBusy = mongoose.model<mongoose.Document & Uart.logDtuBusy>("Log.DtuBusy", SchemaDtuBusy)

export const LogInstructQuery = mongoose.model<mongoose.Document & Uart.queryObject>("Log.InstructQuery", SchemaInstructQuery)


export const LogWXEvent = mongoose.model<mongoose.Document & Uart.WX.WxEvent>("Log.WXEvent", SchemaWXEvent)