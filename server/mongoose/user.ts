/* eslint-disable camelcase */
/* jshint esversion:8 */
import { mongoose, Schema } from "./index";
import { Schema_DevConstant } from "./DeviceParameterConstant";

// 用户信息
const Schema_Users = new Schema({
  userId: String,
  name: String,
  user: { type: String, index: true, trim: true, required: true, unique: true },
  userGroup: {
    type: String,
    enum: ["root", "admin", "user"],
    trim: true,
    default: "user"
  },
  passwd: String,
  mail: String,
  company: String,
  tel: Number,
  creatTime: { type: Date, default: new Date() },
  modifyTime: { type: Date, default: null },
  address: String,
  status: { type: Boolean, default: true },
  messageId: String,
});

// 用户绑定设备
const SchemaUserBindDevice = new Schema({
  user: String,
  ECs: [String],
  UTs: [String]
});

// 用户聚合设备
const SchemaUserAggregation = new Schema({
  user: String,
  id: String,
  name: String,
  aggregations: [
    new Schema({
      DevMac: { type: String, required: true },
      name: { type: String, required: true },
      Type: { type: String, required: true },
      mountDev: { type: String, required: true },
      protocol: { type: String, required: true },
      pid: { type: Number, default: 0 }
    }, { _id: false })
  ]
})

// 用户告警设备
const SchemaUserAlarmSetup = new Schema({
  user: String,
  tels: [String],
  mails: [String],
  ProtocolSetup: [Schema_DevConstant]
})

const Users = mongoose.model("users", Schema_Users);
const UserBindDevice = mongoose.model("UserBindDevice", SchemaUserBindDevice);
const UserAlarmSetup = mongoose.model("userAlarmSetup", SchemaUserAlarmSetup)
const UserAggregation = mongoose.model("useraggregation", SchemaUserAggregation)
export { Users, UserBindDevice, UserAlarmSetup, UserAggregation };
