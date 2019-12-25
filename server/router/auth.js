/* eslint-disable no-console */
const { JwtSign } = require("../bin/Secret");
const { BcryptCompare } = require("../bin/bcrypt");

const { Users } = require("../mongoose/user");
module.exports = async (ctx) => {
  const type = ctx.params.type;
  const body = ctx.request.body;
  switch (type) {
    case "login":
      const result = { state: false, msg: "" };
      const { user, passwd } = body;
      const u = await Users.findOne({ $or: [{ user }, { mail: user }] });
      if (!u) result.msg = "账号错误，没有此用户";
      const psSata = BcryptCompare(passwd, u.passwd);
      console.log(psSata);

      if (!psSata) result.msg = "密码错误";
      if (psSata) {
        result.state = true;
        result.msg = "validation success";
        result.token = JwtSign({ payload: { user } });
      }
      ctx.body = result;
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
