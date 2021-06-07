import mongoose, { Schema } from "mongoose";

import consola from "consola"

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



interface Token {
  type: string,
  token: string,
  expires: number,
  creatTime: number
}

/**
 * 密匙,第三方应用密匙
 */
interface Secret_app {
  appid: string
  secret: string
}

const SecretAppSchema = new Schema({
  appid: String,
  secret: String
})


//  记录secret密匙


const AMapLoctionCache = mongoose.model<mongoose.Document & { key: string, val: string }>("AMap.LoctionCache", AMapLoctionCacheScheme)
const Tokens = mongoose.model<Token & mongoose.Document>('Token', Token)
const TokenValidation = mongoose.model<mongoose.Document & any>("Token.Validation", smsValidation)

export const Dev_all = mongoose.model("EC.all", Schema_Dev_all);
export const Dev_ups = mongoose.model("EC.ups", Schema_Dev_ups);
export const Dev_ac = mongoose.model("EC.ac", Schema_Dev_ac);
export const Dev_power = mongoose.model("EC.power", Schema_Dev_power);
export const Dev_io = mongoose.model("EC.io", Schema_Dev_io);
export const Dev_th = mongoose.model("EC.th", Schema_Dev_th);
export const Dev_Alarm = mongoose.model("EC.Alarm", Schema_Dev_Alarm);
export const Dev_Table = mongoose.model("EC.table", Schema_Dev_Table);


import { DeviceProtocol, DevsType } from "./DeviceAndProtocol";
import { DevConstant, DevArgumentAlias } from "./DeviceParameterConstant";
import { EcTerminal } from "./EnvironmentalControl";
import { LogSmsSend, LogMailSend, LogUartTerminalDataTransfinite, LogUserRequst, LogUserLogins, LogNodes, LogTerminals, LogDataClean, LogUseBytes, LogDtuBusy, LogInstructQuery, LogWXEvent } from "./Log";
import { Terminal, RegisterTerminal } from "./Terminal";
import { NodeClient, TerminalClientResults, TerminalClientResult, TerminalClientResultSingle, NodeRunInfo, WebSocketTerminal } from "./node";
import { Users, UserBindDevice, UserAlarmSetup, UserAggregation, UserLayout, WxUsers } from "./user";
import { Schema_Dev_all, Schema_Dev_Alarm, Schema_Dev_Table } from "./DevEc";
import { Schema_Dev_ups, Schema_Dev_ac, Schema_Dev_power, Schema_Dev_io, Schema_Dev_th } from "./DevType";

export { mongoose, Schema, DeviceProtocol, DevsType, Tokens, TokenValidation,   WxUsers, Dev_list, Dev_Table, LogWXEvent, DevConstant, DevArgumentAlias, EcTerminal, LogSmsSend, LogMailSend, LogUartTerminalDataTransfinite, LogUserRequst, LogUserLogins, LogNodes, LogTerminals, LogDataClean, LogUseBytes, LogDtuBusy, LogInstructQuery, Terminal, RegisterTerminal, NodeClient, TerminalClientResults, TerminalClientResult, TerminalClientResultSingle, NodeRunInfo, WebSocketTerminal, Users, UserBindDevice, UserAlarmSetup, UserAggregation, UserLayout }

export const DocmentCount = async () => {
  const models = [Tokens, DeviceProtocol, DevsType, Dev_all, Dev_ac, Dev_ups, Dev_power, Dev_io, Dev_th, Dev_Alarm, Dev_Table, DevConstant, EcTerminal, LogSmsSend, LogMailSend, LogUartTerminalDataTransfinite, LogUserRequst, LogUserLogins, LogNodes, LogTerminals, LogDataClean, LogUseBytes, Terminal, RegisterTerminal, UserAlarmSetup, UserAggregation, Users, UserBindDevice, NodeRunInfo,]// NodeClient,TerminalClientResults, TerminalClientResult, TerminalClientResultSingle, NodeRunInfo, WebSocketTerminal, ]
  // Tokens.
  const result = models.map(async mode => {
    const name = mode?.collection?.collectionName
    // console.log({name});
    return { mode, name, count: await mode?.countDocuments() }
  })
  //
  return await Promise.all(result)
}

/**
 * mongo ObjectId
 */
export const ObjectId = mongoose.Types.ObjectId