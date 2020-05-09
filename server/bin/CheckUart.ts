import { queryResult, queryResultArgument, uartAlarmObject, userSetup } from "./interface";
import Event from "../event/index";
import { SendUartAlarm } from "./SMS"

export default (query: queryResult) => {
    // 获取mac绑定的用户
    const User = Event.Cache.CacheBindUart.get(query.mac)
    // 没有绑定用户则跳出检查
    if(!User) return
    // 获取用户个性化配置实例
    const UserSetup = Event.Cache.CacheUserSetup.get(User) as userSetup
    

    // 获取协议参数阀值缓存
    const Contant = Event.Cache.CacheConstant.get(query.protocol)
    if (Contant?.Threshold) {
        const Threshold = Contant.Threshold
        // 迭代规则
        Threshold.forEach(el => {
            // 检测结果对象中是否含有告警规则name
            const parse = (query.parse as Object)
            if (parse.hasOwnProperty(el.name)) {
                const val = parseFloat(((parse as any)[el.name] as queryResultArgument).value)
                //console.log({val,parse,el});
                // 创建tag
                const tag = query.mac + query.pid + el.name
                // 比较大小
                if (val < el.min || val > el.max) {
                    // 构造告警信息
                    const data: uartAlarmObject = {
                        type: 'UartTerminalDataTransfinite',
                        mac: query.mac,
                        pid: query.pid,
                        protocol: query.protocol,
                        timeStamp: query.timeStamp,
                        msg: `${query.protocol}:${el.name}超限,限值${el.min}/${el.max},实际值${val}`
                    }
                    // 发送事件，socket发送用户
                    Event.Emit("UartTerminalDataTransfinite", data)
                    // 缓存告警记录
                    if (Event.Cache.CacheAlarmNum.has(tag)) {
                        const n = Event.Cache.CacheAlarmNum.get(tag) as number
                        Event.Cache.CacheAlarmNum.set(tag, n + 1)
                        console.log(n);
                        if (n === 5 || n === 100) {
                            
                            SendUartAlarm({ type: "透传设备告警", tel: '15337364316', name: "cairui", devname: data.mac, air: 'P01', event: el.name + '超限' })
                        }
                    }
                } else {
                    Event.Cache.CacheAlarmNum.set(tag, 0)
                }
            }
        })
    }
}