const { mongoose, Schema } = require("./index");

// 节点信息
const SchemaNodeClient = new Schema({
  Name: String,
  IP: String,
  Port: Number,
  MaxConnections: Number,
  clients: [String]
});
// 节点状态流
const SchemaNodeRunInfo = new Schema({
  hostname: String,
  totalmem: String,
  freemem: String,
  loadavg: String,
  type: String,
  uptime: Date
});

// 4G终端信息
const SchemaTerminalClient = new Schema({
  DevMac: { type: Number, required: true },
  name: String,
  Jw: String,
  mountNode: String,
  mountDevs: [
    new Schema({
      mountDev: { type: String, required: true }, // 模块挂载设备
      protocol: { type: String, required: true }, // 模块挂载协议
      registerDate: { type: Date, default: new Date() }
    })
  ]
});
// 终端设备上传数据
const SchemaTerminalClientResult = new Schema({
  mac: { type: Number, required: true },
  data: [Number],
  content: String,
  type: Number,
  time: Date
});

const NodeClient = mongoose.model("NodeClient", SchemaNodeClient);
const TerminalClient = mongoose.model(
  "NodeTerminalClient",
  SchemaTerminalClient
);
const TerminalClientResult = mongoose.model(
  "NodeTerminalClientResult",
  SchemaTerminalClientResult
);
const NodeRunInfo = mongoose.model("NodeRunInfo", SchemaNodeRunInfo);

module.exports = {
  NodeClient,
  TerminalClient,
  TerminalClientResult,
  NodeRunInfo
};
