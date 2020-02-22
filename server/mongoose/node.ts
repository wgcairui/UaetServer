import { mongoose, Schema } from "./index";

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
      mac: String,
      port: Number,
      ip: String,
      jw: String
    }, { _id: false })
  ]
});

// 终端设备上传数据=>原始数据
const SchemaTerminalClientResults = new Schema({
  stat: String,
  buffer: {
    type: String,
    data: [Number]
  },
  pid: { type: Number, min: 0, max: 255, default: 0 },
  time: Date,
  timeStamp: Number,
  mac: String,
  type: Number,
  protocol: String,
  content: String
});
// 终端设备上传数据=>解析数据集合
const SchemaTerminalClientResult = new Schema({
  result: [
    new Schema({
      name: String,
      value: String,
      unit: String
    }, { _id: false })
  ],
  timeStamp: Number,
  pid: Number,
  mac: String,

});
// 终端设备上传数据=>解析数据单例
const SchemaTerminalClientResultSingle = new Schema({
  result: [
    new Schema({
      name: String,
      value: String,
      unit: String
    }, { _id: false })
  ],
  pid: { type: Number, min: 0, max: 255, default: 0 },
  time: Date,
  mac: String,
  content: String
});
const NodeClient = mongoose.model("NodeClient", SchemaNodeClient);



const TerminalClientResults = mongoose.model(
  "NodeTerminalClientResults",
  SchemaTerminalClientResults,
  "NodeTerminalClientResults"
);

const TerminalClientResult = mongoose.model(
  "NodeTerminalClientResult",
  SchemaTerminalClientResult,
  "NodeTerminalClientResult"
);

const TerminalClientResultSingle = mongoose.model(
  "NodeTerminalClientResultSingle",
  SchemaTerminalClientResultSingle,
  "NodeTerminalClientResultSingle"
);

const NodeRunInfo = mongoose.model("NodeRunInfo", SchemaNodeRunInfo);

export { NodeClient, TerminalClientResult, TerminalClientResults, TerminalClientResultSingle, NodeRunInfo };
