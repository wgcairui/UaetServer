/* eslint-disable camelcase */
import {
  Schema_Dev_ac,
  Schema_Dev_io,
  Schema_Dev_power,
  Schema_Dev_th,
  Schema_Dev_ups
} from "./DevType";
import { Schema } from "./index";


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


const SchemaEC = new Schema({
  ECid: String,
  name: String,
  model: String
});

export { SchemaEC, Schema_Dev_Alarm, Schema_Dev_ups, Schema_Dev_th, Schema_Dev_power, Schema_Dev_io, Schema_Dev_all, Schema_Dev_ac, Schema_Dev_Table }
