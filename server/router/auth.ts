import { ParameterizedContext } from "koa";

/* eslint-disable no-console */
import { JwtSign } from "../bin/Secret";
import { BcryptCompare } from "../bin/bcrypt";

import { Users } from "../mongoose/user";
export default async (ctx:ParameterizedContext) => {
  const type = ctx.params.type;
  const body = ctx.request.body;
  switch (type) {
    case "login":
      const { user, passwd } = body;
      const u = await Users.findOne({ $or: [{ user }, { mail: user }] }).lean();

      ctx.assert(u, 400, "userNan");

      const pwStat = await BcryptCompare(passwd, u.passwd);
      console.log(pwStat);
      ctx.assert(pwStat, 400, "passwdError");
      // if (!BcryptCompare(passwd, u.passwd)) ctx.throw(400, "passwdError");
      if (u && pwStat) ctx.body = { token: JwtSign({ payload: { ...u } }) };

      break;
    case "logout":
      ctx.body = await new Promise((resolve) => {
        resolve({ state: "logout success" });
      });
      break;
    default:
      break;
  }
};
