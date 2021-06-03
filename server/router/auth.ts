import { JwtSign, JwtVerify } from "../util/Secret";
import { BcryptCompare, BcryptDo } from "../util/bcrypt";
import { UserAlarmSetup, Users } from "../mongoose";
import { AES, enc } from "crypto-js";
import { LogUserLogins } from "../mongoose/Log";
import { KoaIMiddleware } from "typing";
import WX from "../util/wxUtil"


const Middleware: KoaIMiddleware = async (ctx) => {
  const body = ctx.method === "GET" ? ctx.query : ctx.request.body
  const type = ctx.params.type;
  // console.log({ body });

  switch (type) {
    case "login":
      {
        const { user, passwd } = body;
        ctx.assert(user || passwd, 400, "参数错误");
        const u = await Users.findOne({ $or: [{ user }, { mail: user }] });
        if (!u) return
        // 是否有u
        const hash = ctx.$Event.ClientCache.CacheUserLoginHash.get(user)
        ctx.assert(u || hash, 400, "userNan");
        // 解密密码
        const decryptPasswd = AES.decrypt(passwd, hash!).toString(enc.Utf8)
        // 密码效验
        const pwStat = await BcryptCompare(decryptPasswd, u.passwd!);
        ctx.assert(pwStat, 400, "passwdError");
        // if (!BcryptCompare(passwd, u.passwd)) ctx.throw(400, "passwdError");
        if (u && pwStat) {
          ctx.$Event.ClientCache.CacheUserLoginHash.delete(user)
          Users.updateOne({ $or: [{ user }, { mail: user }] }, { $set: { modifyTime: new Date(), address: ctx.ip } }).exec()
          new LogUserLogins({ user: u.user, type: '用户登陆', address: ctx.header['x-real-ip'] || ctx.ip } as Uart.logUserLogins).save()
          // token长度由对象的复杂度决定，edge限值header长度
          const token = await JwtSign({ user: u.user, userGroup: u.userGroup })
          // console.log({tokenlogin:token});

          ctx.body = { token, user: u.user, name: u.name || u.user, userGroup: u.userGroup, avanter: u.avanter };
        }
      }
      break
    // 微信扫码登录
    case "wxlogin":
      {
        const { code, state }: { code: string, state: string } = body
        const ok = code || (state && state === 'e0bwU6jnO2KfIuTgBQNDVxlsy7iGtoF3A8rWpSCM5RzZ1dmYJcLHqPhXav4Ek9lIC6P4cULfktXj5Wcwa3GcCBCYRMWidUzZyJyTqu')
        ctx.assert(ok, 404, "argument error")
        const info = await WX.web_login(code)
        console.log(info);

        const u = await Users.findOne({ userId: info.unionid })
        // 如果没有用户则新建
        if (!u) {
          const user: Uart.UserInfo = {
            userId: info.unionid,
            user: info.unionid,
            name: info.nickname,
            avanter: info.headimgurl,
            passwd: await BcryptDo(info.unionid),
            rgtype: "wx",
            userGroup: "user",
            openId: info.openid
          }
          await new Users(user).save()
            .then(() => {
              // 生成用户新的自定义配置
              const setup: Partial<Uart.userSetup> = {
                user: user.user,
                tels: [],
                mails: [],
                ProtocolSetup: []
              };
              new UserAlarmSetup(setup).save();
              // 添加日志记录
              new LogUserLogins({
                user: user.user,
                type: "用户注册"
              } as Uart.logUserLogins).save();
              ctx.$Event.Cache.RefreshCacheUser(user.user)
              // WX.SendsubscribeMessageRegister(user.userId, user.user, user.name || '', user.creatTime as any, '欢迎使用LADS透传云平台')
            })
        }
        await Users.updateOne({ userId: info.unionid }, { $set: { modifyTime: new Date(), address: ctx.ip } })
        const user = await Users.findOne({ userId: info.unionid }) as Uart.UserInfo
        new LogUserLogins({ user: user.user, type: '用户登陆', address: ctx.header['x-real-ip'] || ctx.ip } as Uart.logUserLogins).save()
        // token长度由对象的复杂度决定，edge限值header长度
        const token = await JwtSign({ user: user.user, userGroup: user.userGroup })
        ctx.body = { token , user: user.user}//, name: user.name, userGroup: user.userGroup, avanter: user.avanter };
      }
      break


    case "user":
      {
        const token = (<string>ctx.cookies.get("auth._token.local")).replace(/^bearer\%20/, "");
        const User: Uart.UserInfo = await JwtVerify(token).catch(err => ctx.throw(400))
        ctx.body = { user: User.name || User.user }
      }
      break
    case "userGroup":
      {
        const token = ctx.cookies.get("auth._token.local");
        if (!token || token === "false") ctx.body = { userGroup: "guest" };
        else {
          const user: Uart.UserInfo = await JwtVerify((<string>token).replace("bearer%20", "")).catch(e => false);
          ctx.body = { userGroup: user ? user.userGroup : "guest" };
        }
      }
      break;
    case "logout":
      {
        ctx.body = { state: "logout success" }
      }
      break;
    // 用户登陆提供给用户的加密hash
    case "hash":
      {
        const user = body.user as string
        ctx.assert(user, 406, "提交参数无效")
        const isUser = <Uart.UserInfo>await Users.findOne({ $or: [{ user }, { mail: user }] }).lean();
        ctx.assert(isUser, 400, "账号不存在");

        const hash = await JwtSign({ user, timeStamp: Date.now() });
        ctx.$Event.ClientCache.CacheUserLoginHash.set(user, hash)
        ctx.body = { hash }
      }
      break
    // 二维码登录获取编码内容
    case "QrText":
      {
        const QrText = await JwtSign({ rand: Math.random(), timeStamp: Date.now() });
        ctx.$Event.ClientCache.CacheQR.set(QrText, '')
        ctx.body = QrText
      }
      break
    // 循环获取二维码登录状态
    case "getScanStat":
      {
        const QrText = body.QrText as string
        ctx.assert(QrText, 410, 'QrText must string')
        const wxToken = ctx.$Event.ClientCache.CacheQR.get(QrText)
        if (wxToken) {
          const u: Uart.UserInfo = await JwtVerify(wxToken).catch(err => ctx.throw(400));
          ctx.$Event.ClientCache.CacheQR.delete(QrText)
          ctx.body = {
            ok: 1,
            token: await JwtSign({ user: u.user, userGroup: u.userGroup })
          }
        } else {
          ctx.body = {
            ok: 0
          }
        }

      }
      break
    default:
      break;
  }
};

export default Middleware