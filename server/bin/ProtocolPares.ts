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
  // 结果集数组
  const IntructResult = R.contents
  // 协议数组
  const Instructs = Event.Cache.CacheProtocol.get(R.protocol)?.instruct as protocolInstruct[]
  // 缓存协议方法
  const InstructMap = new Map(Instructs.map(el => [el.name, el]))
  // 解析结果
  let result: queryResultArgument[] = []
  //console.log(instructMap);
  switch (R.type) {
    case 232:
      break;

    case 485:
      {
        // 迭代结果集
        // 比较查询和结果的功能码是否一致
        result = IntructResult.filter(el => el.buffer.data[1] === parseInt(el.content.slice(2, 4))
        )
          .map(el => {
            // 取出请求指令部分,后期做成缓存
            const instruct = el.content.slice(2, 12)
            // 解析规则
            const instructs = InstructMap.get(instruct) as protocolInstruct;
            // 取出返回值部分,转换为buffer,最前面留出一位,为采样留出
            const bufSize = el.buffer.data[2]
            // 检查数据实际长度是否对应
            if (bufSize + 5 === el.buffer.data.length) return
            const buf = Buffer.from(el.buffer.data.slice(2, bufSize + 3));
            // 迭代指令解析规则,解析结果集返回
            return instructs.formResize.map(el => {
              // 申明结果
              let value = 0
              // 每个数据的结果地址
              const [start, len] = (el.regx?.split("-") as string[]).map(el => parseInt(el));
              const end = start + len
              // 如果地址超出buf,跳过解析,避免访问边界外内存
              if (end < bufSize + 2) {
                const valBuf = buf.slice(start, end);
                // 检查数据解析类型,赋值结果
                switch (instructs.resultType) {
                  case "hex":
                  case "short":
                    value = parseFloat((valBuf.readInt16BE(0) * el.bl).toFixed(1));
                    break;
                  case "float":
                    value = Tool.HexToSingle(valBuf);
                    break;
                }
              } else {
                console.log(`${el.name} 数据地址超出buf`);
                console.log(buf);
                console.log({ end, bufSize });


              }
              //
              return { name: el.name, value, unit: el.unit };
            })

          }).flat()
      }
      break;
  }

  // 透传结果集保存到数据集，最新数据

  //保存数据到结果单例
  await TerminalClientResultSingle.updateOne(
    { mac: R.mac, pid: R.pid },
    { $set: { result, time: R.timeStamp } },
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
