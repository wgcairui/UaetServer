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
    NumUartterminaldatatransfinites: Number,
    NumUserRequst: Number,
    NumClientresults: Number,
    NumClientresultcolltion: Number,
    lastDate: Date
}, { timestamps: true })

// 流量每日使用量
const SchemaUseBytes = new Schema({
    mac: String,
    date: String,
    useBytes: Number
})
export const LogSmsSend = mongoose.model("LogSmsSend", SchemaSmsSend)
export const LogMailSend = mongoose.model("LogMailSend", SchemaMailSend)
export const LogUartTerminalDataTransfinite = mongoose.model("LogUartTerminalDataTransfinite", SchemaUartTerminalDataTransfinite)
export const LogUserRequst = mongoose.model("LogUserRequst", SchemaUserRequst)
export const LogUserLogins = mongoose.model("LogUserLogin", SchemaUserLogins)
export const LogNodes = mongoose.model("LogNode", SchemaNodes)
export const LogTerminals = mongoose.model("LogTerminal", SchemaTerminals)

export const LogDataClean = mongoose.model("LogDataClean", SchemaDataClean)

export const LogUseBytes = mongoose.model("LoguseBytes", SchemaUseBytes)