/* eslint-disable camelcase */
const {
  Schema_Dev_ac,
  Schema_Dev_io,
  Schema_Dev_power,
  Schema_Dev_th,
  Schema_Dev_ups
} = require("./DevType");
const { mongoose, Schema } = require("./index");

const Schema_Dev_all = new Schema({
  devType: String,
  devid: String,
  data: "Mixed",
  DateTime: { type: Date, default: new Date() }
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

const Dev_all = mongoose.model("dev_all", Schema_Dev_all, "Dev_all");
const Dev_ups = mongoose.model("dev_ups", Schema_Dev_ups, "Dev_ups");
const Dev_ac = mongoose.model("dev_ac", Schema_Dev_ac, "Dev_ac");
const Dev_power = mongoose.model("dev_power", Schema_Dev_power, "Dev_power");
const Dev_io = mongoose.model("dev_io", Schema_Dev_io, "Dev_io");
const Dev_th = mongoose.model("dev_th", Schema_Dev_th, "Dev_th");
const Dev_Alarm = mongoose.model("dev_Alarm", Schema_Dev_Alarm, "Dev_Alarm");
const Dev_Table = mongoose.model("dev_table", Schema_Dev_Table);

const Dev_list = {
  ups: Dev_ups,
  ac: Dev_ac,
  power: Dev_power,
  io: Dev_io,
  th: Dev_th
};
module.exports = {
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
