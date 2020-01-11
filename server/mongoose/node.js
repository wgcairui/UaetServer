const { mongoose, Schema } = require("./index");

// 节点信息
const SchemaNodeClient = new Schema({
  Name: String,
  IP: String,
  Port: Number,
  MaxConnections: Number
});
// 节点状态流
const SchemaNodeRunInfo = new Schema({
  updateTime: { type: Date, default: new Date() },
  hostname: String,
  totalmem: String,
  freemem: String,
  loadavg: [Number],
  type: String,
  uptime: String,
  NodeName: String,
  Connections: Number,
  SocketMaps: [
    new Schema({
      _id: false,
      mac: String,
      port: Number,
      ip: String,
      jw: String
    })
  ]
});

// 终端设备上传数据
const SchemaTerminalClientResult = new Schema({
  stat: String,
  buffer: new Schema({
    _id: false,
    type: String,
    data: [Number]
  }),
  result: [
    new Schema({
      _id: false,
      name: String,
      value: String,
      unit: String
    })
  ],
  pid: { type: Number, min: 0, max: 255, default: 0 },
  time: Date,
  mac: String,
  type: Number,
  protocol: String,
  content: String
});

const NodeClient = mongoose.model("NodeClient", SchemaNodeClient);

const TerminalClientResult = mongoose.model(
  "NodeTerminalClientResult",
  SchemaTerminalClientResult,
  "NodeTerminalClientResult"
);

const TerminalClientResults = mongoose.model(
  "NodeTerminalClientResults",
  SchemaTerminalClientResult,
  "NodeTerminalClientResults"
);

const NodeRunInfo = mongoose.model("NodeRunInfo", SchemaNodeRunInfo);

module.exports = {
  NodeClient,
  TerminalClientResult,
  TerminalClientResults,
  NodeRunInfo
};
