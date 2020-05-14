import { JwtSign, JwtVerify } from "../bin/Secret";
import { BcryptCompare } from "../bin/bcrypt";
import { Users } from "../mongoose/user";
import { KoaCtx, UserInfo } from "../bin/interface";
import { ParameterizedContext } from "koa";
import { AES, enc } from "crypto-js";
export default async (ctx: ParameterizedContext) => {
  const body = ctx.method === "GET" ? ctx.query : ctx.request.body
  const type = ctx.params.type;
  // console.log({ type, body });
  switch (type) {
    case "login":
      {
        const { user, passwd } = body;
        ctx.assert(user || passwd, 400, "参数错误");
        const u = <UserInfo>await Users.findOne({ $or: [{ user }, { mail: user }] }).lean();
        // 是否有u
        const hash = (ctx as KoaCtx).$Event.ClientCache.CacheUserLoginHash.get(user)
        ctx.assert(u || hash, 400, "userNan");
        // 解密密码
        const decryptPasswd = AES.decrypt(passwd, hash as string).toString(enc.Utf8)
        // 密码效验
        const pwStat = await BcryptCompare(decryptPasswd, u.passwd as string);
        ctx.assert(pwStat, 400, "passwdError");
        // if (!BcryptCompare(passwd, u.passwd)) ctx.throw(400, "passwdError");
        if (u && pwStat) {
          (ctx as KoaCtx).$Event.ClientCache.CacheUserLoginHash.delete(user)
          ctx.body = { token: await JwtSign(u), user: u.user };
        }
        break;
      }
    case "user":
      {
        const token = (<string>ctx.cookies.get("auth._token.local")).replace(/^bearer\%20/, "");
        const User: UserInfo = await JwtVerify(token);
        ctx.body = { user: User.user }
      }
      break
    case "userGroup":
      {
        const token = ctx.cookies.get("auth._token.local");
        // 没有token则检查body，注册和重置页面的请求则通过
        if (token && token === "false") ctx.assert("", 400, "no token");
        // 解构token
        const user: UserInfo = await JwtVerify((<string>token).replace("bearer%20", ""));
        ctx.body = { userGroup: user.userGroup };
      }
      break;
    case "logout":
      {
        ctx.body = await new Promise(resolve => {
          resolve({ state: "logout success" });
        });
      }
      break;
    // 用户登陆提供给用户的加密hash
    case "hash":
      {
        const user = body.user as string
        ctx.assert(user, 406, "提交参数无效")
        const isUser = <UserInfo>await Users.findOne({ $or: [{ user }, { mail: user }] }).lean();
        ctx.assert(isUser, 400, "账号不存在");
        const hash = await JwtSign({ user, timeStamp: Date.now() });
        (ctx as KoaCtx).$Event.ClientCache.CacheUserLoginHash.set(user, hash)
        ctx.body = { hash }
      }
      break
    default:
      break;
  }
};
