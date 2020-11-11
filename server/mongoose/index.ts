import mongoose, { Schema } from "mongoose";
const DB_URL = `mongodb://${process.env.NODE_Docker === 'docker' ? 'mongo' : 'localhost'}:27017/UartServer`; /** * 连接 */

export { mongoose, Schema };

mongoose.connect(DB_URL, {
  useUnifiedTopology: true,
  useNewUrlParser: true,
  useCreateIndex: true
}); /** * 连接成功 */
mongoose.set("useUnifiedTopology", true);
mongoose.set("useFindAndModify", false);
mongoose.connection
  .on("connected", function () {
    console.log("Mongoose connection open to " + DB_URL);
  })
  .on("error", function (err) {
    console.log({ DB_URL });
    console.log("Mongoose connection error: " + err);
  })
  .on("disconnected", function () {
    console.log("Mongoose connection disconnected");
  });

// 记录gps解析
const AMapLoctionCacheScheme = new Schema({
  key: String,
  val: String
})

// 记录wx token
const Token = new Schema({
  type: String,
  token: String,
  expires: Number,
  creatTime: Number
})

export interface Token {
  type: string,
  token: string,
  expires: number,
  creatTime: number
}

export const AMapLoctionCache = mongoose.model("AMap.LoctionCache", AMapLoctionCacheScheme)
export const Tokens = mongoose.model('Token', Token)

export { Dev_all, Dev_ac, Dev_ups, Dev_power, Dev_io, Dev_th, Dev_Alarm, Dev_list, Dev_Table } from "./DevEc";
export { DeviceProtocol, DevsType } from "./DeviceAndProtocol";
export { DevConstant, } from "./DeviceParameterConstant";
export { EcTerminal } from "./EnvironmentalControl";
export { LogSmsSend, LogMailSend, LogUartTerminalDataTransfinite, LogUserRequst, LogUserLogins, LogNodes, LogTerminals, LogDataClean, LogUseBytes } from "./Log";
export { Terminal, RegisterTerminal } from "./Terminal";
export { NodeClient, TerminalClientResults, TerminalClientResult, TerminalClientResultSingle, NodeRunInfo, WebSocketTerminal } from "./node";
export { Users, UserBindDevice, UserAlarmSetup, UserAggregation } from "./user";