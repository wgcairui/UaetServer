import { ParameterizedContext } from "koa";
import { Users, UserAlarmSetup, UserBindDevice } from "../mongoose/user";
import {
  KoaCtx,
  UserInfo,
  ApolloMongoResult,
  userSetup,
  logUserLogins, uartAlarmObject, queryResult, queryResultSave
} from "uart";
import WX from "../util/wxUtil";
import { BcryptCompare, BcryptDo } from "../util/bcrypt";
import { LogUartTerminalDataTransfinite, LogUserLogins } from "../mongoose/Log";
import { Terminal } from "../mongoose/Terminal";
import { JwtSign, JwtVerify } from "../util/Secret";
import _ from "lodash";
import * as Cron from "../cron/index";
import { getUserBindDev } from "../util/util";
import { TerminalClientResult, TerminalClientResultSingle } from "../mongoose/node";

type url = 'getuserMountDev'
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

export default async (Ctx: ParameterizedContext) => {
  const ctx: KoaCtx = Ctx as any;
  const body: { token: string, [x: string]: any } = ctx.method === "GET" ? ctx.query : ctx.request.body;
  const type = ctx.params.type as url;
  const ClientCache = ctx.$Event.ClientCache;
  console.log(_.pickBy(body, (_val, key) => key !== 'token'));
  // 校验用户cookie
  const noCookieTypeArray = ['code2Session', 'getphonenumber', 'register', 'userlogin']
  const token = body.token
  const tokenUser: UserInfo = token && token !== 'undefined' ? await JwtVerify(token) : false
  // console.log({ noCookieTypeArray, token, tokenUser });

  if (!noCookieTypeArray.includes(type) && !token && !tokenUser) {
    ctx.throw('用户未登陆或登陆失效')
  }
  switch (type) {
    // 微信登录
    case "code2Session":
      {
        // 没有code报错
        ctx.assert(body.js_code, 400, "需要微信code码");
        const wxGetseesion = await WX.UserOpenID(body.js_code)
        // 包含错误
        ctx.assert(!wxGetseesion.errcode, 401, wxGetseesion.errmsg);
        // 正确的话返回sessionkey
        const { openid, session_key } = wxGetseesion
        // 存储session
        ClientCache.CacheWXSession.set(openid, session_key);
        // 检查openid是否为已注册用户
        const user = await Users.findOne({ userId: openid }).lean<UserInfo>();
        if (user) {
          //ctx.cookies.set('token', await JwtSign(user), { sameSite: 'strict' })
          user.passwd = ''
          ctx.body = {
            ok: 1,
            arg: { token: await JwtSign(user), user: user.user, userGroup: user.userGroup, name: user.name, avanter: user.avanter, tel: user.tel }
          } as ApolloMongoResult;
        } else {
          ctx.body = { ok: 0, msg: "微信未绑定平台账号，请先注册使用", arg: { openid } } as ApolloMongoResult;
        }
      }
      break;
    // 用户登录
    case "userlogin":
      {
        const { openid, user, passwd, avanter } = body
        const userInfo = await Users.findOne({ user }).lean<UserInfo>()
        if (userInfo) {
          const pwStat = await BcryptCompare(passwd, userInfo.passwd as string);
          ctx.assert(pwStat, 400, "密码效验错误");
          Users.updateOne({ user }, { $set: { modifyTime: new Date(), address: ctx.ip, userId: openid, avanter } }).exec()
          new LogUserLogins({ user, type: '用户登陆', address: ctx.ip } as logUserLogins).save()
          ctx.body = { ok: 1, msg: 'success' } as ApolloMongoResult
        } else {
          ctx.body = { ok: 0, msg: '用户账号未注册' } as ApolloMongoResult
        }

      }
      break
    // 获取用户信息
    case "getUserInfo":
      {
        ctx.body = {
          ok: 1, arg: _.pickBy(tokenUser, (_val, key) => {
            return key !== 'passwd'
          })
        } as ApolloMongoResult
      }
      break
    // 用于解绑微信和透传账号的绑定关系
    case "unbindwx":
      {
        ctx.body = await Users.updateOne({ user: tokenUser.user, rgtype: { $ne: 'wx' } }, { $set: { userId: '' } })
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
        } as ApolloMongoResult;
      }
      break;
    // 微信用户注册
    case "register":
      {
        const data: {
          user: string;
          name: string;
          tel: string;
          avanter: string;
        } = body as any;

        const userStat = await Users.findOne({ userId: data.user });
        ctx.assert(!userStat, 400, "账号有重复,此微信账号已绑定");
        //
        const user = Object.assign(
          body,
          { userId: data.user },
          { passwd: await BcryptDo(data.user) },
          { rgtype: "wx" }
        ) as unknown as UserInfo;
        const User = new Users(user);
        ctx.body = await User.save()
          .then(() => {
            // 生成用户新的自定义配置
            const setup: Partial<userSetup> = {
              user: user.user,
              tels: user.tel ? [String(user.tel)] : [],
              mails: user.mail ? [user.mail] : []
            };
            new UserAlarmSetup(setup).save();
            // 添加日志记录
            new LogUserLogins({
              user: user.user,
              type: "用户注册"
            } as logUserLogins).save();
            ctx.$Event.Cache.RefreshCacheUser(user.user)
            WX.SendsubscribeMessageRegister(user.userId, user.user, user.name || '', user.creatTime as any, '欢迎使用LADS透传云平台')
            return { ok: 1, msg: "账号注册成功" };
          })
          .catch(e => console.log(e));
      }
      break;
    // 获取用户挂载设备
    case 'getuserMountDev':
      const Bind: any = await UserBindDevice.findOne({ user: tokenUser.user }).lean();
      if (Bind) {
        Bind.UTs = await Terminal.find({ DevMac: { $in: Bind.UTs } }).lean();
        //
        Bind.UTs = Bind.UTs.map((el: any) => {
          el.online = ctx.$Event.Cache.CacheNodeTerminalOnline?.has(el.DevMac)
          if (el.online && el?.mountDevs?.length > 0) {
            el.mountDevs.forEach((element: any) => {
              element.online = !ctx.$Event.Cache.TimeOutMonutDev.has(el.DevMac + element.pid)
            });
          }
          return el
        })
        ctx.body = { ok: 1, arg: Bind } as ApolloMongoResult;
      } else {
        ctx.body = { ok: 0, msg: 'user no bindDev' } as ApolloMongoResult
      }

      break
    // 查询DTU信息
    case 'getDTUInfo':
      const terminal = await Terminal.findOne({ DevMac: body.mac })
      ctx.body = { ok: terminal ? 1 : 0, arg: terminal } as ApolloMongoResult
      break
    // 绑定设备信息
    case 'bindDev':
      {
        const id = body.mac as string
        const isBind = await UserBindDevice.findOne({ UTs: id }).exec()
        if (isBind) {
          ctx.body = { ok: 0, msg: `${id}设备已被绑定` } as ApolloMongoResult
        } else {
          const result = await UserBindDevice.updateOne(
            { user: tokenUser.user },
            { $addToSet: { UTs: id } },
            { upsert: true }
          );
          ctx.$Event.Cache.RefreshCacheBind(ctx.user)
          ctx.body = result
        }
      }
      break
    // 获取未确认告警数量
    case "getAlarmunconfirmed":
      {
        const BindDevs: string[] = getUserBindDev(tokenUser.user)
        const logCur = LogUartTerminalDataTransfinite.find({ mac: { $in: BindDevs }, isOk: false })
        const logCurCount = await logCur.countDocuments()
        ctx.body = { ok: 1, arg: logCurCount.toString() } as ApolloMongoResult
      }
      break
    // 获取用户告警信息
    case "getAlarm":
      {
        const { start, end } = body
        const query = LogUartTerminalDataTransfinite.find({ "__v": 0 }).where("createdAt").gte(start).lte(end)
        // 如果未清洗的数据查询结果的大于N条,则先清洗数据
        if (await query.countDocuments() > 2000) {
          const cur = query.cursor()
          await Cron.Uartterminaldatatransfinites(cur)
        }
        const BindDevs: string[] = getUserBindDev(tokenUser.user)
        const logCur = LogUartTerminalDataTransfinite.find({ mac: { $in: BindDevs } }).where("createdAt").gte(start).lte(end)
        const logCurCount = await logCur.countDocuments()
        let result = [] as uartAlarmObject[]
        if (logCurCount > 0) {
          if (logCurCount > 200) {
            result = await logCur.find().sort("-timeStamp").limit(200).lean()
          } else {
            result = await logCur.find().lean()
          }
        } else {
          result = await LogUartTerminalDataTransfinite.find({ mac: { $in: BindDevs } }).sort("-timeStamp").limit(50).lean()
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
        } as ApolloMongoResult

      }
      break

    case "alarmConfirmed":
      {
        const id = body.id as string
        const BindDevs: string[] = getUserBindDev(tokenUser.user)
        if (id) {
          const doc = await LogUartTerminalDataTransfinite.findById(id, "mac").lean() as uartAlarmObject
          if (BindDevs.includes(doc.mac)) {
            ctx.body = await LogUartTerminalDataTransfinite.findByIdAndUpdate(id, { $set: { isOk: true } }).exec()
          } else ctx.body = { ok: 0 } as ApolloMongoResult
        } else {
          ctx.body = await LogUartTerminalDataTransfinite.updateMany({ mac: { $in: BindDevs } }, { $set: { isOk: true } }).exec()
        }
      }
      break
    // 获取设备实时运行信息
    case "getDevsRunInfo":
      {
        const { mac, pid } = body
        // 获取mac协议
        const protocol = ctx.$Event.Cache.CacheTerminal.get(mac)?.mountDevs.find(el => el.pid === pid)?.protocol as string
        // 获取配置显示常量参数
        const ShowTag = ctx.$Event.Cache.CacheConstant.get(protocol)?.ShowTag as string[]
        const data = await TerminalClientResultSingle.findOne({
          mac: mac,
          pid
        }).lean<queryResult>() as queryResult
        // 刷选
        data.result = ShowTag ? (data.result?.filter(el => ShowTag?.includes(el.name))) : data.result
        ctx.body = { ok: 1, arg: data } as ApolloMongoResult
      }
      break
    // 获取设备历史运行数据
    case "getDevsHistoryInfo":
      {
        const { mac, pid, name, datatime } = body
        let result: queryResultSave[]
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
          let def: queryResultSave = el[0]
          //def.result = [def.result.find(el2 => el2.name === name) as queryResultArgument]
          return el.reduce((pre, cur) => {
            // 获取最后一个值
            const last = _.last(pre) as queryResultSave
            //cur.result = [cur.result.find(el2 => el2.name === name) as queryResultArgument]
            if (cur.result[0] && last.result[0].value !== cur.result[0].value) pre.push(cur)
            return pre
          }, [def])
        }).flat().map(el3 => ({ time: new Date(el3.timeStamp).toLocaleTimeString(), [name]: el3.result[0].value })
        )
        ctx.body = { ok: 1, arg: res } as ApolloMongoResult
      }
      break
  }
};
