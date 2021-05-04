import WX from "../util/wxUtil";
import TencetMapAPI from "../util/TencetMapAPI";
import { BcryptCompare, BcryptDo } from "../util/bcrypt";
import { JwtSign, JwtVerify } from "../util/Secret";
import _ from "lodash";
import * as Cron from "../cron/index";
import { getUserBindDev, validationUserPermission } from "../util/util";
import { ParseCoefficient } from "../util/func";
import Tool from "../util/tool";
import { SendValidation } from "../util/SMS";
import { DevConstant, DevsType, LogUartTerminalDataTransfinite, LogUserLogins, RegisterTerminal, Terminal, TerminalClientResult, TerminalClientResultSingle, UserAlarmSetup, UserBindDevice, Users } from "../mongoose";
import config from "../config";
import HF from "../util/HF";

type url =
  | 'getuserMountDev'
  | 'code2Session'
  | 'getphonenumber'
  | 'register'
  | 'getDTUInfo'
  | 'bindDev'
  | 'getAlarm'
  | 'getDevsRunInfo'
  | 'getDevsHistoryInfo'
  | 'userlogin'
  | 'getUserInfo'
  | 'unbindwx'
  | 'getAlarmunconfirmed'
  | 'alarmConfirmed'
  | 'getDevOprate'
  | 'SendProcotolInstructSet'
  | 'getUserDevConstant'
  | 'pushThreshold'
  | 'getUserAlarmTels'
  | 'setUserSetupContact'
  | 'addTerminalMountDev'
  | 'delTerminalMountDev'
  | 'delUserTerminal'
  | 'DevTypes'
  | 'modifyUserInfo'
  | 'getGPSaddress'
  | 'cancelwx'
  | 'getUserTel'
  | 'sendValidation'
  | 'ValidationCode'
  | 'getNodes'
  | 'bacthRegisterDTU'
  | "addVm"
  | "modifyDTUName"
  | "updateGps"
  | 'webLogin'
  | 'iotRemoteUrl'
  | 'updateAvanter'

import { KoaIMiddleware } from "typing";
const Middleware: KoaIMiddleware = async (ctx) => {
  const body: { token: string, [x: string]: any } = ctx.method === "GET" ? ctx.query : ctx.request.body;
  const type = ctx.params.type as url;
  const ClientCache = ctx.$Event.ClientCache;
  // console.log({ type, body: _.pickBy(body, (_val, key) => key !== 'token') });
  // 校验用户cookie
  const noCookieTypeArray = ['code2Session', 'getphonenumber', 'register', 'userlogin']
  const token = ctx.header.token as string
  const tokenUser: Uart.UserInfo = token && token !== 'undefined' ? await JwtVerify(token) : false
  // console.log({ noCookieTypeArray, token, tokenUser });
  ctx.$Event.savelog<Uart.logUserRequst>('request', { user: tokenUser.user, userGroup: tokenUser.userGroup || 'group', type, argument: body })

  if (!noCookieTypeArray.includes(type) && !token && !tokenUser) ctx.throw('用户未登陆或登陆失效')

  switch (type) {
    // 微信登录
    case "code2Session":
      {
        // 没有code报错
        ctx.assert(body.js_code, 400, "需要微信code码");
        const wxGetseesion = await WX.UserOpenID(body.js_code)
        console.log({ wxGetseesion });

        // 包含错误
        ctx.assert(!wxGetseesion.errcode, 401, wxGetseesion.errmsg);
        // 正确的话返回sessionkey
        const { openid, session_key } = wxGetseesion
        // 存储session
        ClientCache.CacheWXSession.set(openid, session_key);
        // 检查openid是否为已注册用户
        const user = await Users.findOne({ userId: openid }).lean<Uart.UserInfo>();
        if (user) {
          //ctx.cookies.set('token', await JwtSign(user), { sameSite: 'strict' })
          const address = (ctx.header['x-real-ip'] || ctx.ip) as string
          console.log({ address, a: ctx.header['x-real-ip'] });

          Users.updateOne({ user: user.user }, { $set: { modifyTime: new Date(), address } }).exec()
          user.passwd = ''
          ctx.body = {
            ok: 1,
            arg: { token: await JwtSign(user), user: user.user, userGroup: user.userGroup, name: user.name, avanter: user.avanter, tel: user.tel }
          } as Uart.ApolloMongoResult;
        } else {
          ctx.body = { ok: 0, msg: "微信未绑定平台账号，请先注册使用", arg: { openid } } as Uart.ApolloMongoResult;
        }
      }
      break;
    // 用户登录
    case "userlogin":
      {
        const { openid, user, passwd, avanter } = body
        const userInfo = await Users.findOne({ user }).lean<Uart.UserInfo>()
        if (userInfo) {
          if (!await BcryptCompare(passwd, userInfo.passwd as string)) {
            ctx.body = { ok: 0, msg: "密码效验错误" } as Uart.ApolloMongoResult
            return
          }
          if (userInfo.userId) {
            ctx.body = { ok: 0, msg: '用户已绑定其它微信账号，请先解绑' } as Uart.ApolloMongoResult
            return
          }
          Users.updateOne({ user }, { $set: { modifyTime: new Date(), address: (ctx.header['x-real-ip'] || ctx.ip) as string, userId: openid, avanter } }).exec()
          new LogUserLogins({ user, type: '用户登陆', address: ctx.header['x-real-ip'] || ctx.ip } as Uart.logUserLogins).save()
          ctx.body = { ok: 1, msg: 'success' } as Uart.ApolloMongoResult
        } else {
          ctx.body = { ok: 0, msg: '用户账号未注册' } as Uart.ApolloMongoResult
        }

      }
      break
    // 获取用户信息
    case "getUserInfo":
      {
        const user = ctx.$Event.Cache.CacheUser.get(tokenUser.user)
        ctx.body = {
          ok: 1, arg: _.pickBy(user, (_val, key) => {
            return key !== 'passwd'
          })
        } as Uart.ApolloMongoResult
      }
      break
    // 用于解绑微信和透传账号的绑定关系
    case "unbindwx":
      {
        ctx.body = await Users.updateOne({ user: tokenUser.user, rgtype: { $ne: 'wx' } }, { $set: { userId: '', avanter: '' } })
      }
      break
    // 解密手机号码
    case "getphonenumber":
      {
        const { encryptedData, iv, openid } = body;
        // 获取用户最近的seesionKey
        const session_key = ClientCache.CacheWXSession.get(openid);
        ctx.assert(session_key, 400, "openid is nologin");
        ctx.body = {
          ok: 1,
          arg: WX.BizDataCryptdecryptData(session_key!, encryptedData, iv)
        } as Uart.ApolloMongoResult;
      }
      break;
    // 微信用户注册
    case "register":
      {
        const data: {
          user: string;
          name: string;
          tel: number;
          avanter: string;
        } = body as any;

        const userStat = await Users.findOne({ $or: [{ userId: data.user }, { tel: data.tel }] });
        if (userStat) {
          ctx.body = { ok: 0, msg: "手机号码已被注册，请使用账号登录" } as Uart.ApolloMongoResult
          return
        }
        const user = Object.assign(
          body,
          { userId: data.user },
          { passwd: await BcryptDo(data.user) },
          { rgtype: "wx" }
        ) as unknown as Uart.UserInfo;
        const User = new Users(user);
        ctx.body = await User.save()
          .then(() => {
            // 生成用户新的自定义配置
            const setup: Partial<Uart.userSetup> = {
              user: user.user,
              tels: user.tel ? [String(user.tel)] : [],
              mails: user.mail ? [user.mail] : [],
              ProtocolSetup: []
            };
            new UserAlarmSetup(setup).save();
            // 添加日志记录
            new LogUserLogins({
              user: user.user,
              type: "用户注册"
            } as Uart.logUserLogins).save();
            ctx.$Event.Cache.RefreshCacheUser(user.user)
            WX.SendsubscribeMessageRegister(user.userId, user.user, user.name || '', user.creatTime as any, '欢迎使用LADS透传云平台')
            return { ok: 1, msg: "账号注册成功" };
          })
          .catch(e => console.log(e));
      }
      break;
    // 获取用户挂载设备
    case 'getuserMountDev':

      const Bind = ctx.$Event.Cache.CacheBind.get(tokenUser.user)
      if (Bind && Bind.UTs) {
        const UTs = [...ctx.$Event.Cache.CacheTerminal.values()].filter(el => Bind.UTs.includes(el.DevMac))
        ctx.body = { ok: 1, arg: { UTs } } as Uart.ApolloMongoResult;
      } else {
        ctx.body = { ok: 0, arg: { UTs: [] } } as Uart.ApolloMongoResult
      }

      break
    // 查询DTU信息
    case 'getDTUInfo':
      // ctx.assert(validationUserPermission(tokenUser.user, body.mac), 402, '用户越权操作dtu')
      const terminal = await Terminal.findOne({ DevMac: body.mac })
      ctx.body = { ok: terminal ? 1 : 0, arg: terminal } as Uart.ApolloMongoResult
      break
    // 绑定设备信息
    case 'bindDev':
      {
        const id = body.mac as string
        if (config.vmDevs.includes(id)) {
          ctx.body = { ok: 0, msg: `${id}设备是虚拟设备,无法绑定` } as Uart.ApolloMongoResult
          break
        }
        const isBind = await UserBindDevice.findOne({ UTs: id }).exec()
        if (isBind) {
          ctx.body = { ok: 0, msg: `${id}设备已被绑定` } as Uart.ApolloMongoResult
          break
        }
        const result = await UserBindDevice.updateOne(
          { user: tokenUser.user },
          { $addToSet: { UTs: id } },
          { upsert: true }
        );
        ctx.$Event.Cache.RefreshCacheBind(ctx.user)
        ctx.body = result
      }
      break
    // 获取未确认告警数量
    case "getAlarmunconfirmed":
      {
        const BindDevs: string[] = getUserBindDev(tokenUser.user)
        const logCur = await LogUartTerminalDataTransfinite.find({ mac: { $in: BindDevs }, isOk: false }).lean()
        const len = logCur.length
        const alarm = logCur.slice(0, len > 5 ? 5 : len)
        // const logCurCount = await logCur.countDocuments()
        ctx.body = { ok: 1, arg: { len, alarm } } as Uart.ApolloMongoResult
      }
      break
    // 获取用户告警信息
    case "getAlarm":
      {
        const { start, end } = body
        const query = LogUartTerminalDataTransfinite.find({ "__v": 0 }).where("createdAt").gte(start).lte(end)
        // 如果未清洗的数据查询结果的大于N条,则先清洗数据
        if (await query.countDocuments() > 2000) {
          await Cron.Uartterminaldatatransfinites()
        }
        const BindDevs: string[] = getUserBindDev(tokenUser.user)
        const logCur = LogUartTerminalDataTransfinite.find({ mac: { $in: BindDevs } }).where("createdAt").gte(start).lte(end)
        const logCurCount = await logCur.countDocuments()
        let result = [] as Uart.uartAlarmObject[]
        if (logCurCount > 0) {
          if (logCurCount > 200) {
            result = await logCur.find().sort("-timeStamp").limit(200).lean()
          } else {
            result = await logCur.find().lean()
          }
        } else {
          result = await LogUartTerminalDataTransfinite.find({ mac: { $in: BindDevs } }).sort("-timeStamp").limit(200).lean()
        }
        const terminalMaps = ctx.$Event.Cache.CacheTerminal
        const arr = result.map(el => {
          el.mac = terminalMaps.get(el.mac)?.name || el.mac
          return el
        })
        ctx.body = {
          ok: 1,
          arg: _.sortBy(arr, (item) => {
            return -item.timeStamp
          })
        } as Uart.ApolloMongoResult

      }
      break
    // 确认用户告警
    case "alarmConfirmed":
      {
        const id = body.id as string
        const BindDevs: string[] = getUserBindDev(tokenUser.user)
        if (id) {
          const doc = await LogUartTerminalDataTransfinite.findById(id, "mac").lean() as Uart.uartAlarmObject
          if (BindDevs.includes(doc.mac)) {
            // 确认告警缓存清除
            const tags = doc.mac + doc.pid + doc.tag
            ctx.body = await LogUartTerminalDataTransfinite.findByIdAndUpdate(id, { $set: { isOk: true } }, { new: true }).exec()
          } else ctx.body = { ok: 0 } as Uart.ApolloMongoResult
        } else {
          ctx.body = await LogUartTerminalDataTransfinite.updateMany({ mac: { $in: BindDevs } }, { $set: { isOk: true } }).exec()
        }
      }
      break
    // 获取设备实时运行信息
    case "getDevsRunInfo":
      {
        const { mac, pid } = body
        ctx.assert(validationUserPermission(tokenUser.user, mac), 402, '用户越权操作dtu')
        const data = await TerminalClientResultSingle.findOne({ mac: mac, pid }).lean<Uart.queryResult>()
        if (data && data.result) {
          // 获取mac协议
          const protocol = ctx.$Event.getClientDtuMountDev(mac, pid).protocol
          // 获取系统配置显示常量参数
          //const sysShowTag = ctx.$Event.Cache.CacheConstant.get(protocol)?.ShowTag || []
          // 获取系统配置显示常量参数
          const userShowTag = ctx.$Event.Cache.CacheUserSetup.get(tokenUser.user)?.ShowTagMap.get(protocol)
          // 融合显示常量
          //const ShowTag = new Set([...userShowTag, ...sysShowTag])
          //console.log(ShowTag);

          // 刷选
          if (userShowTag) data.result = data.result.filter(el => userShowTag.has(el.name))
          // 检查设备是否有别名
          const alias = ctx.$Event.Cache.CacheAlias.get(mac + pid + protocol)
          if (alias) {
            data.result = data.result.map(el => {
              el.alias = alias.get(el.name) || el.name
              return el
            })
          } else {
            data.result = data.result.map(el => {
              el.alias = el.name
              return el
            })
          }
          ctx.body = { ok: 1, arg: data } as Uart.ApolloMongoResult
        } else {
          ctx.body = { ok: 0, msg: '设备没有运行数据' } as Uart.ApolloMongoResult
        }
        /*  if (data) {
           // 获取mac协议
           const protocol = ctx.$Event.Cache.CacheTerminal.get(mac)?.mountDevs.find(el => el.pid === Number(pid))?.protocol as string
           // 获取配置显示常量参数
           const ShowTag = ctx.$Event.Cache.CacheUserSetup.get(tokenUser.user)?.ShowTagMap.get(protocol)
           // 刷选
           if (ShowTag) {
             data.result = data.result!.filter(el => ShowTag.has(el.name))
           }
           ctx.body = { ok: 1, arg: data } as Uart.ApolloMongoResult
         } else {
           ctx.body = { ok: 0, msg: '设备没有运行数据' } as Uart.ApolloMongoResult
         } */
      }
      break
    // 获取设备历史运行数据
    case "getDevsHistoryInfo":
      {
        const { mac, pid, name, datatime } = body
        ctx.assert(validationUserPermission(tokenUser.user, mac), 402, '用户越权操作dtu')

        let result: Uart.queryResultSave[]
        // 如果没有日期参数,默认检索最新的100条数据
        if (datatime === "") {
          result = await TerminalClientResult.find({ mac, pid, "result.name": name }, { "result.$": 1, timeStamp: 1 }).sort("-timeStamp").limit(100).lean() as any;
        } else {
          const start = new Date(datatime + " 00:00:00");
          const end = new Date(datatime + " 23:59:59");
          result = await TerminalClientResult.find({ mac, pid, "result.name": name }, { "result.$": 1, timeStamp: 1 })
            .where("timeStamp")
            .gte(start.getTime())
            .lte(end.getTime())
            .sort("-timeStamp")
            .lean()
        }
        // 把结果拆分为块
        const len = Number.parseInt((result.length / 10).toFixed(0))
        //console.log({len,length:result.length});
        const resultChunk = _.chunk(result, len < 10 ? 10 : len)
        // 遍历切块,刷选出指定字段的结果集,
        const res = resultChunk.map(el => {
          // 刷选切块,如果值相同则抛弃
          let def: Uart.queryResultSave = el[0]
          //def.result = [def.result.find(el2 => el2.name === name) as queryResultArgument]
          return el.reduce((pre, cur) => {
            // 获取最后一个值
            const last = _.last(pre) as Uart.queryResultSave
            //cur.result = [cur.result.find(el2 => el2.name === name) as queryResultArgument]
            if (cur.result[0] && last.result[0].value !== cur.result[0].value) pre.push(cur)
            return pre
          }, [def])
        }).flat().map(el3 => ({ time: new Date(el3.timeStamp).toLocaleTimeString(), [name]: el3.result[0].value })
        )
        ctx.body = { ok: 1, arg: res } as Uart.ApolloMongoResult
      }
      break

    // 获取用户自定义协议配置
    case "getUserDevConstant":
      {
        const Protocol: string = body.protocol
        const userSetup = ctx.$Event.Cache.CacheUserSetup.get(tokenUser.user as string) as Uart.userSetup
        const user = userSetup?.ProtocolSetupMap.get(Protocol)
        const sys = await DevConstant.findOne({ Protocol })
        const protocol = ctx.$Event.Cache.CacheProtocol.get(Protocol)
        /* if (!user) {
          await UserAlarmSetup.updateOne({ user: tokenUser.user }, { "$addToSet": { ProtocolSetup: { Protocol } } }, { upsert: true }).exec()
        } */
        ctx.body = { ok: 1, arg: { user, sys, protocol, userSetup } } as Uart.ApolloMongoResult
      }
      break
    // 统一提交配置
    case "pushThreshold":
      {
        const { Protocol, type, arg }: { Protocol: string, type: Uart.ConstantThresholdType, arg: Uart.DevConstant_Air | Uart.DevConstant_Ups | Uart.DevConstant_EM | Uart.DevConstant_TH | string[] | Uart.OprateInstruct } = body as any
        const user = tokenUser.user
        let Up
        switch (type) {
          case "Threshold":
            Up = { "ProtocolSetup.$.Threshold": arg }
            break
          case "ShowTag":
            Up = { "ProtocolSetup.$.ShowTag": _.compact(arg as string[]) }
            break
          case "AlarmStat":
            Up = { "ProtocolSetup.$.AlarmStat": arg }
            break
        }
        /* 
        const setup = await UserAlarmSetup.findOne({ user }).lean<Uart.userSetup>()
        if (!userSetup) {
          await UserAlarmSetup.updateOne({ user }, { $push: { ProtocolSetup: { Protocol } } }, { upsert: true }).exec()
        } else if (!userSetup.ProtocolSetup.find(el => el.Protocol === Protocol)) {
          console.log(userSetup);
          await UserAlarmSetup.updateOne({ user }, { $push: { ProtocolSetup: { Protocol } } }).exec()
          // await UserAlarmSetup.updateOne({ user }, { ProtocolSetup: { "$addToSet": { Protocol } } }).exec()
        } */
        // 获取用户告警配置
        const setup = await UserAlarmSetup.findOne({ user }).lean<Pick<Uart.userSetup, 'user' | 'mails' | 'tels' | 'ProtocolSetup'>>()!
        // 如果没有初始配置则新建
        if (!setup) {
          await new UserAlarmSetup({ user, mails: [], tels: [], ProtocolSetup: [] }).save()
        }
        // 如果如果没有ProtocolSetup属性或ProtocolSetup中没有此协议则加入
        if (!setup?.ProtocolSetup || setup.ProtocolSetup.findIndex(el => el.Protocol === Protocol) === -1) {
          await UserAlarmSetup.updateOne({ user }, { $push: { ProtocolSetup: { Protocol } } }, { upsert: true }).exec()
        }

        const result = await UserAlarmSetup.updateOne(
          { user, "ProtocolSetup.Protocol": Protocol },
          { $set: Up }
        )
        ctx.$Event.Cache.RefreshCacheUserSetup(user)
        ctx.body = result;
      }
      break
    // 获取用户的告警联系方式
    case "getUserAlarmTels":
      {
        const data = ctx.$Event.Cache.CacheUserSetup.get(tokenUser.user)
        ctx.body = { ok: 1, arg: { tels: data?.tels || [], mails: data?.mails || [] } } as Uart.ApolloMongoResult
      }
      break
    // 设置用户自定义设置(联系方式)
    case "setUserSetupContact":
      {
        const { tels, mails } = body
        const result = await UserAlarmSetup.updateOne({ user: tokenUser.user }, { $set: { tels: tels || [], mails: mails || [] } }, { upsert: true })
        ctx.$Event.Cache.RefreshCacheUserSetup(tokenUser.user)
        ctx.body = result
      }
      break
    // 添加终端挂载信息
    case "addTerminalMountDev":
      {
        const { DevMac, Type, mountDev, protocol, pid } = body
        ctx.assert(validationUserPermission(tokenUser.user, DevMac), 402, '用户越权操作dtu')

        const result = await Terminal.updateOne(
          { DevMac },
          {
            $addToSet: {
              mountDevs: {
                Type,
                mountDev,
                protocol,
                pid
              }
            }
          }
        );
        await ctx.$Event.Cache.RefreshCacheTerminal(DevMac);
        ctx.body = result;
      }
      break
    // 删除终端挂载设备
    case "delTerminalMountDev":
      {
        const { DevMac, mountDev, pid } = body
        ctx.assert(validationUserPermission(tokenUser.user, DevMac), 402, '用户越权操作dtu')

        const result = await Terminal.updateOne({ DevMac }, { $pull: { mountDevs: { mountDev, pid } } })
        await ctx.$Event.Cache.RefreshCacheTerminal(DevMac)
        ctx.body = result
      }
      break
    // 删除用户终端绑定
    case "delUserTerminal":
      {
        const id = body.mac
        ctx.assert(validationUserPermission(tokenUser.user, id), 402, '用户越权操作dtu')

        const res = await UserBindDevice.updateOne(
          { user: tokenUser.user },
          { $pull: { UTs: id } },
          { upsert: true }
        );
        ctx.$Event.Cache.CacheBindUart.delete(id)
        ctx.$Event.Cache.RefreshCacheBind(tokenUser.user)
        ctx.body = res
      }
      break
    // 获取设备信号
    case "DevTypes":
      {
        const model = await DevsType.find({ Type: body.Type })
        ctx.body = { ok: 1, arg: model } as Uart.ApolloMongoResult
      }
      break
    // 修改用户信息
    case "modifyUserInfo":
      {
        const { type, value }: { type: 'tel' | 'mail' | 'name', value: string } = body as any
        if (type === 'mail' || type === 'tel') {
          const users = await Users.findOne({ $or: [{ tel: Number(value) }, { mail: value }] }).lean<Uart.UserInfo>()
          if (users && users.user !== tokenUser.user) {
            ctx.body = { ok: 0, msg: '号码已被使用，请换新的号码重试' } as Uart.ApolloMongoResult
          } else {
            const res = await Users.updateOne({ user: tokenUser.user }, { $set: { [type]: value } })
            ctx.$Event.Cache.RefreshCacheUser(tokenUser.user)
            ctx.body = res
          }
        } else if (type === 'name') {
          const res = await Users.updateOne({ user: tokenUser.user }, { $set: { [type]: value } })
          ctx.$Event.Cache.RefreshCacheUser(tokenUser.user)
          ctx.body = res
        }
      }
      break

    // 获取gps定位的详细地址
    case "getGPSaddress":
      {
        const location = body.location
        const adress = await TencetMapAPI.geocoder(location)
        ctx.body = { ok: Number(Boolean(adress.status === 0)), arg: adress } as Uart.ApolloMongoResult
      }
      break
    // 注销微信
    case "cancelwx":
      {
        if (tokenUser.rgtype !== "wx") {
          ctx.body = { ok: 0, msg: '只有微信注册的用户可以执行注销操作' } as Uart.ApolloMongoResult
          return
        }
        if (getUserBindDev(tokenUser.user).length > 0) {
          ctx.body = { ok: 0, msg: '请先卸载绑定的所有设备再注销账号' } as Uart.ApolloMongoResult
          return
        }
        ctx.body = await new Promise(async (resolve) => {
          await UserAlarmSetup.deleteOne({ user: tokenUser.user })
          await UserBindDevice.deleteOne({ user: tokenUser.user })
          const result = await Users.deleteOne({ userId: tokenUser.userId })
          resolve(result)
        })
      }
      break

    // 获取设备操控指令
    case "getDevOprate":
      {
        const Constant = await DevConstant.findOne({ Protocol: body.protocol }).lean<Uart.ProtocolConstantThreshold>()
        ctx.body = { ok: 1, arg: _.pick(Constant, ['OprateInstruct', 'ProtocolType']) } as Uart.ApolloMongoResult
      }
      break
    //  固定发送设备操作指令
    case "SendProcotolInstructSet":
      {
        const query: Uart.instructQueryArg = body.query
        const item: Uart.OprateInstruct = body.item
        if (config.vmDevs.includes(query.DevMac)) {
          ctx.body = { ok: 0, msg: '虚拟体验设备不能操作' } as Uart.ApolloMongoResult;
          break
        }
        // 验证客户是否校验过权限
        ctx.assert(validationUserPermission(tokenUser.user, query.DevMac), 402, '用户越权操作dtu')
        const juri = ctx.$Event.ClientCache.CacheUserJurisdiction.get(token)
        console.log({ juri, a: ctx.$Event.ClientCache.CacheUserJurisdiction });

        if (!juri) {
          ctx.body = { ok: 4, msg: "权限校验失败,请校验身份" } as Uart.ApolloMongoResult
          break
        }
        // 获取协议指令
        const protocol = ctx.$Event.Cache.CacheProtocol.get(query.protocol) as Uart.protocol
        // 携带事件名称，触发指令查询
        const Query: Uart.instructQuery = {
          protocol: query.protocol,
          DevMac: query.DevMac,
          pid: query.pid,
          type: protocol.Type,
          events: 'oprate' + Date.now() + query.DevMac,
          content: item.value
        }
        // 检查操作指令是否含有自定义参数
        if (/(%i)/.test(item.value)) {
          // 如果识别字为%i%i,则把值转换为四个字节的hex字符串,否则转换为两个字节
          if (/%i%i/.test(item.value)) {
            const b = Buffer.allocUnsafe(2)
            b.writeIntBE(ParseCoefficient(item.bl, Number(item.val)), 0, 2)
            Query.content = item.value.replace(/(%i%i)/, b.slice(0, 2).toString("hex"))
          } else {
            const val = ParseCoefficient(item.bl, Number(item.val)).toString(16)
            Query.content = item.value.replace(/(%i)/, val.length < 2 ? val.padStart(2, '0') : val)
          }
          console.log({ msg: '发送查询指令', item });
        }

        const result = await ctx.$Event.DTU_OprateInstruct(Query)
        console.log(result);
        ctx.body = result
      }
      break

    // 获取用户手机号码
    case "getUserTel":
      {
        const user = await Users.findOne({ user: tokenUser.user }).lean<Uart.UserInfo>()
        ctx.body = { ok: 1, arg: Tool.Mixtel(user!.tel) } as Uart.ApolloMongoResult
      }
      break

    // 发送短信验证码
    case "sendValidation":
      {
        const user = await Users.findOne({ user: tokenUser.user }).lean<Uart.UserInfo>()
        const code = (Math.random() * 10000).toFixed(0)
        ctx.$Event.ClientCache.CacheUserValidationCode.set(token, code)
        ctx.body = await SendValidation(String(user!.tel), code)
      }
      break
    // 检验短信验证码
    case "ValidationCode":
      {
        const code = body.code
        const userCode = ctx.$Event.ClientCache.CacheUserValidationCode.get(token)
        if (!userCode || !code) {
          ctx.body = { ok: 0, msg: '校验码不存在,请重新发送校验码' } as Uart.ApolloMongoResult
          break
        }
        if (userCode !== code) {
          ctx.body = { ok: 0, msg: '校验码不匹配,请确认校验码是否正确' } as Uart.ApolloMongoResult
          break
        }
        // 缓存权限
        ctx.$Event.ClientCache.CacheUserJurisdiction.set(token, code)
        ctx.body = { ok: 1, msg: "校验通过" } as Uart.ApolloMongoResult
      }
      break

    // 获取节点列表
    case "getNodes":
      {
        const nodes = [...ctx.$Event.Cache.CacheNode.values()]
        for (const node of nodes) {
          node.count = await Terminal.countDocuments({ mountNode: node.Name })
        }
        ctx.body = { ok: 1, arg: nodes } as Uart.ApolloMongoResult
      }
      break

    // 批量注册DTU
    case "bacthRegisterDTU":
      {
        const node: string = body.node
        const dtus: string[] = body.dtus
        const terminalHasKeys = new Set(ctx.$Event.Cache.CacheTerminal.keys())
        for (let DevMac of dtus) {
          if (!terminalHasKeys.has(DevMac) && DevMac.length > 10) {
            await RegisterTerminal.updateOne({ DevMac }, { $set: { mountNode: node } },
              { upsert: true }).exec()//({ DevMac, mountNode: node }).save()
            await Terminal.updateOne(
              { DevMac },
              { $set: { mountNode: node, name: DevMac } },
              { upsert: true }
            ).exec()
            await ctx.$Event.Cache.RefreshCacheTerminal(DevMac);
          }
        }

        ctx.body = { ok: 1, arg: 'ok' } as Uart.ApolloMongoResult
      }
      break

    // 用户添加虚拟设备
    case "addVm":
      {
        const UTs = [...ctx.$Event.Cache.CacheTerminal.values()].filter(el => config.vmDevs.includes(el.DevMac))
        ctx.body = { ok: 1, arg: UTs } as Uart.ApolloMongoResult;
      }
      break

    // 修改DTU别名
    case "modifyDTUName":
      {
        const dtu = body.dtu as string
        const name = body.name as string
        if (config.vmDevs.includes(dtu)) {
          ctx.body = { ok: 0, msg: '虚拟体验设备不能修改' } as Uart.ApolloMongoResult;
          break
        }
        ctx.assert(validationUserPermission(tokenUser.user, dtu), 402, '用户越权操作dtu')
        const result = await Terminal.updateOne({ DevMac: dtu }, { $set: { name } }).exec()
        ctx.$Event.Cache.RefreshCacheTerminal(dtu)
        ctx.body = result
      }
      break

    // 更新GPS定位信息
    case "updateGps":
      {
        const dtu = body.dtu as string
        const jw = body.jw as string
        if (config.vmDevs.includes(dtu)) {
          ctx.body = { ok: 0, msg: '虚拟体验设备不能修改' } as Uart.ApolloMongoResult;
          break
        }
        ctx.assert(validationUserPermission(tokenUser.user, dtu), 402, '用户越权操作dtu')
        ctx.body = await Terminal.updateOne({ DevMac: dtu }, { $set: { jw } }).exec()
      }
      break

    // 微信登录
    case "webLogin":
      {
        const { code, token } = body
        ctx.assert(ctx.$Event.ClientCache.CacheQR.has(code), 411, '请刷新网站重试')
        ctx.$Event.clientSocket.io.to(code).emit('login', { token })
        // ctx.$Event.ClientCache.CacheQR.set(code, token)
        ctx.body = { ok: 1 }
      }
      break

    // 获取iot设备远程配置地址
    case 'iotRemoteUrl':
      {
        const { mac } = body
        ctx.body = await HF.macRemote(mac)
      }
      break

    // 更新用户头像和昵称
    case 'updateAvanter':
      {
        const { nickName, avanter } = body
        const res = await Users.updateOne({ user: tokenUser.user }, { $set: { name: nickName, avanter } })
        ctx.$Event.Cache.RefreshCacheUser(tokenUser.user)
        ctx.body = res
      }
      break
  }
};


export default Middleware