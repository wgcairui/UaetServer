import Event from "../event/index";
import _ from "lodash";
import { SmsDTUDevAlarm } from "../util/SMS";
import { SendMailAlarm } from "../util/Mail";
import { queryResult, userSetup, queryResultParse, ProtocolConstantThreshold, queryResultArgument, uartAlarmObject, Threshold, ConstantAlarmStat } from "uart";
import { getDtuInfo } from "../util/util";
// 优化方向-> 把每个用户的每条协议参数检查都缓存起来，管理员或用户更新设置的时候更新指定的缓存
export default (query: queryResult) => {
  // 获取mac绑定的用户
  const User = Event.Cache.CacheBindUart.get(query.mac);
  // 没有绑定用户则跳出检查
  if (User) {
    // 获取用户个性化配置实例
    const UserSetup = Event.Cache.CacheUserSetup.get(User) as userSetup;
    // 结果集
    const parse = query.parse as queryResultParse;
    // 协议参数阀值,状态
    const Constant = Event.Cache.CacheConstant.get(query.protocol) as ProtocolConstantThreshold;
    // 获取协议参数阀值缓存
    {
      // 获取用户协议配置
      const UserThreshold: Map<string, Threshold> = UserSetup.ThresholdMap.get(query.protocol) || new Map();
      // 迭代系统默认配置,如果用户有相同的配置则覆盖系统设置
      (Constant.Threshold || []).forEach(ther => {
        //if(UserThreshold.has(ther.name)) ther = UserThreshold.get(ther.name) as Threshold
        if (!UserThreshold.has(ther.name)) UserThreshold.set(ther.name, ther)
      })
      //
      UserThreshold.forEach(({ name, max, min }, key) => {
        if (parse && parse?.hasOwnProperty(key)) {
          const argumentVal = parseInt(parse[key].value)
          if (argumentVal > max || argumentVal < min) {
            parse[key].alarm = true
            sendSmsAlarm(query, `${name}超限[${argumentVal}]`, parse[key].name)
          }
        }
      })
    }
    // 检查参数状态
    {
      // 获取用户协议配置
      const UserAlarmStat: Map<string, ConstantAlarmStat> = UserSetup.AlarmStateMap.get(query.protocol) || new Map();
      // 合并配置
      (Constant.AlarmStat || []).forEach(ant => {
        if (!UserAlarmStat.has(ant.name)) UserAlarmStat.set(ant.name, ant)
      })
      UserAlarmStat.forEach((ant, key) => {
        if (parse.hasOwnProperty(ant.name) && !_.compact(ant.alarmStat).includes(parse[key].value)) {
          parse[key].alarm = true
          sendSmsAlarm(query, `${ant.name}[${Event.GetUnit(<string>parse[key].unit)[parse[key].value]}]`, parse[key].name);
          console.log(parse[key]);
        }
      })
    }
    //
    {
      checkUPS(query)
    }
  }
  return query;
};
// 使用同一个签名和同一个短信模板ID，对同一个手机号码发送短信通知，支持50条/日（如您是在发短信通知时提示业务限流，建议根据以上业务调整接口调用时间）
// 发送告警推送,短信,邮件
async function sendSmsAlarm(query: queryResult, event: string, tag: string) {
  // 创建tag
  const tags = query.mac + query.pid + tag;
  const { userInfo } = getDtuInfo(query.mac)
  // 缓存告警记录
  if (Event.Cache.CacheAlarmNum.has(tags)) {
    const n = Event.Cache.CacheAlarmNum.get(tags) as number;
    Event.Cache.CacheAlarmNum.set(tags, n + 1);
    // console.log({ n, tels: userInfo.tels });
    if (n === 10) {
      // 是否有邮件
      if (userInfo.mails.length > 0) {
        SendMailAlarm(userInfo.mails, `尊敬的${userInfo.user},您的DTU${query.mac}挂载的${query.mountDev}于${new Date().toLocaleString()}告警,关键词` + event);
      }
      // 检查是否有告警手机号
      if (userInfo.tels.length > 0) {
        SmsDTUDevAlarm(query, event)
      }
      // 保存为日志
      Event.savelog<uartAlarmObject>('DataTransfinite', {
        mac: query.mac,
        pid: query.pid,
        devName: query.mountDev,
        protocol: query.protocol,
        timeStamp: query.timeStamp,
        tag,
        msg: event
      })
    }
  } else Event.Cache.CacheAlarmNum.set(tags, 0);
}


async function checkUPS(Query: queryResult) {
  // 4、判断UPS是否有故障信息：每1秒钟查询一下指令QGS，检测返回的信息(MMM.M HH.H LLL.L NN.N QQQ.Q DDD KKK.K VVV.V SSS.S XXX.X TTT.T b9b8b7b6b5b4b3b2b1b0<cr>,
  if (Query.type === 232 && Query.content.includes('QGS')) {
    const index = Query.contents.findIndex(el => el.content === "QGS")
    const Res = Buffer.from(Query.contents[index].buffer).toString('utf8').split(' ')[11]
    if (Res) {
      const [b9, b8, b7, b6, b5, b4, b3, b2, b1, b0, a9, a8] = Res.split('').map(el => Number(el))
      // 在 b4位置的数据位为1还是0，为1时表示UPS有故障了，则使用“QFS”故障查询指令，查询UPS故障信息。返回的信息数据				
      if (b4) {
        // console.log({ b9, b8, b7, b6, b5, b4, b3, b2, b1, b0, a9, a8 });
        const { ok, upserted } = await Event.DTU_OprateInstruct({ DevMac: Query.mac, protocol: Query.protocol, pid: Query.pid, type: Query.type, content: 'QFS', events: Date.now() + 'QFS' })
        if (ok) {
          const [kk, pp, ff, oo, ee, ll, cc, hh, nn, bb, tt, ss] = Buffer.from(upserted).toString('utf8', 1).split(' ')
          if (kk !== 'OK') {
            const hashtable = {
              0x01: '规定时间内，bus电压未达到设定值',
              0x02: 'Bus电压超过上限值',
              0x03: 'Bus电压低于下限值',
              0x04: '正负Bus电压之差超出允许范围',
              0x05: 'Bus电压下降斜率过快',
              0x06: 'PFC输入电感电流过大',
              0x11: '规定时间内，inverter电压未达到设定值',
              0x12: 'Inverter电压超过上限值',
              0x13: 'Inverter电压低于下限值',
              0x14: 'L1 inverter相短路',
              0x15: 'L2 inverter相短路',
              0x16: 'L3 inverter相短路',
              0x17: 'L1L2 inverter线短路',
              0x18: 'L2L3 inverter线短路',
              0x19: 'L3L1 inverter线短路',
              0x1A: 'L1 inverter负功超出允许范围',
              0x1B: 'L2 inverter负功超出允许范围',
              0x1C: 'L3 inverter负功超出允许范围',
              0x21: 'Battery scr短路故障',
              0x22: 'Line scr短路故障',
              0x23: 'Inverter relay开路故障',
              0x24: 'Inverter relay短路故障',
              0x25: '输入输出线路接反',
              0x26: '电池反接故障',
              0x27: '电池电压过高，远超出over charge点',
              0x28: '电池电压过低，远低于shut down点',
              0x29: '电池fuse开路故障',
              0x31: 'CAN bus通信故障',
              0x32: '主机信号线路故障',
              0x33: '同步信号线路故障',
              0x34: '同步触发信号线路故障',
              0x35: '并机通信线路丢失故障',
              0x36: '输出严重不均流故障',
              0x41: 'UPS工作温度过高故障',
              0x42: '控制板中CPU间通信故障',
              0x43: '过载故障',
              0x44: '风扇模组故障',
              0x45: '充电器故障',
              0x46: '机型错误',
              0x47: '控制板与通讯板MCU通信故障',
              0x48: '控制板韧体版本不兼容'
            }
            const event = (hashtable as any)[Buffer.from(kk).toJSON().data[0]]
            console.log(`### 发送其他故障消息:${Query.mac}/${Query.pid}/${Query.mountDev}, event:QFS(${event})`);
            sendSmsAlarm(Query, event || '未知错误', '其他故障')
          }
        }
      }
    }
  }
}