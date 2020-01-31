"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable no-console */
const index_1 = __importDefault(require("../event/index"));
const tool_1 = __importDefault(require("../bin/tool"));
const node_1 = require("../mongoose/node");
exports.default = (data) => {
    const { buffer, protocol, content, type, stat } = data;
    if (stat === "timeOut")
        return data;
    const Protocol = index_1.default.Query.CacheProtocol.get(protocol);
    const instruct = (Protocol.instruct.find((el) => content.includes(el.name)));
    switch (type) {
        case 232:
            break;
        case 485:
            {
                const buf = Buffer.from(buffer.data.slice(3, 3 + buffer.data[2]));
                const { formResize, resultType } = instruct;
                data.pid = buf.slice(0, 1).readUInt8(0);
                data.result = formResize.map(({ name, regx, bl, unit }) => {
                    const [start, len] = regx.split("-");
                    let valBuf = buf.slice(parseInt(start) - 1, parseInt(start) - 1 + parseInt(len));
                    let value = 0;
                    try {
                        switch (resultType) {
                            case "hex":
                            case "short":
                                value = parseFloat((valBuf.readInt16BE(0) * bl).toFixed(1));
                                break;
                            case "float":
                                value = tool_1.default.HexToSingle(valBuf);
                                break;
                        }
                    }
                    catch (error) {
                        console.log(error.message);
                    }
                    return { name, value, unit };
                });
            }
            break;
    }
    // 透传结果集保存到数据集，所有数据
    new node_1.TerminalClientResults(data).save();
    // 透传结果集保存到数据集，最新数据
    node_1.TerminalClientResult.updateOne({ mac: data.mac, pid: data.pid, content: data.content }, { $set: { ...data } }, { upsert: true }).catch((e) => console.log(e));
    return data;
};
