const { mongoose, Schema } = require("./index");

// 节点信息
const SchemaNodeClient = new Schema({
  Name: String,
  IP: String,
  Port: Number,
  MaxConnections: Number,
  clients: [String]
});
// 4G终端信息
const SchemaTerminalClient = new Schema({
  DevMac: { type: Number, required: true },
  name: String,
  Jw: String,
  mountDev: { type: String, required: true }, // 模块挂载设备
  protocol: { type: String, required: true }, // 模块挂载协议
  registerDate: { type: Date, default: new Date() }
});
// 终端设备上传数据
const SchemaTerminalClientResult = new Schema({
  mac: { type: Number, required: true },
  data: [Number],
  content: String,
  type: Number,
  time: Date
});

export const NodeClient = mongoose.model("NodeClient", SchemaNodeClient);
export const TerminalClient = mongoose.model(
  "NodeTerminalClient",
  SchemaTerminalClient
);
export const TerminalClientResult = mongoose.model(
  "NodeTerminalClientResult",
  SchemaTerminalClientResult
);
