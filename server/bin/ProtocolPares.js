const Event = require("../event/index");
const Tool = require("../bin/tool");
const { TerminalClientResult } = require("../mongoose/node");

const pares = (data) => {
  const { buffer, protocol, content, type } = data;
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
        data.result = formResize.map(({ name, regx, bl }) => {
          const [start, len] = regx.split("-");
          let valBuf = buf.slice(start - 1, start - 1 + len);
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
          return { name, value: valBuf };
        });
      }
      break;
  }
  new TerminalClientResult(data).save();
  return data;
};

module.exports = pares;
