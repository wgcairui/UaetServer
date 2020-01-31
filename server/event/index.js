"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = __importDefault(require("events"));
const config_1 = __importDefault(require("../config"));
const Query_1 = __importDefault(require("../bin/Query"));
const node_1 = require("../mongoose/node");
class Event extends events_1.default {
    constructor() {
        super();
        // 事件常量
        this.env = {
            addNodeClient: "addNodeClient",
            disNodeClient: "disNodeClient",
            connectNodeClient: "connectNodeClient"
        };
        //
        this.Query = new Query_1.default();
        // 节点IP->socketID
        this.nodeIPSocketIDMaps = new Map();
        // 节点登记信息
        this.nodeRegisterInfo = new Map();
        // 主查询hash
        this.QueryNode = new Map();
        this.start();
    }
    async start() {
        //
        await this.Query.start();
        // 挂载监听
        // 初始化数据填充
        this.on(this.env.addNodeClient, this.addNodeClient)
            .on(this.env.connectNodeClient, this._connectNodeClient)
            .on(this.env.disNodeClient, this._disNodeClient)
            .emit(this.env.addNodeClient);
    }
    attach(app) {
        app.context.$Event = this;
    }
    _connectNodeClient({ IP, socket, data }) {
        this.nodeIPSocketIDMaps.set(IP, socket.id);
        const registerInfo = this.nodeRegisterInfo.get(IP);
        socket.emit("registerSuccess", registerInfo);
        this.QueryNode.set(IP, setInterval(() => {
            this.Query.SendQuery({ IP, socket });
        }, config_1.default.runArg.Query.Inteltime));
    }
    _disNodeClient({ IP }) {
        // this.nodeIPSocketIDMaps.set(IP,null);
        clearInterval(this.QueryNode.get(IP));
        // this.QueryNode.delete(IP);
    }
    async addNodeClient(ip) {
        const node = await node_1.NodeClient.find().lean();
        if (this.nodeIPSocketIDMaps.size === 0) {
            node.forEach((el) => {
                this.nodeIPSocketIDMaps.set(el.IP, "");
                this.nodeRegisterInfo.set(el.IP, el);
            });
            return;
        }
        node
            .filter((el) => el.IP === ip)
            .forEach((el) => {
            this.nodeIPSocketIDMaps.set(el.IP, "");
            this.nodeRegisterInfo.set(el.IP, el);
        });
    }
}
exports.default = new Event();
