/* eslint-disable no-console */
import Event from "../event/index";
import Tool from "../bin/tool";
import { TerminalClientResult, TerminalClientResults } from "../mongoose/node";
import { protocol, protocolInstruct, queryResult } from "./interface";

export default (data: queryResult) => {
  const { buffer, protocol, content, type, stat } = data;
  if (stat === "timeOut") return data;
  const Protocol = <protocol>Event.Query.CacheProtocol.get(protocol);
  const instruct = <protocolInstruct>(
    Protocol.instruct.find((el) => content.includes(el.name))
  );
  switch (type) {
    case 232:
      break;

    case 485:
      {
        const buf = Buffer.from(buffer.data.slice(3, 3 + buffer.data[2]));
        const { formResize, resultType } = instruct;
        data.pid = buf.slice(0, 1).readUInt8(0);
        data.result = formResize.map((el) => {
          const { name, bl, unit, regx } = el;

          const [start, len] = String(regx).split("-");
          let valBuf = buf.slice(
            parseInt(start) - 1,
            parseInt(start) - 1 + parseInt(len)
          );

          let value: number = 0;
          try {
            switch (resultType) {
              case "hex":
              case "short":
                value = parseFloat((valBuf.readInt16BE(0) * bl).toFixed(1));

                break;
              case "float":
                value = Tool.HexToSingle(valBuf);
                break;
            }
          } catch (error) {
            console.log(error.message);
          }
          return { name, value, unit };
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
