/* eslint-disable no-console */
import Event from "../event/index";
import Tool from "./tool";
import {
  protocolInstruct,
  queryResult,
  queryResultArgument,
  protocol
} from "../bin/interface";

export default async (R: queryResult) => {
  // 结果集数组
  const IntructResult = R.contents;
  // 协议数组
  const Protocol = Event.Cache.CacheProtocol.get(R.protocol) as protocol;
  // 缓存协议方法
  const InstructMap = new Map(Protocol.instruct.map(el => [el.name, el]));
  // 解析结果
  //console.log(instructMap);
  switch (R.type) {
    // 232一般适用于UPS设备
    case 232:
      {
        R.result = IntructResult.map(el => {
          let data = el.buffer.data;
          let len = data.length;
          // 解析规则
          const instructs = InstructMap.get(el.content) as protocolInstruct;
          // 把buffer转换为utf8字符串并掐头去尾
          const parseStr = Buffer.from(data)
            .toString(
              "utf8",
              instructs.shift ? instructs.shiftNum : 0,
              instructs.pop ? data.length - instructs.popNum : data.length
            )
            .replace(/(#)/g, "")
            .split(" ");
          return instructs.formResize.map(el2 => {
            const [start, len] = (el2.regx?.split("-") as string[]).map(el =>
              parseInt(el)
            );
            return {
              name: el2.name,
              value: parseStr[start - 1],
              unit: el2.unit
            } as queryResultArgument;
          });
        }).flat();
      }
      // console.log(result);
      break;

    case 485:
      {
        //console.log({ R });
        if (/(^HX.*)/.test(R.protocol)) {
          R.result = IntructResult.filter(el => el.buffer.data[0] === 85)
            .map(el => {
              // 取出请求指令部分,后期做成缓存
              const instruct = el.content.slice(4, el.content.length - 2);
              console.log({instruct,InstructMap});
              
              // 解析规则
              const instructs = InstructMap.get(instruct) as protocolInstruct;
              const buf = Buffer.from(
                el.buffer.data.slice(2, el.buffer.data.length - 1)
              );
              // 迭代指令解析规则,解析结果集返回
              return instructs.formResize.map(el2 => {
                // 申明结果
                let value = 0;
                // 每个数据的结果地址
                const [start, len] = (el2.regx?.split(
                  "-"
                ) as string[]).map(el2 => parseInt(el2));
                switch (instructs.resultType) {
                  // 处理整形
                  case "HX":
                    value = parseFloat(
                      (buf.readIntBE(start, len) * el2.bl).toFixed(1)
                    );
                    break;
                }
                //
                console.log({ name: el2.name, value, unit: el2.unit });
                return { name: el2.name, value, unit: el2.unit };
              });
            })
            .flat();
        } else {
          // 迭代结果集
          // 比较查询和结果的功能码是否一致
          R.result = IntructResult.filter(
            el => el.buffer.data[1] === parseInt(el.content.slice(2, 4))
          )
            .map(el => {
              // 取出请求指令部分,后期做成缓存
              const instruct = el.content.slice(2, 12);
              // 解析规则
              const instructs = InstructMap.get(instruct) as protocolInstruct;
              // 取出返回值部分,转换为buffer,最前面留出一位,为采样留出
              const bufSize = el.buffer.data[2];
              // 检查数据实际长度是否对应
              //if (bufSize + 5 === el.buffer.data.length) return
              const buf = Buffer.from(el.buffer.data.slice(2, bufSize + 3));
              // 迭代指令解析规则,解析结果集返回
              return instructs.formResize.map(el2 => {
                // 申明结果
                let value = 0;
                // 每个数据的结果地址
                const [start, len] = (el2.regx?.split(
                  "-"
                ) as string[]).map(el2 => parseInt(el2));
                if (start + len > buf.byteLength) {
                  /* console.log({
                    const: el.content,
                    msg: JSON.stringify(el2) + 'buf长度超出',
                    buf
                  }); */
                  return { name: el2.name, value, unit: "bufLow" };
                }
                switch (instructs.resultType) {
                  // 处理整形
                  case "HX":
                    break;
                  case "hex":
                  case "short":
                    // 转换为带一位小数点的浮点数
                    value = parseFloat(
                      (buf.readIntBE(start, len) * el2.bl).toFixed(1)
                    ); //parseFloat((valBuf.readInt16BE(0) * el2.bl).toFixed(1));
                    break;
                  // 处理单精度浮点数
                  case "float":
                    value = Tool.HexToSingle(buf.slice(start, start + len)); //Tool.BufferToFlot(buf, start)
                    break;
                }
                //
                // console.log({ name: el2.name, value, unit: el2.unit });
                return { name: el2.name, value, unit: el2.unit };
              });
            })
            .flat();
        }
      }
      break;
  }
  return R;
};
