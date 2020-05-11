import { mongoose, Schema } from "./index";

// 发送短信记录
const SchemaSmsSend = new Schema({
    query: { type: "Mixed" },
    sendParams: {
        RegionId: String,
        PhoneNumbers: String,
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
// 设备参数超限记录
const SchemaUartTerminalDataTransfinite = new Schema({
    type: String,
    mac: String,
    pid: Number,
    protocol: String,
    timeStamp: Number,
    msg: String,
},{timestamps:true})
// 记录用户的所有操作
const SchemaUserRequst = new Schema({
    user:String,
    userGroup:String,
    type:String,
    argument:{type:"Mixed"}
},{timestamps:true})
// 记录用户登陆注册相关
//const SchemaUserLogins = new Sc
export const LogUserLogins = mongoose.model("LogUserLogin",SchemaUserRequst)

export const LogSmsSend = mongoose.model("LogSmsSend", SchemaSmsSend)
export const LogUartTerminalDataTransfinite = mongoose.model("LogUartTerminalDataTransfinite",SchemaUartTerminalDataTransfinite)
export const LogUserRequst = mongoose.model("LogUserRequst",SchemaUserRequst)