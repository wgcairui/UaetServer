import { JwtSign, JwtVerify } from "../util/Secret";
import { BcryptCompare } from "../util/bcrypt";
import { Users } from "../mongoose/user";
import { ParameterizedContext } from "koa";
import { AES, enc } from "crypto-js";
import { LogUserLogins } from "../mongoose/Log";
import { Uart } from "typing";
export default async (ctx: ParameterizedContext) => {
  const body = ctx.method === "GET" ? ctx.query : ctx.request.body
  const type = ctx.params.type;
  // console.log({ type, body });
  switch (type) {
    case "login":
      {
        const { user, passwd } = body;
        ctx.assert(user || passwd, 400, "参数错误");
        const u = <Uart.UserInfo>await Users.findOne({ $or: [{ user }, { mail: user }] }).lean();
        // 是否有u
        const hash = (ctx as Uart.KoaCtx).$Event.ClientCache.CacheUserLoginHash.get(user)
        ctx.assert(u || hash, 400, "userNan");
        // 解密密码
        const decryptPasswd = AES.decrypt(passwd, hash as string).toString(enc.Utf8)
        // 密码效验
        const pwStat = await BcryptCompare(decryptPasswd, u.passwd as string);
        ctx.assert(pwStat, 400, "passwdError");
        // if (!BcryptCompare(passwd, u.passwd)) ctx.throw(400, "passwdError");
        if (u && pwStat) {
          (ctx as Uart.KoaCtx).$Event.ClientCache.CacheUserLoginHash.delete(user)
          Users.updateOne({ $or: [{ user }, { mail: user }] }, { $set: { modifyTime: new Date(), address: ctx.ip } }).exec()
          new LogUserLogins({ user: u.user, type: '用户登陆', address: ctx.header['x-real-ip'] || ctx.ip } as Uart.logUserLogins).save()
          // token长度由对象的复杂度决定，edge限值header长度
          const token = await JwtSign({ user: u.user, userGroup: u.userGroup })
          // console.log({tokenlogin:token});

          ctx.body = { token, user: u.user, name: u.name || u.user, userGroup: u.userGroup, avanter: u.avanter };
        }
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
        (ctx as Uart.KoaCtx).$Event.ClientCache.CacheUserLoginHash.set(user, hash)
        ctx.body = { hash }
      }
      break
    default:
      break;
  }
};
