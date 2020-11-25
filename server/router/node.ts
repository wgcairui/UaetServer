import { ParameterizedContext } from "koa";
import UartDataParsingSave from "../bin";
import { Uart } from "typing";
import { Terminal, NodeRunInfo } from "../mongoose";
import tool from "../util/tool"
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
        /* 
        {
          NodeInfo: {
            hostname: 'iZbp1braz0vhfk4w6h64g2Z',
            totalmem: '7.8GB',
            freemem: '10.2%',
            loadavg: [ 1.6, 1.5, 1.4 ],
            type: 'Linux',
            uptime: '45h',
            userInfo: {
              uid: 1000,
              gid: 1000,
              username: 'cc',
              homedir: '/home/cc',
              shell: '/bin/bash'
            }
          },
          WebSocketInfos: {
            NodeName: 'ladis-hb',
            SocketMaps: [ [Object], [Object] ],
            Connections: 2
          },
          updateTime: 'Mon Nov 16 2020'
        }
        */
        // 解构body
        const { NodeInfo, WebSocketInfos, updateTime }: { NodeInfo: Uart.nodeInfo, WebSocketInfos: Uart.WebSocketInfo, updateTime: string } = body

        // 遍历DTUs信息,保存新的配置
        WebSocketInfos.SocketMaps.forEach(async el => {
          // 获取terminal信息
          const terminal = ctx.$Event.Cache.CacheTerminal.get(el.mac)
          if (terminal) {
            // console.log({ terminal, el });
            const { mac, ip, port, connecting, AT, PID, ver, Gver, iotStat, jw, uart, ICCID } = el
            // 比较参数，如果有修改则更新数据库
            {
              const temp: any[] = []
              if (terminal.ip !== ip && tool.RegexIP(ip)) temp.push({ ip })
              if (terminal.port !== port && Number(port) > 0) temp.push({ port })
              if (terminal.PID !== PID) temp.push({ PID })
              if (AT) {
                if (terminal.AT !== AT) temp.push({ AT })
                if (terminal.ver !== ver) temp.push({ ver })
                if (terminal.Gver !== Gver) temp.push({ Gver })
                if (terminal.iotStat !== iotStat) temp.push({ iotStat })
                if (terminal.jw !== jw && tool.RegexLocation(jw)) temp.push({ jw })
                if (terminal.uart !== uart && tool.RegexUart(uart)) temp.push({ uart })
                if (terminal.ICCID !== ICCID && tool.RegexICCID(ICCID)) temp.push({ ICCID })
              }

              if (temp.length > 0) {
                temp.push({ uptime: updateTime })
                // console.log(terminal,Object.assign({}, ...temp));
                Terminal.updateOne({ DevMac: mac }, { $set: Object.assign({}, ...temp) }).then(el => {
                  ctx.$Event.Cache.RefreshCacheTerminal(mac)
                  ctx.$Event.ChangeTerminalStat(mac, connecting)
                })
              } else {
                Terminal.updateOne({ DevMac: mac }, { $set: { uptime: updateTime } })
              }
            }
            /* // 根据设备在线状态修改
            {
              connecting ? ctx.$Event.Cache.CacheNodeTerminalOnline.add(mac) : ctx.$Event.Cache.CacheNodeTerminalOnline.delete(mac)
            } */
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
