"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("./index");
// 节点信息
const SchemaNodeClient = new index_1.Schema({
    Name: String,
    IP: String,
    Port: Number,
    MaxConnections: Number
});
// 节点状态流
const SchemaNodeRunInfo = new index_1.Schema({
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
        new index_1.Schema({
            _id: { type: Boolean, default: false },
            mac: String,
            port: Number,
            ip: String,
            jw: String
        })
    ]
});
// 终端设备上传数据
const SchemaTerminalClientResult = new index_1.Schema({
    stat: String,
    buffer: new index_1.Schema({
        _id: { type: Boolean, default: false },
        type: String,
        data: [Number]
    }),
    result: [
        new index_1.Schema({
            _id: { type: Boolean, default: false },
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
const NodeClient = index_1.mongoose.model("NodeClient", SchemaNodeClient);
exports.NodeClient = NodeClient;
const TerminalClientResult = index_1.mongoose.model("NodeTerminalClientResult", SchemaTerminalClientResult, "NodeTerminalClientResult");
exports.TerminalClientResult = TerminalClientResult;
const TerminalClientResults = index_1.mongoose.model("NodeTerminalClientResults", SchemaTerminalClientResult, "NodeTerminalClientResults");
exports.TerminalClientResults = TerminalClientResults;
const NodeRunInfo = index_1.mongoose.model("NodeRunInfo", SchemaNodeRunInfo);
exports.NodeRunInfo = NodeRunInfo;
