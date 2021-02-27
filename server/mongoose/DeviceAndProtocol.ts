/* 
  设备型号
  {
    设备类型
    设备型号
    设备协议[]
  }
*/
import { mongoose, Schema } from "./index";
/**
 * 设备信息
 */
const SchemaDev = new Schema({
  Type: String,
  DevModel: String,
  Protocols: [
    new Schema(
      {
        Type: { type: Number, enum: [485, 232] },
        Protocol: String
      },
      { _id: false }
    )
  ]
});

/**
 * 协议信息
 */
const SchemaProtocols = new Schema({
  Type: { type: Number, enum: [485, 232] },
  Protocol: String, // 协议名称
  ProtocolType: { type: String, enum: ["ups", "air", "em", "th", "io"] },
  instruct: [
    new Schema(
      {
        name: String, // 指令名称--GQS
        isUse: {
          type: Boolean,
          default: true
        },
        isSplit: {
          type: Boolean,
          default: true
        },
        // 非标协议
        noStandard: Boolean,
        // 前处理脚本
        scriptStart: String,
        // 后处理脚本
        scriptEnd: String,
        resultType: {
          type: String,
          enum: ["utf8", "hex", "float", "short", "int", "HX", 'bit2']
        }, // 怎么格式化返回结果
        shift: { type: Boolean, default: false }, // 结果是否需要去除头部符号
        shiftNum: { type: Number, default: 1 }, // 头部去除个数
        pop: { type: Boolean, default: false }, // 结果是否需要去除尾部部符号
        popNum: { type: Number, default: 1 }, // 尾部去除个数
        resize: String,
        formResize: [
          new Schema(
            {
              name: String,
              enName: String,
              regx: String,
              bl: String,
              unit: String,
              isState: Boolean
            },
            { _id: false }
          )
        ] // 分割结果 [["power","1-5"，1]]代表第一和第五个字符是结果，倍率为1不修改结果，否则结果×倍率
      },
      { _id: false }
    )
  ]
});

const DevsType = mongoose.model("Device.Type", SchemaDev);
const DeviceProtocol = mongoose.model("Device.Protocol", SchemaProtocols);
export { DeviceProtocol, DevsType };
