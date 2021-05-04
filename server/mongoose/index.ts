import mongoose, { Schema } from "mongoose";
const DB_URL = `mongodb://${process.env.NODE_Docker === 'docker' ? 'mongo' : 'localhost'}:27017/UartServer`; /** * 连接 */

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

interface Token {
  type: string,
  token: string,
  expires: number,
  creatTime: number
}

const AMapLoctionCache = mongoose.model<mongoose.Document & { key: string, val: string }>("AMap.LoctionCache", AMapLoctionCacheScheme)
const Tokens = mongoose.model<Token & mongoose.Document>('Token', Token)


import { Dev_all, Dev_ac, Dev_ups, Dev_power, Dev_io, Dev_th, Dev_Alarm, Dev_list, Dev_Table } from "./DevEc";
import { DeviceProtocol, DevsType } from "./DeviceAndProtocol";
import { DevConstant, DevArgumentAlias } from "./DeviceParameterConstant";
import { EcTerminal } from "./EnvironmentalControl";
import { LogSmsSend, LogMailSend, LogUartTerminalDataTransfinite, LogUserRequst, LogUserLogins, LogNodes, LogTerminals, LogDataClean, LogUseBytes, LogDtuBusy, LogInstructQuery } from "./Log";
import { Terminal, RegisterTerminal } from "./Terminal";
import { NodeClient, TerminalClientResults, TerminalClientResult, TerminalClientResultSingle, NodeRunInfo, WebSocketTerminal } from "./node";
import { Users, UserBindDevice, UserAlarmSetup, UserAggregation, UserLayout } from "./user";

export { mongoose, Schema, DeviceProtocol, DevsType, Tokens, AMapLoctionCache, Dev_all, Dev_ac, Dev_ups, Dev_power, Dev_io, Dev_th, Dev_Alarm, Dev_list, Dev_Table, DevConstant, DevArgumentAlias, EcTerminal, LogSmsSend, LogMailSend, LogUartTerminalDataTransfinite, LogUserRequst, LogUserLogins, LogNodes, LogTerminals, LogDataClean, LogUseBytes, LogDtuBusy, LogInstructQuery, Terminal, RegisterTerminal, NodeClient, TerminalClientResults, TerminalClientResult, TerminalClientResultSingle, NodeRunInfo, WebSocketTerminal, Users, UserBindDevice, UserAlarmSetup, UserAggregation, UserLayout }

export const DocmentCount = async () => {
  const models = [Tokens, AMapLoctionCache, DeviceProtocol, DevsType, Dev_all, Dev_ac, Dev_ups, Dev_power, Dev_io, Dev_th, Dev_Alarm, Dev_Table, DevConstant, EcTerminal, LogSmsSend, LogMailSend, LogUartTerminalDataTransfinite, LogUserRequst, LogUserLogins, LogNodes, LogTerminals, LogDataClean, LogUseBytes, Terminal, RegisterTerminal, UserAlarmSetup, UserAggregation, Users, UserBindDevice, NodeRunInfo,]// NodeClient,TerminalClientResults, TerminalClientResult, TerminalClientResultSingle, NodeRunInfo, WebSocketTerminal, ]
  // Tokens.
  const result = models.map(async mode => {
    const name = mode?.collection?.collectionName
    // console.log({name});
    return { mode, name, count: await mode?.countDocuments() }
  })
  //
  return await Promise.all(result)
}