/* eslint-disable no-unused-vars */
/* eslint-disable no-console */
import { NodeRunInfo } from "../mongoose/node";
import { ParameterizedContext } from "koa";
import { nodeInfo, uartData, WebSocketInfo } from "../bin/interface";
import { Terminal } from "../mongoose/Terminal";
import UartDataParsingSave from "../bin/UartDataParsingSave";
export default async (ctx: ParameterizedContext) => {
  const type = ctx.params.type;
  const body = ctx.request.body;

  switch (type) {
    // 透传设备数据上传接口
    case "UartData":
      {
        const UartData: uartData = body;
        UartDataParsingSave(UartData.data)
        ctx.body = { code: 200 }
      }
      break;
    // 透传运行数据上传接口
    case "RunData":
      {
        // 节点主机运行信息
        const NodeInfo: nodeInfo = body.NodeInfo
        // 节点websocket运行信息
        const WebSocketInfos: WebSocketInfo = body.WebSocketInfos
        // 设备port jw
        // console.log(WebSocketInfos);

        WebSocketInfos.SocketMaps.forEach(el => {
          ctx.$Event.Cache.CacheNodeTerminalOnline.add(el.mac)
          const { port, ip, jw } = el
          Terminal.updateOne({ DevMac: el.mac }, { $set: { ip, port, jw } }, { upsert: true })
        })
        //写入运行信息
        const reslut = await NodeRunInfo.updateOne(
          { NodeName: WebSocketInfos.NodeName },
          { $set: { ...WebSocketInfos, ...NodeInfo, updateTime: body.updateTime } },
          { upsert: true }
        )
        ctx.body = reslut
      }
      break;

    default:
      break;
  }
};
