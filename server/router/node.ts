import { ParameterizedContext } from "koa";
import { Uart } from "typing";
import { Terminal, NodeRunInfo, LogUseBytes, TerminalClientResult, TerminalClientResults, TerminalClientResultSingle } from "../mongoose";
import tool from "../util/tool"
import Event from "../event";
type DataTypes = 'UartData' | 'RunData'
export default async (Ctx: ParameterizedContext) => {
  const ctx: Uart.KoaCtx = Ctx as any;
  const type = ctx.params.type as DataTypes
  const body = ctx.request.body;

  switch (type) {
    // 透传设备数据上传接口
    case "UartData":
      {
        const queryResultArray = (<Uart.uartData>body).data;
        if (queryResultArray.length > 0) {
          // 保存每个终端使用的数字节数
          // 保存每个查询指令使用的字节，以天为单位
          const date = new Date().toLocaleDateString()
          for (let el of queryResultArray) {
            await LogUseBytes.updateOne({ mac: el.mac, date }, { $inc: { useBytes: el.useBytes } }, { upsert: true }).exec()
          }

          // 保存原始数据
          TerminalClientResults.insertMany(queryResultArray);
          // 翻转结果数组,已新的结果为准
          const UartData = queryResultArray.reverse()
          // 解析结果
          const ParseData = UartData.map(el => Event.Parse.parse(el))
          // 保存解析后的数据
          TerminalClientResult.insertMany(ParseData);
          // 保存单例数据库
          // 创建缓存,保存每条数据的Set
          const MacID: Set<string> = new Set()
          ParseData.forEach(data => {
            const ID = data.mac + data.pid
            // 如果数据重复,抛弃旧数据
            if (!MacID.has(ID)) {
              MacID.add(ID)
              // 把数据发给检查器,检查数据是否有故障,保存数据单例
              const checkData = Event.Check.check(data)
              // 把结果转换为对象
              // data.parse = Object.assign({}, ...checkData.result!.map(el => ({ [el.name]: el })) as { [x: string]: Uart.queryResultArgument }[])
              // console.log({checkData});
              // 保存对象
              // console.log(data.result);

              TerminalClientResultSingle.updateOne(
                { mac: checkData.mac, pid: checkData.pid },
                checkData,
                { upsert: true }
              ).exec()
            }
          })
        }
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
