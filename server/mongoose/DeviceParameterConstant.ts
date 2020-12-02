import { Schema, mongoose } from "./index";

// 各个类型设备的常量
const Constant = new Schema(
  {
    // air
    //热通道温度
    HeatChannelTemperature: String,
    HeatChannelHumidity: String,
    //冷通道湿度
    ColdChannelTemperature: String,
    ColdChannelHumidity: String,
    //制冷温度
    RefrigerationTemperature: String,
    RefrigerationHumidity: String,
    // 风速
    Speed: String,
    //制热模式
    /* HeatModel: String,
    ColdModel: String,
    //除湿
    Dehumidification: String,
    // 加湿
    Humidification: String, */

    //th
    Temperature: String,
    Humidity: String,
    // ups
    WorkMode: String,
    UpsStat: [String],
    BettyStat: [String],
    InputStat: [String],
    OutStat: [String],
    // EM

    // IO
    di: [String],
    do: [String]
  },
  { _id: false }
);

// 告警阈值约束
const Threshold = new Schema({
  name: String,
  min: Number,
  max: Number
}, { _id: false })

// 协议对应操作指令
const OprateInstruct = new Schema({
  name: String,
  value: String,
  bl: { type: String, default: '1' },
  readme: String,
  tag: String
}, { _id: false })

// 设备告警状态约束
const AlarmStat = new Schema({
  name: String,
  value: String,
  unit: String,
  alarmStat: [String]
}, { _id: false })

// 协议对应的约束配置
export const Schema_DevConstant = new Schema({
  Protocol: String,
  ProtocolType: String,
  Constant: Constant,
  Threshold: [Threshold],
  AlarmStat: [AlarmStat],
  ShowTag: [String],
  OprateInstruct: [OprateInstruct]
});

const alias = new Schema({
  name: String,
  alias: String
}, { _id: false })
// 相同设备下的参数字段别名
const Schema_DevArgumentAlias = new Schema({
  mac: String,
  pid: Number,
  protocol: String,
  alias: [alias]
})
const DevConstant = mongoose.model(
  "DevConstant",
  Schema_DevConstant,
  "DevConstant"
);

const DevArgumentAlias = mongoose.model('DevArgumentAlia', Schema_DevArgumentAlias)
export { DevConstant, DevArgumentAlias }
