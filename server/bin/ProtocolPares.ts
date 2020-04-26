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
    // 232一般适用于UPS设备
    case 232:
      {
        result = IntructResult.map(el => {
          let data = el.buffer.data
          let len = data.length
          // 解析规则
          const instructs = InstructMap.get(el.content) as protocolInstruct;
          // 把buffer转换为utf8字符串并掐头去尾
          const parseStr = Buffer.from(data)
            .toString('utf8', instructs.shift ? instructs.shiftNum : 0, instructs.pop ? data.length - instructs.popNum : data.length)
            .split(' ')
          return instructs.formResize.map(el2 => {
            const [start, len] = (el2.regx?.split("-") as string[]).map(el => parseInt(el));
            return { name: el2.name, value: parseStr[start], unit: el2.unit } as queryResultArgument
          })
        }).flat()
      }
      break;

    case 485:
      {
        // 迭代结果集
        // 比较查询和结果的功能码是否一致
        result = IntructResult.filter(el => el.buffer.data[1] === parseInt(el.content.slice(2, 4)))
          .map(el => {
            // 取出请求指令部分,后期做成缓存
            const instruct = el.content.slice(2, 12)
            // 解析规则
            const instructs = InstructMap.get(instruct) as protocolInstruct;
            // 取出返回值部分,转换为buffer,最前面留出一位,为采样留出
            const bufSize = el.buffer.data[2]
            // 检查数据实际长度是否对应
            //if (bufSize + 5 === el.buffer.data.length) return
            const buf = Buffer.from(el.buffer.data.slice(2, bufSize + 3));
            // 迭代指令解析规则,解析结果集返回
            return instructs.formResize.map(el => {
              // 申明结果
              let value = 0
              // 每个数据的结果地址
              const [start, len] = (el.regx?.split("-") as string[]).map(el => parseInt(el));
              switch (instructs.resultType) {
                // 处理整形
                case "hex":
                case "short":
                  value = buf.readIntBE(start, len) * el.bl//parseFloat((valBuf.readInt16BE(0) * el.bl).toFixed(1));
                  break;
                // 处理单精度浮点数
                case "float":
                  value = Tool.BufferToFlot(buf, start)
                  break;
              }
              //
              //console.log({ name: el.name, value, unit: el.unit });
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
  return result;
};
