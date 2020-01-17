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
  ProtocolType: { type: String, enum: ["ups", "air", "em", "th"] },
  instruct: [
    new Schema({
      name: String, // 指令名称--GQS
      resultType: {
        type: String,
        enum: ["utf8", "hex", "float", "short", "int"]
      }, // 怎么格式化返回结果
      shift: { type: Boolean, default: false }, // 结果是否需要去除头部符号
      shiftNum: { type: Number, default: 1 }, // 头部去除个数
      pop: { type: Boolean, default: false }, // 结果是否需要去除尾部部符号
      popNum: { type: Number, default: 1 }, // 尾部去除个数
      resize: String,
      formResize: [
        new Schema({
          _id: false,
          name: String,
          enName: String,
          regx: String,
          bl: Number,
          unit: String,
          isState: Boolean
        })
      ] // 分割结果 [["power","1-5"，1]]代表第一和第五个字符是结果，倍率为1不修改结果，否则结果×倍率
    })
  ]
});

const DevsType = mongoose.model("DevType", SchemaDev);
const DeviceProtocol = mongoose.model("DeviceProtocol", SchemaProtocols);
module.exports = { DeviceProtocol, DevsType };
