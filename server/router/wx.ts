import { ParameterizedContext } from "koa";
import axios, { AxiosResponse } from "axios";
import { Users } from "../mongoose/user";
import { KoaCtx, wxRequestCode2Session, UserInfo, ApolloMongoResult } from "uart";
const wxSecret = require("../key/wxSecret.json");

export default async (Ctx: ParameterizedContext) => {
  const ctx: KoaCtx = Ctx as any;
  const body = ctx.method === "GET" ? ctx.query : ctx.request.body;
  const type = ctx.params.type;

  switch (type) {
    // 微信登录
    case "code2Session":
      {
        // 没有code报错
        ctx.assert(body.js_code, 400, "需要微信code码");
        const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${wxSecret.appid}&secret=${wxSecret.secret}&js_code=${body.js_code}&grant_type=authorization_code`;
        const wxGetseesion = await axios
          .get<any, AxiosResponse<wxRequestCode2Session>>(url)
          .catch(e => {
            console.log(e);
            ctx.throw("code2Session", 400);
          });
        // 包含错误
        ctx.assert(!wxGetseesion.data.errcode, 401, wxGetseesion.data.errmsg);
        const { openid, session_key } = wxGetseesion.data;
        // 检查openid是否为已注册用户
        const user = await Users.findOne({ user: openid }).lean()  as UserInfo
        if (user) {
          ctx.body = {
            ok: 1,
            arg: { user:user.user,userGroup:user.userGroup }
          } as ApolloMongoResult;
        } else {
          ctx.body = {
            ok: 0,
            msg: "微信未绑定平台账号，请先注册使用",
            arg: { openid }
          } as ApolloMongoResult;
        }
      }
      break;
  }
};
