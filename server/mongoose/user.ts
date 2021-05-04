import { mongoose, Schema } from "./index";
import { Schema_DevConstant } from "./DeviceParameterConstant";

// 用户信息
const Schema_Users = new Schema({
  avanter: String,
  rgtype: {
    type: String,
    enum: ['wx', 'web', 'app'],
    default: 'web'
  },
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
  tel: String,
  creatTime: { type: Date, default: new Date() },
  modifyTime: { type: Date, default: null },
  address: String,
  status: { type: Boolean, default: true },
  messageId: String,
})

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

// 用户布局设置
const SchemaUserLayout = new Schema({
  user: String,
  type: String,
  id: String,
  bg: String,
  Layout: [
    new Schema({
      x: Number,
      y: Number,
      id: String,
      name: String,
      color: String,
      bind: {
        mac: String,
        pid: Number,
        name: String
      }

    }, { _id: false })
  ]
})

const Users = mongoose.model<Uart.UserInfo & mongoose.Document>("users", Schema_Users);
const UserBindDevice = mongoose.model<Uart.BindDevice & mongoose.Document>("User.BindDevice", SchemaUserBindDevice);
const UserAlarmSetup = mongoose.model<Uart.userSetup & mongoose.Document>("user.AlarmSetup", SchemaUserAlarmSetup)
const UserAggregation = mongoose.model<Uart.Aggregation & mongoose.Document>("user.aggregation", SchemaUserAggregation)
const UserLayout = mongoose.model<Uart.userLayout & mongoose.Document>("user.Layout", SchemaUserLayout)
export { Users, UserBindDevice, UserAlarmSetup, UserAggregation, UserLayout };
