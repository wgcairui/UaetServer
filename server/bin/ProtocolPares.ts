/* eslint-disable no-console */
import Event from "../event/index";
import Tool from "../bin/tool";
import { TerminalClientResult, TerminalClientResults, TerminalClientResultSingle } from "../mongoose/node";
import { protocolInstruct, queryResult } from "./interface";

export default (data: queryResult) => {
  // 保存查询结果的原始数据
  new TerminalClientResults(data).save().catch(e => console.log(e))
  //
  let result: { name: string; value: number; unit: string | null; }[] = []
  const { buffer, protocol, content, type, stat, timeStamp, mac, pid, time } = data;
  if (stat === "timeOut") return data;
  const instruct =
    <protocolInstruct>Event.Query.CacheProtocol.get(protocol)?.instruct.find((el) => content.includes(el.name))

  switch (type) {
    case 232:
      break;

    case 485:
      {
        const buf = Buffer.from(buffer.data.slice(3, 3 + buffer.data[2]));
        const { formResize, resultType } = instruct;
        //遍历解析协议，转换结果里面的值
        result = formResize.map((el) => {
          //单个数据的限定首尾
          const [start, len] = el.regx?.split("-") as string[]
          let valBuf = buf.slice(
            parseInt(start) - 1,
            parseInt(start) - 1 + parseInt(len)
          );

          let value: number = 0;
          let bl = el.bl
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
          return { name: el.name, value, unit: el.unit };
        });
      }
      break;
  }

  // 透传结果集保存到数据集，最新数据

  //保存数据到结果单例
  TerminalClientResultSingle.updateOne({ mac, pid, content }, { $set: { result, time } }, { upsert: true }).catch((e) => console.log(e));
  //保存数据到结果集合
  TerminalClientResult.updateOne(
    { mac, pid, timeStamp },
    { $addToSet: { result: { $each: result } } },
    { upsert: true }
  ).catch((e) => console.log(e));


  return result;
};
