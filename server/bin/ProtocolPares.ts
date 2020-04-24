/* eslint-disable no-console */
import Event from "../event/index";
import Tool from "../bin/tool";
import {
  TerminalClientResult,
  TerminalClientResults,
  TerminalClientResultSingle
} from "../mongoose/node";
import { protocolInstruct, queryResult, queryResultArgument } from "./interface";

export default async (R: queryResult) => {
  // 保存查询结果的原始数据
  new TerminalClientResults(R).save().catch(e => console.log(e));
  //
  const IntructResult = R.contents
  const instructs = Event.Cache.CacheProtocol.get(R.protocol)?.instruct as protocolInstruct[]
  const instructMap = new Map(instructs.map(el => [el.name, el]))
  let result: queryResultArgument[] = []
  //console.log(instructMap);
  switch (R.type) {
    case 232:
      break;

    case 485:
      {
        result = IntructResult.map(el => {
          const buf = Buffer.from(el.buffer.data.slice(3, 3 + el.buffer.data[2]));
          const { formResize, resultType } = instructMap.get(el.content.slice(2, 12)) as protocolInstruct;
          //遍历解析协议，转换结果里面的值
          return formResize.map(el => {
            //单个数据的限定首尾
            const [start, len] = el.regx?.split("-") as string[];
            let valBuf = buf.slice(
              parseInt(start) - 1,
              parseInt(start) - 1 + parseInt(len)
            );

            let value: number = 0;
            let bl = el.bl;
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
        }).flat()
      }
      break;
  }

  // 透传结果集保存到数据集，最新数据

  //保存数据到结果单例
  await TerminalClientResultSingle.updateOne(
    { mac: R.mac, pid: R.pid },
    { $set: { result, time: R.time } },
    { upsert: true }
  )
    // .then(el => console.log("TerminalClientResultSingle"))
    .catch(e => console.log(e));
  //保存数据到结果集合
  await new TerminalClientResult({
    mac: R.mac, pid: R.pid, result, timeStamp: R.timeStamp
  }).save()
    // .then(el => console.log("TerminalClientResult"))
    .catch(e => console.log(e));
  //return result;
};
