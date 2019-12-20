/* eslint-disable no-console */
const { DeviceProtocol, DevsType } = require("../mongoose/DeviceAndProtocol");
const { Terminal } = require("../mongoose/Terminal");
const { NodeClient } = require("../mongoose/node");
const tool = require("./tool");

class Query {
  constructor() {
    // 缓存
    this.CacheProtocol = new Map();
    this.CacheDevsType = new Map();
    this.CacheTerminal = new Map();
    this.CacheNodeTerminal = new Map();
    this.CacheNode = new Map();
  }
  async start() {
    await this.RefreshCacheDevType();
    await this.RefreshCacheProtocol();
    await this.RefreshCacheTerminal();
    await this.RefreshCacheNode();
  }
  async RefreshCacheProtocol() {
    await DeviceProtocol.find().then((res) => {
      console.log(`加载协议缓存......`);
      res.forEach((el) => this.CacheProtocol.set(el.Protocol, el));
    });
  }
  async RefreshCacheDevType() {
    await DevsType.find().then((res) => {
      console.log(`加载设备型号缓存......`);
      res.forEach((el) => this.CacheDevsType.set(el.DevModel, el));
    });
  }
  async RefreshCacheTerminal() {
    await Terminal.find().then((res) => {
      console.log(`加载4g终端缓存......`);
      res.forEach((el) => {
        this.CacheTerminal.set(el.DevMac, el);
        if (this.CacheNodeTerminal.has(el.mountNode))
          this.CacheNodeTerminal.get(el.mountNode).push(el);
        else this.CacheNodeTerminal.set(el.mountNode, [el]);
      });
    });
  }
  async RefreshCacheNode() {
    await NodeClient.find().then((res) => {
      console.log(`加载节点缓存......`);
      res.forEach((el) => this.CacheNode.set(el.IP, el));
    });
  }

  SendQuery({ IP, Name, socket }) {
    if (!IP || (!Name && !socket)) return false;
    Name = Name || this.CacheNode.get(IP).Name;
    // console.log(`检索 ${Name} 登记的设备，依次发生查询指令`);

    const clients = this.CacheNodeTerminal.get(Name);
    for (const { DevMac, mountDevs } of clients) {
      for (const { pid, protocol } of mountDevs) {
        const { Type, instruct } = this.CacheProtocol.get(protocol);
        for (const { name } of instruct) {
          socket.emit("query", {
            mac: DevMac,
            type: Type,
            protocol,
            content: tool.Crc16modbus(pid, name)
          });
        }
      }
    }
  }
}

module.exports = Query;
