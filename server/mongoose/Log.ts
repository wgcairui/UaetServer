import { mongoose, Schema } from "./index";
import { Uart } from "types-uart";

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
