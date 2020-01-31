"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*
  设备型号
  {
    设备类型
    设备型号
    设备协议[]
  }
*/
const index_1 = require("./index");
const SchemaDev = new index_1.Schema({
    Type: String,
    DevModel: String,
    Protocols: [
        new index_1.Schema({
            Type: { type: Number, enum: [485, 232] },
            Protocol: String
        })
    ]
});
const SchemaProtocols = new index_1.Schema({
    Type: { type: Number, enum: [485, 232] },
    Protocol: String,
    ProtocolType: { type: String, enum: ["ups", "air", "em", "th"] },
    instruct: [
        new index_1.Schema({
            name: String,
            resultType: {
                type: String,
                enum: ["utf8", "hex", "float", "short", "int"]
            },
            shift: { type: Boolean, default: false },
            shiftNum: { type: Number, default: 1 },
            pop: { type: Boolean, default: false },
            popNum: { type: Number, default: 1 },
            resize: String,
            formResize: [
                new index_1.Schema({
                    _id: { type: Boolean, default: false },
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
const DevsType = index_1.mongoose.model("DevType", SchemaDev);
exports.DevsType = DevsType;
const DeviceProtocol = index_1.mongoose.model("DeviceProtocol", SchemaProtocols);
exports.DeviceProtocol = DeviceProtocol;
