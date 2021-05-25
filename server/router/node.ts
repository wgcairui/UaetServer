import _ from "lodash"
import { Terminal, NodeRunInfo, LogUseBytes, TerminalClientResult, TerminalClientResults, TerminalClientResultSingle } from "../mongoose";
import tool from "../util/tool"


type DataTypes = 'UartData' | 'RunData'
import { KoaIMiddleware } from "typing";
const Middleware: KoaIMiddleware = async (ctx) => {
  const type = ctx.params.type as DataTypes
  const body = ctx.request.body;

  switch (type) {
    // 透传设备数据上传接口
    case "UartData":
      {
        const queryResultArray = (<Uart.uartData>body).data;
        if (queryResultArray.length > 0) {
          const date = new Date().toLocaleDateString()
          queryResultArray.forEach(async el => {
            // 保存每个终端使用的数字节数
            // 保存每个查询指令使用的字节，以天为单位
            const useBytes = el.useBytes! as any
            LogUseBytes.updateOne({ mac: el.mac, date }, { $inc: { useBytes } }, { upsert: true }).exec()
            const docResults = await new TerminalClientResults(el).save()
            const parentId = docResults._id
            //console.log({ el, docResults, parentId });

            const parse = ctx.$Event.Parse.parse(el)
            // 获得解析数据首先写入数据库
            const clientData = { ...el, parentId, result: parse }




            const { _id, parentId: id } = await new TerminalClientResult(clientData).save() as any
            // if (el.type === 232) console.log(id);
            // 如果设备有用户绑定则进入检查流程
            const user = ctx.$Event.Cache.CacheBindUart.get(el.mac);
            if (user) {
              ctx.$Event.Check.check(user, el, parse).then(async ({ alarm, result }) => {
                // 检查是否有alarm,有的话更新数据库单例
                /* parse.forEach((val, index) => {
                  if (val.alarm) {
                    TerminalClientResultSingle.updateOne(
                      { timeStamp: el.time, mac: el.mac, pid: el.pid },
                      { $set: { [`result.${index}.alarm`]: true } }
                    ).exec()
                  }
                }) */
                // 写入到单例数据库
                await TerminalClientResultSingle.updateOne(
                  { mac: el.mac, pid: el.pid },
                  _.omit({ ...el, parentId, result }, ['mac', 'pid']),
                  { upsert: true }
                ).exec()
                ctx.$Event.updateDevsData({ ...el, result })

                Promise.all(alarm).then(check => {
                  // 检查告警记录
                  check.forEach(alarm => {
                    if (alarm) {
                      ctx.$Event.savelog<Uart.uartAlarmObject>('DataTransfinite', { ...alarm, parentId: _id })
                      TerminalClientResult.findByIdAndUpdate(_id, { $inc: { hasAlarm: 1 as any } }).exec()
                      TerminalClientResults.findByIdAndUpdate(parentId, { $inc: { hasAlarm: 1 } }).exec()
                    }
                  })
                })
              })
            } else {
              await TerminalClientResultSingle.updateOne(
                { mac: el.mac, pid: el.pid },
                _.omit(clientData, ['mac', 'pid']),
                { upsert: true }
              ).exec()
              ctx.$Event.updateDevsData(clientData)
            }



            // 保存原始数据
            /* TerminalClientResults.insertMany(queryResultArray);
            // 解析结果,同步处理所有的数据
            const date = new Date().toLocaleDateString()
            queryResultArray.reverse().forEach(async el => {
              // 保存每个终端使用的数字节数
              // 保存每个查询指令使用的字节，以天为单位
              LogUseBytes.updateOne({ mac: el.mac, date }, { $inc: { useBytes: el.useBytes } }, { upsert: true }).exec()
              const parse = await Event.Parse.parse(el)
  
              // 判断是否有解析结果，没有结果则不处理数据
              if (parse.result) {
                // 获得解析数据首先写入数据库
                TerminalClientResultSingle.updateOne(
                  { mac: parse.mac, pid: parse.pid },
                  parse,
                  { upsert: true }
                ).exec()
                Event.Check.check(parse).then(check => {
                  // 保存到历史数据
                  new TerminalClientResult(parse).save()
                  // 检查是否有alarm,有的话更新数据库单例
                  check.result!.forEach((val, index) => {
                    if (val.alarm) {
                      TerminalClientResultSingle.updateOne(
                        { timeStamp: check.time, mac: check.mac, pid: check.pid },
                        { $set: { [`result.${index}.alarm`]: val.alarm } }
                      ).exec()
                    }
                  })
                })
              } else console.log(`解析流程出错,parse:${parse.mac, parse.pid, parse.timeStamp} 未得到处理数据`)
            }) */

            //
            /* Promise.all(ParseData).then(el => {
              // 保存解析后的数据
              TerminalClientResult.insertMany(el);
              // 保存单例数据库
              // 创建缓存,保存每条数据的Set
              const MacID: Set<string> = new Set()
              el.forEach(data => {
                const ID = data.mac + data.pid
                // 如果数据重复,抛弃旧数据
                if (!MacID.has(ID)) {
                  MacID.add(ID)
                  // 把数据发给检查器,检查数据是否有故障,保存数据单例
                  const checkData = Event.Check.check(data)
                  
                }
              })
            }) */

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

export default Middleware