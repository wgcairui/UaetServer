/* eslint-disable no-console */
const Event = require("../event/index");
const Tool = require("../bin/tool");
const {
  TerminalClientResult,
  TerminalClientResults
} = require("../mongoose/node");

const pares = (data) => {
  const { buffer, protocol, content, type, stat } = data;
  if (stat === "timeOut") return data;
  const Protocol = Event.Query.CacheProtocol.get(protocol);
  if (!Protocol || !Protocol.instruct) return "error";
  const instruct = Protocol.instruct.find((el) => content.includes(el.name));
  switch (type) {
    case 232:
      break;

    case 485:
      {
        const buf = Buffer.from(buffer.data.slice(3, 3 + buffer.data[2]));
        const { formResize, resultType } = instruct;
        data.pid = buf.slice(0, 1).readUInt8();
        data.result = formResize.map(({ name, regx, bl, unit }) => {
          const [start, len] = regx.split("-");
          let valBuf = buf.slice(start - 1, start - 1 + len);
          try {
            switch (resultType) {
              case "hex":
              case "short":
                valBuf = Number.parseFloat(
                  (valBuf.readInt16BE() * bl).toFixed(1)
                );
                break;
              case "float":
                valBuf = Tool.HexToSingle(valBuf);
                break;
            }
          } catch (error) {
            console.log(error.message);
          }
          return { name, value: valBuf, unit };
        });
      }
      break;
  }
  // 透传结果集保存到数据集，所有数据
  new TerminalClientResults(data).save();
  // 透传结果集保存到数据集，最新数据
  TerminalClientResult.updateOne(
    { mac: data.mac, pid: data.pid, content: data.content },
    { $set: { ...data } },
    { upsert: true }
  ).catch((e) => console.log(e));
  return data;
};

module.exports = pares;
