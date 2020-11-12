import { ParameterizedContext } from "koa";
import UartDataParsingSave from "../bin/UartDataParsingSave";
import { Uart } from "typing";
import { Terminal, NodeRunInfo } from "../mongoose";
type DataTypes = 'UartData' | 'RunData'
export default async (Ctx: ParameterizedContext) => {
  const ctx: Uart.KoaCtx = Ctx as any;
  const type = ctx.params.type as DataTypes
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
        // 解构body
        const { NodeInfo, WebSocketInfos, updateTime }: { NodeInfo: Uart.nodeInfo, WebSocketInfos: Uart.WebSocketInfo, updateTime: string } = body
        // 遍历DTUs信息,保存新的配置
        WebSocketInfos.SocketMaps.forEach(async el => {
          const { port, ip, jw, mac, uart, AT, ICCID } = el
          // 获取terminal信息
          const terminal = ctx.$Event.Cache.CacheTerminal.get(mac)
          if (terminal) {
            await Terminal.updateOne({ DevMac: mac }, { $set: { ip, port, jw: jw || terminal.jw, uart, AT, ICCID, uptime: updateTime } }, { upsert: true }).exec()
            ctx.$Event.Cache.RefreshCacheTerminal(mac)
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
  }
};
