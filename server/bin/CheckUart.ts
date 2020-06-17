import { queryResult, queryResultArgument, uartAlarmObject, userSetup, Threshold, queryResultParse, ProtocolConstantThreshold } from "./interface";
import Event from "../event/index";
import _ from "lodash";
import { SendUartAlarm } from "../util/SMS";
import { SendAlarmEvent } from "../util/Mail";

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
    const Constant = Event.Cache.CacheConstant.get(query.protocol) as ProtocolConstantThreshold
    // 检查参数阀值
    {
      // 获取协议参数阀值缓存
      let Threshold = _.has(Constant, 'Threshold') ? _.cloneDeep(Constant.Threshold) : [];
      // 获取用户协议配置
      const UserThreshold = UserSetup.ThresholdMap.get(query.protocol);
      // 合并配置
      // 先检查系统配置，是否有用户设置覆盖
      if (UserThreshold) {
        // 迭代系统默认配置,如果用户有相同的配置则覆盖系统设置
        Threshold = Threshold.map(el => {
          if (UserThreshold.has(el.name)) return UserThreshold.get(el.name) as Threshold
          else return el
        })
        // 检查用户配置，是否包含系统默认配置没有的设置
        const keys: string[] = Threshold.map(el => el.name);
        Threshold.push(...Array.from(UserThreshold.values()).filter(el => !keys.includes(el.name)))

      }
      // 迭代规则
      Threshold.forEach(el => {
        // 检测结果对象中是否含有告警规则name
        if (parse.hasOwnProperty(el.name)) {
          // 解析后的参数字节
          const parseArgument = parse[el.name] as queryResultArgument
          // 实际值
          const val = parseFloat(parseArgument.value);
          // 比较大小,交给短信&邮件处理程序,如果参数没有超限,查看告警缓存缓存
          if (val < el.min || val > el.max) {
            parseArgument.alarm = true
            const alarmMsg = `:${parseArgument.name}超限[${parseArgument.value}]`
            sendSmsAlarm(query, alarmMsg, UserSetup, parseArgument)
          } else {
            sendAlarmReset(query, el, UserSetup, parseArgument)
          }
        }
      });
    }
    // 检查参数状态
    {
      //
      let AlarmStat = _.has(Constant, 'AlarmStat') ? _.cloneDeep(Constant.AlarmStat) : []
      //console.log({AlarmStat,parse});
      // 迭代每条状态值
      AlarmStat.forEach(el => {
        if (parse.hasOwnProperty(el.name)) {
          const parseArgument = parse[el.name] as queryResultArgument
          if (!el.alarmStat.includes(parseInt(parseArgument.value))) {
            parseArgument.alarm = true
            const alarmMsg = `:${parseArgument.name}[${parseArgument.value}]`
            sendSmsAlarm(query, alarmMsg, UserSetup, parseArgument)
            //console.log(parseArgument);

          }
        }
      })
    }
  }
  return query
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
    if (n === 20) {
      // 检查是否有告警手机号
      if (UserSetup.tels.length > 0) {
        await SendUartAlarm({
          user: UserSetup.user,
          type: "透传设备告警",
          tel: UserSetup.tels.join(','),
          name: UserSetup.user,
          devname: query.mac,
          air: query.mountDev,
          event
        });
      }
      // 是否有邮件
      if (UserSetup.mails.length > 0) {
        UserSetup.mails.forEach(mail => {
          //SendAlarmEvent(mail, data.msg)
        })
      }
    }
  } else {
    Event.Cache.CacheAlarmNum.set(tag, 0);
    // 构造告警信息
    const data: uartAlarmObject = {
      type: "UartTerminalDataTransfinite",
      mac: query.mac,
      pid: query.pid,
      protocol: query.protocol,
      timeStamp: query.timeStamp,
      tag: parseArgument.name,
      msg: event
    };
    // 发送事件，socket发送用户
    Event.Emit("UartTerminalDataTransfinite", data);
  }
}

// 发送告警恢复推送,短信,邮件
async function sendAlarmReset(query: queryResult, Threshold: Threshold, UserSetup: userSetup, parseArgument: queryResultArgument) {
  // 创建tag
  const tag = query.mac + query.pid + parseArgument.name;
  // 检查缓存告警记录,如果没有记录则不处理
  if (Event.Cache.CacheAlarmNum.has(tag)) {
    // 清除记录
    Event.Cache.CacheAlarmNum.delete(tag)
    // 发送推送事件
    // 构造告警信息
    const data: uartAlarmObject = {
      type: "UartTerminalDataTransfiniteReset",
      mac: query.mac,
      pid: query.pid,
      protocol: query.protocol,
      timeStamp: query.timeStamp,
      tag: parseArgument.name,
      msg: `${query.mountDev}:${parseArgument.name}超限已恢复,实际值${parseArgument.value}`
    };
    // 发送事件，socket发送用户
    Event.Emit("UartTerminalDataTransfinite", data);
    //
    // 检查是否有告警手机号
    if (UserSetup.tels.length > 0) {
      await SendUartAlarm({
        user: UserSetup.user,
        type: "透传设备告警",
        tel: UserSetup.tels.join(','),
        name: UserSetup.user,
        devname: query.mac,
        air: query.mountDev,
        event: data.msg
      });
    }
    //
    if (UserSetup.mails.length > 0) {
      UserSetup.mails.forEach(mail => {
        // SendAlarmEvent(mail, data.msg)
      })
    }
  }
}

