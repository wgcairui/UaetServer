import { Event } from "../index";
import { getDtuInfo, localToUtc, parseTime } from "../../util/util";
import wxUtil from "../../util/wxUtil";
import { SendSms } from "../../util/SMS";
import Tool from "../../util/tool";
import { Send } from "../../util/Mail";
// 优化方向-> 把每个用户的每条协议参数检查都缓存起来，管理员或用户更新设置的时候更新指定的缓存
interface userSetupMap {
  Threshold: Map<string, Uart.Threshold>,
  AlarmStat: Map<string, Uart.ConstantAlarmStat>,
}

/**
 * 短信id
 */
interface params {
  RegionId: string;
  PhoneNumbers: string;
  SignName: string;
  TemplateCode: string;
  TemplateParam: string;
}

interface queryResultAlarmEvents extends Uart.queryResult {
  AlarmEvents?: (Uart.uartAlarmObject | undefined | null)[]
}
/**
 * 检查解析后的设备数据,对比约束设置,设备是否运行异常
 */
class Check {
  /**
   * 用于配置
   */
  private userSetup: Map<string, Map<string, userSetupMap>>
  private hashtable: any
  /**
   * 缓存告警参数次数 tag=>number
   */
  private CacheAlarmNum: Map<string, number>
  private ctx: Event;
  /**
   * 
   * @param Event 事件总线
   */
  constructor(Event: Event) {
    this.userSetup = new Map()
    this.CacheAlarmNum = new Map()
    this.ctx = Event
    this.hashtable = {
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

    this.ctx
      // 监听用户和系统的协议配置变动，有则更新缓存
      .on("updateUserSetup", (user: string, protocol: string) => this.setUserSetup(user, protocol))
      .on("updateSysSetup", (protocol: string) => {
        this.userSetup.forEach((proMap, user) => {
          if (proMap.has(protocol)) {
            this.setUserSetup(user, protocol)
          }
        })
      })
  }

  /**
   * 获取用户告警配置
   * @param user 用户名称
   * @param protocol 设备协议名称
   */
  private getUserSetup(user: string, protocol: string) {
    const setup = this.userSetup.get(user)?.get(protocol)
    if (!setup) {
      return this.setUserSetup(user, protocol)
    } else {
      return setup
    }
  }

  /**
   * 设置用户的告警配置缓存
   * @param user 用户名称
   * @param protocol 设备协议名称
   */
  private setUserSetup(user: string, protocol: string) {
    // console.log('更新check缓存', user, protocol);

    // 获取用户个性化配置实例
    const UserSetup = this.ctx.Cache.CacheUserSetup.get(user)
    // 协议参数阀值,状态
    const Constant = this.ctx.Cache.CacheConstant.get(protocol)
    // 获取系统设置-阈值
    const sysThreshold = Constant?.Threshold || []
    // 获取系统设置-状态
    const sysStat = Constant?.AlarmStat || []

    //

    //const cache = this.userSetup.has(user)?this.userSetup.get(user)!: this.userSetup.set(user, new Map())
    // 如果缓存没有用户，新建用户缓存
    /* if (!this.userSetup.has(user)) {
      this.userSetup.set(user, new Map())
    } */
    const cache = this.userSetup.get(user) || this.userSetup.set(user, new Map()).get(user)!
    // 如果缓存没有协议，新建缓存
    if (!cache.has(protocol)) {
      cache.set(protocol, {
        Threshold: new Map(sysThreshold.map(el => [el.name, el])),
        AlarmStat: new Map(sysStat.map(el => [el.name, el]))
      })
    }
    // 获取用户+协议 缓存实例
    const setup = cache.get(protocol)!
    // 如果用户有阈值设置&&阈值设置有protocol,迭代用户设置加入到缓存
    if (UserSetup?.ThresholdMap && UserSetup.ThresholdMap.has(protocol)) {
      UserSetup.ThresholdMap.get(protocol)!.forEach(el => {
        setup.Threshold.set(el.name, el)
      })
    }

    // 如果用户有状态设置&&状态设置有protocol,迭代用户设置加入到缓存
    if (UserSetup?.AlarmStateMap && UserSetup.AlarmStateMap.has(protocol)) {
      UserSetup.AlarmStateMap.get(protocol)!.forEach(el => {
        setup.AlarmStat.set(el.name, el)
      })
    }
    return setup
  }

  /**
   *  获取设备的别名
   * @param mac 设备mac
   * @param pid 设备pid
   * @param protocol 设备协议
   * @param name 设备名称
   * @returns 别名
   */
  private getProtocolAlias(mac: string, pid: string | number, protocol: string, name: string) {
    const alias = this.ctx.Cache.CacheAlias.get(mac + pid + protocol)
    return alias?.get(name) || name
  }



  /**
   * 检查参数
   * @param query 设备参数集
   */
  public async check(user: string, query: Uart.queryResult, result: Uart.queryResultArgument[]) {
    const AlarmEvents: Promise<(Uart.uartAlarmObject | undefined)>[] = []
    const setup = this.getUserSetup(user, query.protocol)
    // console.log('check',result,setup);
    if (setup.Threshold.size > 0) {
      this.checkThreshold(result, setup.Threshold).forEach(el => {
        el.alarm = true
        const alias = this.getProtocolAlias(query.mac, query.pid, query.protocol, el.name)
        AlarmEvents.push(Promise.resolve(this.sendAlarm(query, `${alias}超限[${el.value}]`, el)))
      })
    }

    if (setup.AlarmStat.size > 0) {
      this.checkAlarm(result, setup.AlarmStat).forEach(el => {
        const value = this.ctx.parseUnit(el.unit!, el.value)
        if (value) {
          el.alarm = true
          const alias = this.getProtocolAlias(query.mac, query.pid, query.protocol, el.name)
          AlarmEvents.push(Promise.resolve(this.sendAlarm(query, `${alias}[${value}]`, el)))
        }
      })
    }
    // console.log(result);
    AlarmEvents.push(this.checkUPS(query))
    AlarmEvents.push(...this.checkSmsSend(query, result).map(el => Promise.resolve(el)))

    return { alarm: AlarmEvents, result }
  }

  /**
   * 告警恢复
   *  检查参数，如果没有带alarm，则去掉告警缓存
   * @param query 设备参数集
   */
  private checkSmsSend(query: Uart.queryResult, result: Uart.queryResultArgument[]) {
    return result
      .filter(el => !el.alarm)
      .map(el => {
        const tags = query.mac + query.pid + el.name
        const n = this.CacheAlarmNum.get(tags)
        if (n && n >= 10) {
          console.log('### 检查短信 checkSmsSend', el, this.CacheAlarmNum);
          this.CacheAlarmNum.set(tags, 0)
          const alias = this.getProtocolAlias(query.mac, query.pid, query.protocol, el.name)
          return this.sendAlarm(query, `[告警恢复]${alias}`, el, false);
        } return undefined
      })
  }

  /**
   * 检查参数阈值
   * @param result 设备参数集
   * @param setup 用户告警设置
   * @returns 超出阈值的参数结果数组
   */
  private checkThreshold(result: Uart.queryResultArgument[], setup: Map<string, Uart.Threshold>) {
    return result.filter(el => {
      const ther = setup.get(el.name)
      if (ther) {
        const argumentVal = parseInt(el.value)
        return (argumentVal > ther.max || argumentVal < ther.min)
      } else return false
    })
  }

  /**
   * 遍历结果集，比较告警设置是否包含参数值，返回符合条件的参数
   * @param result 设备参数集
   * @param setup 用户告警设置
   *  @returns 超出阈值的参数结果数组
   */
  private checkAlarm(result: Uart.queryResultArgument[], setup: Map<string, Uart.ConstantAlarmStat>) {
    return result.filter(el => {
      const alarm = setup.get(el.name)
      return alarm && !alarm.alarmStat.includes(el.value)
    })
  }

  /**
   * 检查UPS
   * @param Query 
   */
  private async checkUPS(Query: Uart.queryResult) {
    // 4、判断UPS是否有故障信息：每1秒钟查询一下指令QGS，检测返回的信息(MMM.M HH.H LLL.L NN.N QQQ.Q DDD KKK.K VVV.V SSS.S XXX.X TTT.T b9b8b7b6b5b4b3b2b1b0<cr>,
    if (Query.type === 232 && Query.content.includes('QGS')) {
      const index = Query.contents.findIndex(el => el.content === "QGS")
      const Res = Buffer.from(Query.contents[index].buffer.data).toString('utf8').split(' ')[11]
      if (Res) {
        const [b9, b8, b7, b6, b5, b4, b3, b2, b1, b0, a9, a8] = Res.split('').map(el => Number(el))
        // 在 b4位置的数据位为1还是0，为1时表示UPS有故障了，则使用“QFS”故障查询指令，查询UPS故障信息。返回的信息数据				
        if (b4) {
          // console.log({ b9, b8, b7, b6, b5, b4, b3, b2, b1, b0, a9, a8 });
          const { ok, upserted } = await this.ctx.DTU_OprateInstruct({ DevMac: Query.mac, protocol: Query.protocol, pid: Query.pid, type: Query.type, content: 'QFS', events: Date.now() + 'QFS' })
          if (ok) {
            const [kk, pp, ff, oo, ee, ll, cc, hh, nn, bb, tt, ss] = Buffer.from(upserted).toString('utf8', 1).split(' ')
            if (kk !== 'OK') {
              const event = this.hashtable[Buffer.from(kk).toJSON().data[0]]
              console.log(`### 发送其他故障消息:${Query.mac}/${Query.pid}/${Query.mountDev}, event:QFS(${event})`);
              return this.sendAlarm(Query, event || '未知错误', { name: event })
            } else return undefined
          } else return undefined
        } else return undefined
      } else return undefined
    } else return undefined
  }

  /**
   * 发送告警日志
   * 使用同一个签名和同一个短信模板ID，对同一个手机号码发送短信通知，支持50条/日（如您是在发短信通知时提示业务限流，建议根据以上业务调整接口调用时间）
   * 发送告警推送,短信,邮件
   * @param query 设备参数解析对象
   * @param event 告警事件
   * @param tag 告警标签
   * @param validation 检查发送告警频次,默认达到十次才发生
   */
  private sendAlarm(query: Uart.queryResult, event: string, tag: Partial<Uart.queryResultArgument>, validation: boolean = true) {
    // 创建tag
    const tags = query.mac + query.pid + tag.name;
    // 缓存告警记录
    const n = this.CacheAlarmNum.get(tags) || 0;
    this.CacheAlarmNum.set(tags, n + 1);
    // console.log('### 告警发送 sendSmsAlarm', query.mac, query.pid, query.mountDev, event, tag, n);
    if (!validation || n === 10) {
      this.ctx.SendUserAlarm({ mac: query.mac, msg: event })
      // 是否有邮件
      this.SendMailAlarm(query.mac, query.pid, event, tag, query.timeStamp)
      this.SmsDTUDevAlarm(query.mac, query.pid, query.mountDev, event, query.timeStamp)

      return {
        mac: query.mac,
        pid: query.pid,
        devName: query.mountDev,
        protocol: query.protocol,
        timeStamp: query.timeStamp,
        tag: tag.name!,
        msg: event
      } as Uart.uartAlarmObject
    }
  }

  /**
   * @method 发送告警邮件
   * @param mac 设备mac
   * @param pid 设备pid
   * @param event 告警事件
   * @param tag 标签
   * @param timeStamp 时间戳 
   */
  private SendMailAlarm(mac: string, pid: number | string, event: string, tag: Partial<Uart.queryResultArgument>, timeStamp: number) {
    const info = getDtuInfo(mac)
    const mails = (info.userInfo?.mails || []).filter(mail => Tool.RegexMail(mail))
    if (mails.length > 0) {
      const Dev = this.ctx.getClientDtuMountDev(mac, pid)
      const setup = this.userSetup.get(info.user.user)!.get(Dev.protocol)!
      const ck = setup.Threshold.get(tag.name!)
      const str = ck ? `min=${ck.min} max=${ck.max}` : ''
      // 获取小程序

      /* const body = `尊敬的${info.user.name},您的DTU [${info.terminalInfo.name}] 挂载的 [${Dev.mountDev}]于${new Date().toLocaleString()}告警,事件: ${event},${str}
                    您可登录透传服务平台查看处理https://uart.ladishb.com,或使用微信小程序查看`
       */
      const body = `<p><strong>尊敬的${info.user.name}</strong></p>
      <hr />
      <p><strong>您的DTU <em>${info.terminalInfo.name}</em> 挂载的 ${Dev.mountDev} 告警</strong></p>
      <p><strong>告警时间:&nbsp; </strong>${parseTime(timeStamp)}</p>
      <p><strong>告警事件:</strong>&nbsp; ${event}</p>
      <p><strong>参考值: </strong>&nbsp;${str}</p>
      <p>您可登录 <a title="透传服务平台" href="https://uart.ladishb.com" target="_blank" rel="noopener">LADS透传服务平台</a> 查看处理(右键选择在新标签页中打开)</p>
      <hr />
      <p>&nbsp;</p>
      <p>扫码或点击程序码使用微信小程序查看</p>
      <a href="weixin://dl/business/?t=203U27hghyu" target="_blank"><img src="https://www.ladishb.com/admin/upload/3312021__LADS_Uart.5df2cc6.png" alt="weapp" width="430" height="430" /></a>
      <p>&nbsp;</p>`
      return Send(mails.join(","), "Ladis透传平台", "设备告警", body)
    }
    //SendMailAlarm(userInfo.mails, `尊敬的${userInfo.user},您的DTU${query.mac}挂载的${query.mountDev}于${new Date().toLocaleString()}告警,关键词` + event);

  }

  /**
   * 发送设备告警记录
   * @param mac 
   * @param pid 
   * @param devName 设备名称 
   * @param remind 备注信息
   */
  private SmsDTUDevAlarm = (mac: string, pid: string | number, devName: string, remind: string, timeStamp: number) => {
    const info = getDtuInfo(mac)
    const { userId } = this.ctx.Cache.CacheUser.get(info.user.user)!
    // 时间参数,长度限制20字节
    const time = new Date(timeStamp)
    const d = `${time.getMonth() + 1}/${time.getDate()} ${time.getHours()}:${time.getMinutes()}:${time.getSeconds()}`
    if (userId) {
      const Dev = info.terminalInfo.mountDevs.find(el => el.pid == pid)!
      const content = `${info.terminalInfo.name}/${pid}/${Dev.mountDev} 运行故障，故障信息:${remind}`.slice(-20)
      wxUtil.SendsubscribeMessageDevAlarm(userId, d, content, (info.terminalInfo.name + '/' + Dev.mountDev).slice(0, 20), info.terminalInfo.DevMac + '-' + Dev.pid, Dev.Type + '运行异常')
    }
    const tels = (info.userInfo?.tels || []).filter(tel => Tool.RegexTel(tel))
    if (tels.length > 0) {

      const TemplateParam = JSON.stringify({
        name: info.user.name,
        DTU: info.terminalInfo.name,
        pid: pid,
        devname: devName,
        time: d,
        remind
      })
      const params: params = {
        "RegionId": "cn-hangzhou",
        "PhoneNumbers": tels.join(','),
        "SignName": "雷迪司科技湖北有限公司",
        "TemplateCode": 'SMS_200701342',
        TemplateParam
      }
      return SendSms(params)
    } else return false
  }

}

export default Check

