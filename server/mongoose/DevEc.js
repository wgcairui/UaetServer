"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable camelcase */
const DevType_1 = require("./DevType");
const index_1 = require("./index");
const Schema_Dev_all = new index_1.Schema({
    devType: String,
    devid: String,
    data: { type: "Mixed" },
    DateTime: { type: Date, default: new Date() }
});
const Schema_Dev_Alarm = new index_1.Schema({
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
const Schema_Dev_Table = new index_1.Schema({
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
const Dev_all = index_1.mongoose.model("dev_all", Schema_Dev_all, "Dev_all");
exports.Dev_all = Dev_all;
const Dev_ups = index_1.mongoose.model("dev_ups", DevType_1.Schema_Dev_ups, "Dev_ups");
exports.Dev_ups = Dev_ups;
const Dev_ac = index_1.mongoose.model("dev_ac", DevType_1.Schema_Dev_ac, "Dev_ac");
exports.Dev_ac = Dev_ac;
const Dev_power = index_1.mongoose.model("dev_power", DevType_1.Schema_Dev_power, "Dev_power");
exports.Dev_power = Dev_power;
const Dev_io = index_1.mongoose.model("dev_io", DevType_1.Schema_Dev_io, "Dev_io");
exports.Dev_io = Dev_io;
const Dev_th = index_1.mongoose.model("dev_th", DevType_1.Schema_Dev_th, "Dev_th");
exports.Dev_th = Dev_th;
const Dev_Alarm = index_1.mongoose.model("dev_Alarm", Schema_Dev_Alarm, "Dev_Alarm");
exports.Dev_Alarm = Dev_Alarm;
const Dev_Table = index_1.mongoose.model("dev_table", Schema_Dev_Table);
exports.Dev_Table = Dev_Table;
const Dev_list = {
    ups: Dev_ups,
    ac: Dev_ac,
    power: Dev_power,
    io: Dev_io,
    th: Dev_th
};
exports.Dev_list = Dev_list;
