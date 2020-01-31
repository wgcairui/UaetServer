"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable no-unused-vars */
/* eslint-disable no-console */
const node_1 = require("../mongoose/node");
const ProtocolPares_1 = __importDefault(require("../bin/ProtocolPares"));
exports.default = async (ctx) => {
    const type = ctx.params.type;
    const body = ctx.request.body;
    switch (type) {
        // 透传设备数据上传接口
        case "UartData":
            {
                const { data } = body;
                // eslint-disable-next-line require-await
                data.forEach(async (el) => ProtocolPares_1.default(el));
            }
            break;
        // 透传运行数据上传接口
        case "RunData":
            {
                const { NodeInfo, TcpServer } = body;
                console.log({ ...TcpServer });
                node_1.NodeRunInfo.updateOne({ NodeName: TcpServer.NodeName }, { $set: { ...TcpServer, ...NodeInfo } }, { upsert: true })
                    .then((res) => console.log(res))
                    .catch((e) => console.log(e));
            }
            break;
        default:
            break;
    }
};
