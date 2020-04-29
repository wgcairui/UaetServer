import { Schema, mongoose } from "./index";

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
    HeatModel: String,
    ColdModel: String,
    //除湿
    Dehumidification: String,
    // 加湿
    Humidification: String,

    //th
    Temperature: String,
    Humidity: String,
    // ups
    UPSModels: String,
    BatteryTemperature: String,
    ResidualCapacity: String,
    BatteryVoltage: String,
    OutputFrequency: String,
    OutputLoad: String
    // EM
  },
  { _id: false }
);

const Threshold = new Schema({
  name: String,
  min: Number,
  max: Number
}, { _id: false })

const OprateInstruct = new Schema({
  name: String,
  value: String,
  readme: String
}, { _id: false })

const Schema_DevConstant = new Schema({
  Protocol: String,
  ProtocolType: String,
  Constant: Constant,
  Threshold: [Threshold],
  ShowTag: [String],
  OprateInstruct: [OprateInstruct]
});

export const DevConstant = mongoose.model(
  "DevConstant",
  Schema_DevConstant,
  "DevConstant"
);
