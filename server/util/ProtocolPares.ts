import Event from "../event/index";
import Tool from "./tool";
import { protocolInstruct, queryResult, queryResultArgument, protocol } from "uart";
import CacheParseRegx from "../util/regxCache"
import { ParseFunctionEnd } from "./func";

export default async (R: queryResult) => {
  // 检查请求指令和返回结果是否数目一致,不一致则发送数据数据查询间隔过短事件
  // if (R.content.length !== R.contents.length) Event.Emit("QueryIntervalLow", R)
  // 保存查询的查询时间，间隔10min重新计算查询间隔
  Event.Cache.QueryTerminaluseTime.get(R.mac + R.pid)?.push(R.useTime);
  // 协议数组
  const Protocol = Event.Cache.CacheProtocol.get(R.protocol) as protocol;
  // 缓存协议方法
  const InstructMap = new Map(Protocol.instruct.map(el => [el.name, el]));
  // 结果集数组
  const IntructResult = R.contents;
  // 解析结果
  switch (R.type) {
    // 232一般适用于UPS设备
    case 232:
      {
        R.result = IntructResult.filter(el => InstructMap.has(el.content)) // 刷选出指令正确的查询，避免出错
          .map(el => {
            // 解析规则
            const instructs = InstructMap.get(el.content) as protocolInstruct;
            // 把buffer转换为utf8字符串并掐头去尾
            const parseStr = Buffer.from(el.buffer)
              .toString("utf8", instructs.shift ? instructs.shiftNum : 0, instructs.pop ? el.buffer.data.length - instructs.popNum : el.buffer.data.length)
              .replace(/(#)/g, "")
              // 如果是utf8,分隔符为' '
              .split(instructs.isSplit ? " " : "");
            // console.log({ cont:el.content,parseStr, parseStrlen: parseStr.length, ins: instructs.formResize.length });
            return instructs.formResize.map<queryResultArgument>(el2 => {
              const [start] = CacheParseRegx(el2.regx as string)
              return { name: el2.name, value: parseStr[start - 1], unit: el2.unit }
            });
          })
          .flat()
      }
      break;
    // 适用于modbus协议
    case 485:
      {
        const ResultFilter = IntructResult.filter(el => {
          const instructName = Event.Cache.CacheInstructContents.get(el.content) || '' //0300010002
          const protocolInstruct = InstructMap.get(instructName)
          // 指令是此协议中的
          if (protocolInstruct) {
            // 如果是非标协议且含有后处理脚本，由脚本校验结果buffer
            if (protocolInstruct.noStandard && protocolInstruct.scriptEnd) {
              const Fun = ParseFunctionEnd(protocolInstruct.scriptEnd)
              return Fun(el.buffer) as Boolean
            } else {
              const FunctionCode = parseInt(el.content.slice(2, 4))
              // 结果对象需要满足对应操作指令,是此协议中的指令,数据长度和结果中声明的一致
              if (el.buffer.data[1] === FunctionCode && el.buffer.data[2] + 5 === el.buffer.data.length) return true
              else {
                console.log({ instruct: el.content, buffer: el.buffer, bufferlength: el.buffer.data.length, msg: '指令返回的格式不对' });
                return false
              }
            }
          } else return false

        })

        R.result = ResultFilter.map(el => {
          // 功能码
          // 解析规则
          const instructs = <protocolInstruct>InstructMap.get(el.content.slice(2, 12))
          // 取出实际数据
          const data = el.buffer.data.slice(instructs.shift ? instructs.shiftNum : 3, instructs.pop ? el.buffer.data.length - instructs.popNum : el.buffer.data.length - 2)
          let buf: Buffer | Array<number>
          //根据指令结果类型预先处理数据
          switch (instructs.resultType) {
            case "bit2":
              {
                // 把结果字段中的10进制转换为2进制,翻转后补0至8位,代表modbus线圈状态
                // https://blog.csdn.net/qq_26093511/article/details/58628270
                // http://blog.sina.com.cn/s/blog_dc9540b00102x9p5.html

                // 1,读bit2指读线圈oil，方法为把10/16进制转为2进制,不满8位则前补0至8位，然后翻转这个8位数组，
                // 2,把连续的几个数组拼接起来，转换为数字
                // 例子：[1,0,0,0,1],[0,1,1,1,1]补0为[0,0,0,1,0,0,0,1],[0,0,0,0,1,1,1,1],数组顺序不变，每个数组内次序翻转
                // [1,0,0,0,1,0,0,0],[1,1,1,1,0,0,0,0],然后把二维数组转为一维数组

                const bit2Array = data.map(el2 => el2.toString(2).padStart(8, '0').split('').reverse().map(el3 => Number(el3))).flat()
                buf = bit2Array
              }
              break
            default:
              buf = Buffer.from(data);
              break
          }
          // 迭代指令解析规则,解析结果集返回
          return instructs.formResize.map(el2 => {
            // 申明结果
            const result = { name: el2.name, value: 0, unit: el2.unit }
            // 每个数据的结果地址
            const [start, len] = CacheParseRegx(el2.regx as string)
            switch (instructs.resultType) {
              // 处理
              case 'bit2':
                {
                  result.value = (<Array<number>>buf)[start - 1]
                }
                break
              // 处理整形
              case "hex":
              case "short":
                // 转换为带一位小数点的浮点数
                result.value = parseFloat(((<Buffer>buf).readIntBE(start - 1, len) * Number(el2.bl)).toFixed(1));
                //parseFloat((valBuf.readInt16BE(0) * el2.bl).toFixed(1));
                break;
              // 处理单精度浮点数
              case "float":
                result.value = Tool.HexToSingle((<Buffer>buf).slice(start - 1, start + len - 1)); //Tool.BufferToFlot(buf, start)
                break;
            }
            return result
          })
        }).flat()
        /* switch (true) {
          // 已HX开头的海信空调非标协议处理程序
          case /(^HX.*)/.test(R.protocol):
            R.result = IntructResult
              .filter(el => el.buffer.data[0] === 85 && InstructMap.has(el.content.slice(4, el.content.length - 2)))
              .map(el => {
                // 取出请求指令部分,后期做成缓存
                const instruct = el.content.slice(4, el.content.length - 2);
                // 解析规则
                const instructs = InstructMap.get(instruct) as protocolInstruct;
                const buf = Buffer.from(el.buffer.data.slice(1, el.buffer.data.length - 1));
                // console.log({ instruct, buf });
                // 迭代指令解析规则,解析结果集返回
                return instructs.formResize.map(el2 => {
                  // 每个数据的结果地址
                  const [start, len] = CacheParseRegx(el2.regx as string)//(el2.regx?.split("-") as string[]).map(el2 => parseInt(el2));
                  // 申明结果
                  const value = /(温度|湿度)/.test(el2.name) ? parseFloat(((buf.readIntBE(start, len) / 2) - 20).toFixed(1)) : parseFloat((buf.readIntBE(start, len) * Number(el2.bl)).toFixed(1));
                  return { name: el2.name, value, unit: el2.unit };
                });
              })
              .flat()
            break
          // 标准modbus协议
          default:
            {
              R.result = IntructResult.filter(el => {
                const FunctionCode = parseInt(el.content.slice(2, 4))
                if (el.buffer.data[1] === FunctionCode) return true
                else {
                  console.log({ instruct: el.content, buffer: el.buffer, msg: '指令返回的格式不对' });
                  return false
                }
              }).filter(el => {
                if (InstructMap.has(el.content.slice(2, 12))) return true
                else {
                  console.log({ instruct: el.content, buffer: el.buffer, msg: '协议不包含此指令' });
                  return false
                }
              }).filter(el => {
                // 数据长度
                const bufSize = el.buffer.data[2];
                // 检查数据实际长度是否对应
                if (bufSize + 5 === el.buffer.data.length) return true
                else {
                  console.log({ instruct: el.content, buffer: el.buffer, msg: '返回Buffer数据长度错误' });
                  return false
                }
              }).map(el => {
                // 功能码
                // 解析规则
                const instructs = <protocolInstruct>InstructMap.get(el.content.slice(2, 12))
                // 取出实际数据
                const data = el.buffer.data.slice(instructs.shift ? instructs.shiftNum : 3, instructs.pop ? el.buffer.data.length - instructs.popNum : el.buffer.data.length - 2)
                let buf: Buffer | Array<number>
                //根据指令结果类型预先处理数据
                switch (instructs.resultType) {
                  case "bit2":
                    {
                      // 把结果字段中的10进制转换为2进制,翻转后补0至8位,代表modbus线圈状态
                      // https://blog.csdn.net/qq_26093511/article/details/58628270
                      // http://blog.sina.com.cn/s/blog_dc9540b00102x9p5.html
                       
                      // 1,读bit2指读线圈oil，方法为把10/16进制转为2进制,不满8位则前补0至8位，然后翻转这个8位数组，
                       // 2,把连续的几个数组拼接起来，转换为数字
                       // 例子：[1,0,0,0,1],[0,1,1,1,1]补0为[0,0,0,1,0,0,0,1],[0,0,0,0,1,1,1,1],数组顺序不变，每个数组内次序翻转
                       // [1,0,0,0,1,0,0,0],[1,1,1,1,0,0,0,0],然后把二维数组转为一维数组
                      
                      const bit2Array = data.map(el2 => el2.toString(2).padStart(8, '0').split('').reverse().map(el3 => Number(el3))).flat()
                      buf = bit2Array
                    }
                    break
                  default:
                    buf = Buffer.from(data);
                    break
                }
                // 迭代指令解析规则,解析结果集返回
                return instructs.formResize.map(el2 => {
                  // 申明结果
                  const result = { name: el2.name, value: 0, unit: el2.unit }
                  // 每个数据的结果地址
                  const [start, len] = CacheParseRegx(el2.regx as string)
                  switch (instructs.resultType) {
                    // 处理
                    case 'bit2':
                      {
                        result.value = (<Array<number>>buf)[start - 1]
                      }
                      break
                    // 处理整形
                    case "hex":
                    case "short":
                      // 转换为带一位小数点的浮点数
                      result.value = parseFloat(((<Buffer>buf).readIntBE(start - 1, len) * Number(el2.bl)).toFixed(1));
                      //parseFloat((valBuf.readInt16BE(0) * el2.bl).toFixed(1));
                      break;
                    // 处理单精度浮点数
                    case "float":
                      result.value = Tool.HexToSingle((<Buffer>buf).slice(start - 1, start + len - 1)); //Tool.BufferToFlot(buf, start)
                      break;
                  }
                  return result
                })
              }).flat()
            }
            break
        } */
      }
      break;
  }
  if (R.result && R.result.length > 0) {
    // 设备请求结果,发送设备正常查询
    Event.QuerySuccess(R)
  }
  return R;
};
