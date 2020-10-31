/* eslint-disable no-unused-vars */
/* eslint-disable no-console */
import { NodeRunInfo } from "../mongoose/node";
import { ParameterizedContext } from "koa";
import { Terminal } from "../mongoose/Terminal";
import UartDataParsingSave from "../bin/UartDataParsingSave";
import { Uart } from "typing";
export default async (ctx: ParameterizedContext | Uart.KoaCtx) => {
  const type = ctx.params.type;
  const body = ctx.request.body;

  switch (type) {
    // 透传设备数据上传接口
    case "UartData":
      {
        const UartData: Uart.uartData = body;
        UartDataParsingSave(UartData.data)
        ctx.body = { code: 200 }
      }
      break;
    // 透传运行数据上传接口
    case "RunData":
      {
        const { NodeInfo, WebSocketInfos, updateTime }: { NodeInfo: Uart.nodeInfo, WebSocketInfos: Uart.WebSocketInfo, updateTime: string } = body
        // 设备port jw
        WebSocketInfos.SocketMaps.forEach(el => {
          const { port, ip, jw, mac, uart, AT, ICCID } = el
          if ((<Uart.KoaCtx>ctx).$Event.Cache.CacheTerminal.has(mac)) {
            Terminal.updateOne({ DevMac: mac }, { $set: { ip, port, jw, uart, AT, ICCID, uptime: updateTime } }, { upsert: true }).exec()
            ctx.$Event.Cache.CacheNodeTerminalOnline.add(mac)
          }
        })
        //写入运行信息
        const reslut = await NodeRunInfo.updateOne(
          { NodeName: WebSocketInfos.NodeName },
          { $set: { ...WebSocketInfos, ...NodeInfo, updateTime: updateTime } },
          { upsert: true }
        ).exec()
        ctx.body = reslut
      }
      break;

    default:
      break;
  }
};
