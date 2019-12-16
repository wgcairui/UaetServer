/* 
  设备型号
  {
    设备类型
    设备型号
    设备协议[]
  }
*/
const { mongoose, Schema } = require("./index");

const SchemaDev = new Schema({
  Type: String,
  DevModel: String,
  Protocols: [
    new Schema({
      Type: { type: Number, enum: [485, 232] },
      Protocol: String
    })
  ]
});

const SchemaProtocols = new Schema({
  Type: { type: Number, enum: [485, 232] },
  Protocol: String, // 协议名称
  instruct: [
    new Schema({
      name: String, // 指令名称--GQS
      resultType: { type: String, enum: ["utf8", "hex"] }, // 怎么格式化返回结果
      shift: { type: Boolean, default: false }, // 结果是否需要去除头部符号
      shiftNum: { type: Number, default: 1 },
      pop: { type: Boolean, default: false },
      popNum: { type: Number, default: 1 },
      resize: String,
      formResize: [
        new Schema({
          name: String,
          regx: String,
          bl: Number
        })
      ] // 分割结果 [["power","1-5"，1]]代表第一和第五个字符是结果，倍率为1不修改结果，否则结果×倍率
    })
  ]
});

const DevsType = mongoose.model("DevType", SchemaDev);
const DeviceProtocol = mongoose.model("DeviceProtocol", SchemaProtocols);
module.exports = { DeviceProtocol, DevsType };
