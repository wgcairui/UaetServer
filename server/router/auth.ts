import { JwtSign, JwtVerify } from "../bin/Secret";
import { BcryptCompare } from "../bin/bcrypt";
import { Users } from "../mongoose/user";
import { KoaCtx } from "../bin/interface";
import { ParameterizedContext } from "koa";
export default async (ctx: ParameterizedContext) => {
  const type = ctx.params.type;
  const body = ctx.request.body;
  switch (type) {
    case "login":
      const { user, passwd } = body;
      const u = await Users.findOne({ $or: [{ user }, { mail: user }] }).lean();
      // 是否有u
      ctx.assert(u, 400, "userNan");
      // 密码效验
      const pwStat = await BcryptCompare(passwd, u.passwd);
      ctx.assert(pwStat, 400, "passwdError");

      // if (!BcryptCompare(passwd, u.passwd)) ctx.throw(400, "passwdError");
      if (u && pwStat) ctx.body = { token: JwtSign({ payload: { ...u } }) };

      break;
    case "userGroup":
      {
        const token = ctx.cookies.get("auth._token.local");
        // 没有token则检查body，注册和重置页面的请求则通过
        if (token && token === "false") ctx.assert("", 400, "no token");
        // 解构token
        const user = JwtVerify((<string>token).replace("bearer%20", ""));
        ctx.body = { userGroup: user.userGroup };
      }
      break;
    case "logout":
      ctx.body = await new Promise(resolve => {
        resolve({ state: "logout success" });
      });
      break;
    default:
      break;
  }
};
