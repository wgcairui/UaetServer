import Event from "../event/index";
import _ from "lodash";
import { SmsDTUDevAlarm } from "../util/SMS";
import { SendMailAlarm } from "../util/Mail";
import { queryResult, userSetup, queryResultParse, ProtocolConstantThreshold, queryResultArgument, uartAlarmObject, Threshold, ConstantAlarmStat } from "uart";
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
            sendSmsAlarm(query, `${name}超限[${argumentVal}]`, UserSetup, parse[key])
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
          sendSmsAlarm(query, `${ant.name}[${Event.GetUnit(<string>parse[key].unit)[parse[key].value]}]`, UserSetup, parse[key]);
        }
      })
    }
  }
  return query;
};
// 使用同一个签名和同一个短信模板ID，对同一个手机号码发送短信通知，支持50条/日（如您是在发短信通知时提示业务限流，建议根据以上业务调整接口调用时间）
// 发送告警推送,短信,邮件
async function sendSmsAlarm(query: queryResult, event: string, UserSetup: userSetup, parseArgument: queryResultArgument) {
  // 创建tag
  const tag = query.mac + query.pid + parseArgument.name;
  // 缓存告警记录
  if (Event.Cache.CacheAlarmNum.has(tag)) {
    const n = Event.Cache.CacheAlarmNum.get(tag) as number;
    Event.Cache.CacheAlarmNum.set(tag, n + 1);
    // console.log({ n, tels: UserSetup.tels });
    if (n === 20) {
      // 是否有邮件
      if (UserSetup.mails.length > 0) {
        SendMailAlarm(UserSetup.mails, `尊敬的${UserSetup.user},您的DTU${query.mac}挂载的${query.mountDev}于${new Date().toLocaleString()}告警,关键词` + event);
      }
      // 检查是否有告警手机号
      if (UserSetup.tels.length > 0) {
        SmsDTUDevAlarm(query, event)
      }
      // 保存为日志
      Event.savelog<uartAlarmObject>('DataTransfinite', {
        mac: query.mac,
        pid: query.pid,
        devName: query.mountDev,
        protocol: query.protocol,
        timeStamp: query.timeStamp,
        tag: parseArgument.name,
        msg: event
      })
    }
  } else Event.Cache.CacheAlarmNum.set(tag, 0);
}


function checkUPS(Query:queryResult){
  if(Query.type === 232){
    Query.contents.forEach(el=>{
      el.content
    })
  }
}