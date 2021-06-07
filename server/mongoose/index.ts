import mongoose, { Schema } from "mongoose";
import consola from "consola"
import { Schema_Dev_all, Schema_Dev_Alarm, Schema_Dev_Table, SchemaEC } from "./DevEc";
import { Schema_Dev_ups, Schema_Dev_ac, Schema_Dev_power, Schema_Dev_io, Schema_Dev_th } from "./DevType";
import { SchemaDev, SchemaProtocols } from "./DeviceAndProtocol";
import { Schema_DevConstant, Schema_DevArgumentAlias } from "./DeviceParameterConstant";
import { SchemaSmsSend, SchemaMailSend, SchemaUartTerminalDataTransfinite, SchemaUserRequst, SchemaUserLogins, SchemaNodes, SchemaTerminals, SchemaDataClean, SchemaUseBytes, SchemaDtuBusy, SchemaInstructQuery, SchemaWXEvent } from "./Log";
import { SchemaNodeClient, SchemaTerminalClientResults, SchemaTerminalClientResult, SchemaTerminalClientResultSingle, SchemaNodeRunInfo, SchemaWebSocketTerminal } from "./node";
import { SchemaRegisterTerminal, SchemaTerminal } from "./Terminal";
import { SchemawxUser, Schema_Users, SchemaUserBindDevice, SchemaUserAlarmSetup, SchemaUserAggregation, SchemaUserLayout } from "./user";


const DB_URL = `mongodb://${process.env.NODE_Docker === 'docker' ? 'mongo' : 'localhost'}:27017`; /** * 连接 */

mongoose.connect(DB_URL, {
  dbName: "UartServer",
  useUnifiedTopology: true,
  useNewUrlParser: true,
  useCreateIndex: true
}); /** * 连接成功 */
mongoose.set("useUnifiedTopology", true);
mongoose.set("useFindAndModify", false);
mongoose.connection
  .on("connected", function () {
    consola.success("Mongoose connection open to " + DB_URL);
  })
  .on("error", function (err) {
    console.log({ DB_URL });
    consola.error("Mongoose connection error: " + err);
  })
  .on("disconnected", function () {
    consola.success("Mongoose connection disconnected");
  });

// 记录gps解析
const AMapLoctionCacheScheme = new Schema({
  key: String,
  val: String
})

// 记录sms校验权限
const smsValidation = new Schema({
  token: {
    type: String,
    index: { expires: 60 * 60 * 24 * 1 }
  },
  type: String,
  createdAt: {
    type: Date,
    default: Date.now(),
    index: { expires: 60 * 60 * 24 * 1 }
  }
})

// 记录wx token
const Token = new Schema({
  type: String,
  token: String,
  expires: Number,
  creatTime: Number
})



const SchemaSecretApp = new Schema({
  type: String,
  appid: String,
  secret: String
}, { timestamps: true })


//  记录secret密匙

/**
 * 高德地图定位转换数据缓存
 */
export const AMapLoctionCache = mongoose.model<mongoose.Document & { key: string, val: string }>("AMap.LoctionCache", AMapLoctionCacheScheme)
/**
 * 保存token
 */
export const Tokens = mongoose.model<Uart.Token & mongoose.Document>('secret.Token', Token)
/**
 * 保存token验证
 */
export const TokenValidation = mongoose.model<mongoose.Document & any>("secret.TokenValidation", smsValidation)
/**
 * 保存第三方应用密匙信息
 */
export const SecretApp = mongoose.model<Uart.Secret_app & mongoose.Document>("secret.app", SchemaSecretApp)

/**
 * EC设备
 */
export const EcTerminal = mongoose.model("EC.Terminal", SchemaEC);
export const Dev_all = mongoose.model("EC.all", Schema_Dev_all);
export const Dev_ups = mongoose.model("EC.ups", Schema_Dev_ups);
export const Dev_ac = mongoose.model("EC.ac", Schema_Dev_ac);
export const Dev_power = mongoose.model("EC.power", Schema_Dev_power);
export const Dev_io = mongoose.model("EC.io", Schema_Dev_io);
export const Dev_th = mongoose.model("EC.th", Schema_Dev_th);
export const Dev_Alarm = mongoose.model("EC.Alarm", Schema_Dev_Alarm);
export const Dev_Table = mongoose.model("EC.table", Schema_Dev_Table);

/**
 * uart设备类型
 */
export const DevsType = mongoose.model<Uart.DevsType & mongoose.Document>("Device.Type", SchemaDev);
/**
 * uart设备协议
 */
export const DeviceProtocol = mongoose.model<Uart.protocol & mongoose.Document>("Device.Protocol", SchemaProtocols);
/**
 * uart协议约束
 */
export const DevConstant = mongoose.model<Uart.ProtocolConstantThreshold & mongoose.Document>("Device.Constant", Schema_DevConstant);
/**
 * uart设备参数别名
 */
export const DevArgumentAlias = mongoose.model<Uart.DevArgumentAlias & mongoose.Document>('Device.ArgumentAlia', Schema_DevArgumentAlias)
/**
 * 短信发送记录
 */
export const LogSmsSend = mongoose.model<mongoose.Document & Uart.logMailSend>("Log.SmsSend", SchemaSmsSend)
/**
 * 邮件发送记录
 */
export const LogMailSend = mongoose.model<mongoose.Document & Uart.logMailSend>("Log.MailSend", SchemaMailSend)
/**
 * 设备告警记录
 */
export const LogUartTerminalDataTransfinite = mongoose.model<mongoose.Document & Uart.uartAlarmObject>("Log.UartTerminalDataTransfinite", SchemaUartTerminalDataTransfinite)
/**
 * 用户请求记录
 */
export const LogUserRequst = mongoose.model<mongoose.Document & Uart.logUserRequst>("Log.UserRequst", SchemaUserRequst)
/**
 * 用户登录记录
 */
export const LogUserLogins = mongoose.model<mongoose.Document & Uart.logUserLogins>("Log.UserLogin", SchemaUserLogins)
/**
 * 节点记录
 */
export const LogNodes = mongoose.model<mongoose.Document & Uart.logNodes>("Log.Node", SchemaNodes)
/**
 * 终端记录
 */
export const LogTerminals = mongoose.model<mongoose.Document & Uart.logTerminals>("Log.Terminal", SchemaTerminals)
/**
 * 定时数据清理记录
 */
export const LogDataClean = mongoose.model<mongoose.Document & any>("Log.DataClean", SchemaDataClean)
/**
 * 终端使用流量记录
 */
export const LogUseBytes = mongoose.model<mongoose.Document & any>("Log.useBytes", SchemaUseBytes)
/**
 * 终端工作状态记录
 */
export const LogDtuBusy = mongoose.model<mongoose.Document & Uart.logDtuBusy>("Log.DtuBusy", SchemaDtuBusy)
/**
 * 控制指令记录
 */
export const LogInstructQuery = mongoose.model<mongoose.Document & Uart.queryObject>("Log.InstructQuery", SchemaInstructQuery)
/**
 * wx推送事件记录
 */
export const LogWXEvent = mongoose.model<mongoose.Document & Uart.WX.WxEvent>("Log.WXEvent", SchemaWXEvent)
/**
 * 节点终端信息
 */
export const NodeClient = mongoose.model<Uart.NodeClient & mongoose.Document>("Node.Client", SchemaNodeClient)
/**
 * 设备数据原始记录
 */
export const TerminalClientResults = mongoose.model<Uart.queryResult & mongoose.Document>(
  "Client.Result",
  SchemaTerminalClientResults,
);
/**
 * 设备数据解析记录
 */
export const TerminalClientResult = mongoose.model<Uart.queryResultSave & mongoose.Document>(
  "Client.ResultColltion",
  SchemaTerminalClientResult,
);
/**
 * 设备数据单例
 */
export const TerminalClientResultSingle = mongoose.model<Uart.queryResult & mongoose.Document>(
  "Client.ResultSingle",
  SchemaTerminalClientResultSingle,
);
/**
 * 节点运行数据
 */
export const NodeRunInfo = mongoose.model<Uart.nodeInfo & mongoose.Document>("Node.RunInfo", SchemaNodeRunInfo);
/**
 * 节点socket信息
 */
export const WebSocketTerminal = mongoose.model<Uart.WebSocketInfo & mongoose.Document>("Terminal.WebSocketinfo", SchemaWebSocketTerminal)
/**
 * uart终端信息
 */
export const Terminal = mongoose.model<Uart.Terminal & mongoose.Document>("Terminal", SchemaTerminal);
/**
 * uart终端注册信息
 */
export const RegisterTerminal = mongoose.model<Uart.RegisterTerminal & mongoose.Document>("Terminal.Register", SchemaRegisterTerminal)
/**
 * 微信公众号用户信息
 */
export const WxUsers = mongoose.model<Uart.WX.userInfoPublic & mongoose.Document>('user.wxPubilc', SchemawxUser)
/**
 * 用户信息
 */
export const Users = mongoose.model<Uart.UserInfo & mongoose.Document>("users", Schema_Users);
/**
 * 用户绑定设备信息
 */
export const UserBindDevice = mongoose.model<Uart.BindDevice & mongoose.Document>("User.BindDevice", SchemaUserBindDevice);
/**
 * 用户告警配置
 */
export const UserAlarmSetup = mongoose.model<Uart.userSetup & mongoose.Document>("user.AlarmSetup", SchemaUserAlarmSetup)
/**
 * 用户聚合设备
 */
export const UserAggregation = mongoose.model<Uart.Aggregation & mongoose.Document>("user.aggregation", SchemaUserAggregation)
/**
 * 用户布局信息
 */
export const UserLayout = mongoose.model<Uart.userLayout & mongoose.Document>("user.Layout", SchemaUserLayout)

export { mongoose, Schema }

EcTerminal.updateOne(
  { ECid: "mac0101002545" },
  { name: "雷迪司户外柜", model: "w220k" },
  { upsert: true }
).exec()