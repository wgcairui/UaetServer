/* eslint-disable camelcase */
import {
  Schema_Dev_ac,
  Schema_Dev_io,
  Schema_Dev_power,
  Schema_Dev_th,
  Schema_Dev_ups
} from "./DevType";
import { mongoose, Schema } from "./index";
import { Uart } from "types-uart";

/**
 * 
 */
const Schema_Dev_all = new Schema({
  devType: String,
  devid: String,
  data: { type: "Mixed" },
  DateTime: { type: Date, default: new Date().toLocaleString() }
});

const Schema_Dev_Alarm = new Schema({
  DeviceId: String,
  Alarm_time: String,
  Alarm_msg: String,
  Alarm_device: String,
  Alarm_level: Number,
  Alarm_type: String,
  DateTime: Number,
  confirm: Boolean,
  confirm_user: { type: String, default: "" },
  confirm_time: { type: Date }
});

const Schema_Dev_Table = new Schema({
  clientID: String,
  devlist: [String],
  AlarmSendSelect: String,
  http_uri: String,
  mail: String,
  webConnect: String,
  main_query: String,
  tel: String,
  handle_wait_slim: String,
  SocketID: String,
  websocket_uri: String
});

const Dev_all = mongoose.model("EC.all", Schema_Dev_all);
const Dev_ups = mongoose.model("EC.ups", Schema_Dev_ups);
const Dev_ac = mongoose.model("EC.ac", Schema_Dev_ac);
const Dev_power = mongoose.model("EC.power", Schema_Dev_power);
const Dev_io = mongoose.model("EC.io", Schema_Dev_io);
const Dev_th = mongoose.model("EC.th", Schema_Dev_th);
const Dev_Alarm = mongoose.model("EC.Alarm", Schema_Dev_Alarm);
const Dev_Table = mongoose.model("EC.table", Schema_Dev_Table);

const Dev_list = {
  ups: Dev_ups,
  ac: Dev_ac,
  power: Dev_power,
  io: Dev_io,
  th: Dev_th
};
export {
  Dev_all,
  Dev_ac,
  Dev_ups,
  Dev_power,
  Dev_io,
  Dev_th,
  Dev_Alarm,
  Dev_list,
  Dev_Table
};
