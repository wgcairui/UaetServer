import { mongoose, Schema } from "./index";

// 节点信息
const SchemaNodeClient = new Schema({
  Name: String,
  IP: String,
  Port: Number,
  MaxConnections: Number
});
// 节点websocket设备
const SchemaWebSocketTerminal = new Schema(
  {
    mac: String,
    port: Number,
    ip: String,
    jw: String,
    mountNode: String
  }
)
// 节点状态流
const SchemaNodeRunInfo = new Schema({
  updateTime: { type: Date, default: new Date().toLocaleString() },
  hostname: String,
  totalmem: String,
  freemem: String,
  loadavg: [Number],
  type: String,
  uptime: String,
  NodeName: String,
  Connections: Number,
  SocketMaps: [SchemaWebSocketTerminal]
});

// 终端设备上传数据=>原始数据
const SchemaTerminalClientResults = new Schema({
  pid: { type: Number, min: 0, max: 255, default: 0 },
  time: Date,
  timeStamp: Number,
  mac: String,
  type: Number,
  protocol: String,
  contents: [
    new Schema(
      {
        content: String,
        buffer: new Schema(
          {
            type: String,
            data: [Number]
          },
          { _id: false }
        ),
      }
    )
  ]
});
// 终端设备上传数据=>解析数据集合
const SchemaTerminalClientResult = new Schema({
  result: [
    new Schema(
      {
        name: String,
        value: String,
        unit: String
      },
      { _id: false }
    )
  ],
  timeStamp: { type: Number, index: true },
  pid: { type: Number, index: true },
  mac: { type: String, index: true }
});
// 终端设备上传数据=>解析数据单例
const SchemaTerminalClientResultSingle = new Schema({
  result: [
    new Schema(
      {
        name: String,
        value: String,
        unit: String
      },
      { _id: false }
    )
  ],
  pid: { type: Number, index: true },
  time: Date,
  mac: { type: String, index: true },
}, { timestamps: true });
export const NodeClient = mongoose.model("NodeClient", SchemaNodeClient);

export const TerminalClientResults = mongoose.model(
  "NodeTerminalClientResults",
  SchemaTerminalClientResults,
  "NodeTerminalClientResults"
);

export const TerminalClientResult = mongoose.model(
  "NodeTerminalClientResult",
  SchemaTerminalClientResult,
  "NodeTerminalClientResult"
);

export const TerminalClientResultSingle = mongoose.model(
  "NodeTerminalClientResultSingle",
  SchemaTerminalClientResultSingle,
  "NodeTerminalClientResultSingle"
);

export const NodeRunInfo = mongoose.model("NodeRunInfo", SchemaNodeRunInfo);

export const WebSocketTerminal = mongoose.model("WebSocketTerminal", SchemaWebSocketTerminal)