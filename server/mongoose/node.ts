import { mongoose, Schema } from "./index";

// 节点信息
const SchemaNodeClient = new Schema({
  Name: String,
  IP: String,
  Port: Number,
  MaxConnections: Number
})
// 节点websocket设备
const SchemaWebSocketTerminal = new Schema(
  {
    mac: String,
    port: Number,
    ip: String,
    jw: String,

    uart: String,
    AT: Boolean,
    ICCID: String,
    connecting: Boolean,
    lock: Boolean,
    PID: String,
    ver: String,
    Gver: String,
    iotStat: String,
  }
)
// 节点状态流
const SchemaNodeRunInfo = new Schema({
  updateTime: { type: String, default: new Date().toLocaleString() },
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
  time: String,
  timeStamp: { type: Number, index: true },
  mac: String,
  type: Number,
  protocol: String,
  Interval: Number,
  useTime: Number,
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
      },
      { _id: false }
    )
  ],
  // 是否包含告警记录
  hasAlarm: {
    index: true,
    type: Number,
    default: 0
  }
});
// 终端设备上传数据=>解析数据集合
const SchemaTerminalClientResult = new Schema({
  result: [
    new Schema(
      {
        name: {
          type: String,
          index: true
        },
        value: String,
        parseValue: String,
        unit: String,
        alarm: {
          type: Boolean,
          default: false
        }
      },
      { _id: false }
    )
  ],
  timeStamp: { type: Number, index: true },
  pid: { type: Number, index: true },
  mac: { type: String, index: true },
  Interval: Number,
  useTime: Number,
  parentId: String,
  // 是否包含告警记录
  hasAlarm: {
    index: true,
    type: Number,
    default: 0
  }
});
// 终端设备上传数据=>解析数据单例
const SchemaTerminalClientResultSingle = new Schema({
  result: [
    new Schema(
      {
        name: {
          type: String,
          index: true
        },
        value: String,
        parseValue: String,
        unit: String,
        alarm: {
          type: Boolean,
          default: false
        },
        issimulate: {
          type: Boolean,
          default: false
        }
      },
      { _id: false }
    )
  ],
  pid: { type: Number, index: true },
  time: String,
  mac: { type: String, index: true },
  Interval: Number,
  useTime: Number,
  parentId: String
}, { timestamps: true });
const NodeClient = mongoose.model<Uart.NodeClient & mongoose.Document>("Node.Client", SchemaNodeClient)

const TerminalClientResults = mongoose.model<Uart.queryResult & mongoose.Document>(
  "Client.Result",
  SchemaTerminalClientResults,
);

const TerminalClientResult = mongoose.model<Uart.queryResultSave & mongoose.Document>(
  "Client.ResultColltion",
  SchemaTerminalClientResult,
);

const TerminalClientResultSingle = mongoose.model<Uart.queryResult & mongoose.Document>(
  "Client.ResultSingle",
  SchemaTerminalClientResultSingle,
);

const NodeRunInfo = mongoose.model<Uart.nodeInfo & mongoose.Document>("Node.RunInfo", SchemaNodeRunInfo);

const WebSocketTerminal = mongoose.model<Uart.WebSocketInfo & mongoose.Document>("Terminal.WebSocketinfo", SchemaWebSocketTerminal)

export { WebSocketTerminal, NodeClient, TerminalClientResults, TerminalClientResult, TerminalClientResultSingle, NodeRunInfo }